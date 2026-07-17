import { Resend } from "resend";
import {
  escapeAlertHtml,
  getAlertFromAddress,
  getAlertRecipients,
} from "@/lib/alert-email";

// 교육 플랫폼 알림 4종 — 기존 miracle10/otc-apply-alert 패턴 대칭.
// 공통 규칙: RESEND_API_KEY 없으면 조용히 스킵(경고 로그만), 발송 실패가 본 작업을
// 절대 실패시키지 않도록 호출부는 try/catch로 감싼다. 본문에 계좌번호 등 민감정보 미포함.

const ADMIN_EDU_URL = "https://choonsim.com/admin/education";
const PUBLIC_EVENT_URL = (slug: string) =>
  `https://choonsim.com/events/${encodeURIComponent(slug)}`;

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

function fmtSession(s: { date: string; startTime: string; endTime: string }): string {
  const wd = WEEKDAY[new Date(`${s.date}T00:00:00+09:00`).getDay()];
  return `${s.date} (${wd}) ${s.startTime}~${s.endTime}`;
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function wrapHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;color:#111827;margin:0;padding:16px">
${bodyHtml}
</body>
</html>`;
}

function rowsTable(rows: [string, string][]): string {
  const tr = rows
    .map(
      ([label, value]) =>
        `<tr><th style="text-align:left;padding:8px 12px 8px 0;color:#6b7280;font-weight:600;vertical-align:top;white-space:nowrap">${escapeAlertHtml(label)}</th><td style="padding:8px 0;color:#111827">${escapeAlertHtml(value)}</td></tr>`,
    )
    .join("");
  return `<table style="border-collapse:collapse;width:100%;max-width:520px">${tr}</table>`;
}

/* ── 1. 운영자: 새 개설 신청 (건별) ── */

export interface HostApplyAlertPayload {
  eventId: number;
  title: string;
  category: string;
  instructorName: string | null;
  locationName: string | null;
  sessions: { date: string; startTime: string; endTime: string }[];
  hostName: string;
  createdAt: Date;
}

export async function sendEducationHostApplyAlert(
  payload: HostApplyAlertPayload,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[education/host-alert] RESEND_API_KEY not set, skip email");
    return;
  }
  const to = await getAlertRecipients("education");
  if (to.length === 0) return;

  const html = wrapHtml(
    `<p style="margin:0 0 12px">새 교육 행사 개설 신청이 접수되었습니다.</p>` +
      rowsTable([
        ["행사", payload.title],
        ["강사", payload.instructorName ?? "-"],
        ["희망 일시", payload.sessions.map(fmtSession).join(" / ") || "-"],
        ["장소", payload.locationName ?? "-"],
        ["신청자", payload.hostName],
      ]) +
      `<p style="margin:16px 0 0"><a href="${ADMIN_EDU_URL}" style="color:#4338ca">어드민에서 검토 →</a></p>`,
  );

  const { error } = await resend.emails.send({
    from: getAlertFromAddress(),
    to,
    subject: `[춘심 교육] 개설 신청 — ${payload.title}`,
    html,
  });
  if (error) throw new Error(error.message || "Resend send failed");
}

/* ── 2. 운영자: 새 수강 신청 (건별 — 일별 요약 대신. 기존 10모/OTC와 동일 UX) ── */

export interface EduApplyAlertPayload {
  eventId: number;
  eventTitle: string;
  applicantName: string;
  session: { date: string; startTime: string; endTime: string } | null;
  appliedCount: number;
  capacity: number | null;
}

export async function sendEducationApplyAlert(
  payload: EduApplyAlertPayload,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[education/apply-alert] RESEND_API_KEY not set, skip email");
    return;
  }
  const to = await getAlertRecipients("education");
  if (to.length === 0) return;

  const capacityLine =
    payload.capacity != null
      ? `${payload.appliedCount}/${payload.capacity}명`
      : `${payload.appliedCount}명`;

  const html = wrapHtml(
    `<p style="margin:0 0 12px">새 수강 신청이 접수되었습니다.</p>` +
      rowsTable([
        ["행사", payload.eventTitle],
        ["신청자", payload.applicantName],
        ["회차", payload.session ? fmtSession(payload.session) : "-"],
        ["정원 현황", capacityLine],
      ]) +
      `<p style="margin:16px 0 0"><a href="${ADMIN_EDU_URL}/${payload.eventId}/applicants" style="color:#4338ca">신청자 명단 →</a></p>`,
  );

  const { error } = await resend.emails.send({
    from: getAlertFromAddress(),
    to,
    subject: `[춘심 교육] 수강 신청 — ${payload.eventTitle} (${capacityLine})`,
    html,
  });
  if (error) throw new Error(error.message || "Resend send failed");
}

/* ── 3. 교육자: 승인/반려 결과 (hostEmail 스냅샷 — 없으면 스킵) ── */

export interface DecisionEmailPayload {
  decision: "APPROVED" | "REJECTED";
  title: string;
  slug: string;
  hostEmail: string | null;
  hostName: string | null;
  rejectReason: string | null;
}

export async function sendEducationDecisionEmail(
  payload: DecisionEmailPayload,
): Promise<void> {
  if (!payload.hostEmail) return; // 무계정 스냅샷에 이메일이 없으면 조용히 스킵
  const resend = getResend();
  if (!resend) {
    console.warn("[education/decision-email] RESEND_API_KEY not set, skip email");
    return;
  }

  const name = payload.hostName?.trim() || "개설 신청자";
  const approved = payload.decision === "APPROVED";
  const html = wrapHtml(
    approved
      ? `<p style="margin:0 0 12px">${escapeAlertHtml(name)}님, 신청하신 행사가 <strong>승인·공개</strong>되었습니다.</p>` +
          rowsTable([["행사", payload.title]]) +
          `<p style="margin:16px 0 0"><a href="${PUBLIC_EVENT_URL(payload.slug)}" style="color:#4338ca">공개된 행사 페이지 보기 →</a></p>`
      : `<p style="margin:0 0 12px">${escapeAlertHtml(name)}님, 신청하신 행사가 <strong>반려</strong>되었습니다.</p>` +
          rowsTable([
            ["행사", payload.title],
            ["반려 사유", payload.rejectReason ?? "-"],
          ]) +
          `<p style="margin:16px 0 0;color:#6b7280">내용을 보완해 다시 신청하실 수 있습니다.</p>`,
  );

  const { error } = await resend.emails.send({
    from: getAlertFromAddress(),
    to: [payload.hostEmail],
    subject: approved
      ? `[춘심 교육] 행사 승인 — ${payload.title}`
      : `[춘심 교육] 행사 반려 안내 — ${payload.title}`,
    html,
  });
  if (error) throw new Error(error.message || "Resend send failed");
}

/* ── 4. 신청자: 행사 전일 리마인더 (수동 트리거 — 어드민 버튼) ──
 * ★ 제약: EventApplication에 이메일 필드가 없어(스키마 무변경) contact가 이메일 형태(@)인
 *   신청자에게만 발송 가능. 전화번호 신청자는 skippedNoEmail로 집계·로그.
 * 발송 방식: 개별 send 루프(수신자별 try/catch·실패 로깅) — 규모(정원≤40)가 작고
 *   배치 API 대비 건별 실패 추적이 명확해서. */

export interface ReminderPayload {
  eventTitle: string;
  slug: string;
  locationName: string | null;
  sessions: { date: string; startTime: string; endTime: string }[];
  preparation: string | null;
  notice: string | null;
  recipients: { name: string; contact: string }[];
}

export interface ReminderResult {
  attempted: number;
  sent: number;
  skippedNoEmail: number;
  failed: number;
}

export async function sendEducationReminders(
  payload: ReminderPayload,
): Promise<ReminderResult> {
  const emailish = payload.recipients.filter((r) => r.contact.includes("@"));
  const result: ReminderResult = {
    attempted: payload.recipients.length,
    sent: 0,
    skippedNoEmail: payload.recipients.length - emailish.length,
    failed: 0,
  };

  const resend = getResend();
  if (!resend) {
    console.warn("[education/reminder] RESEND_API_KEY not set, skip all");
    return result;
  }
  if (emailish.length === 0) return result;

  const rows: [string, string][] = [
    ["행사", payload.eventTitle],
    ["일시", payload.sessions.map(fmtSession).join(" / ") || "-"],
    ["장소", payload.locationName ?? "-"],
  ];
  if (payload.preparation) rows.push(["준비물", payload.preparation]);
  if (payload.notice) rows.push(["유의사항", payload.notice]);

  const from = getAlertFromAddress();
  for (const r of emailish) {
    const html = wrapHtml(
      `<p style="margin:0 0 12px">${escapeAlertHtml(r.name)}님, 신청하신 행사가 곧 열립니다.</p>` +
        rowsTable(rows) +
        `<p style="margin:16px 0 0"><a href="${PUBLIC_EVENT_URL(payload.slug)}" style="color:#4338ca">행사 안내 페이지 →</a></p>`,
    );
    try {
      const { error } = await resend.emails.send({
        from,
        to: [r.contact],
        subject: `[춘심 교육] 내일 행사 안내 — ${payload.eventTitle}`,
        html,
      });
      if (error) throw new Error(error.message);
      result.sent += 1;
    } catch (err) {
      result.failed += 1;
      console.error("[education/reminder] send failed", r.contact, err);
    }
  }
  return result;
}
