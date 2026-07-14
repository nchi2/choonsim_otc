import { Resend } from "resend";
import { fmtKstMinute, formatKstYmdLong } from "@/lib/kst";
import { getAlertFromAddress, getAlertRecipients } from "@/lib/alert-email";

const ADMIN_MIRACLE10_URL = "https://choonsim.com/admin/miracle10";

export interface Miracle10ApplyAlertPayload {
  applicationNo: string;
  name: string;
  contact: string;
  quantity: number;
  visitType: string;
  visitDate: string | null;
  reservedStart: string | null;
  visitTimeSlot: string | null;
  officeName: string | null;
  memo: string | null;
  createdAt: Date;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function visitTypeLabel(visitType: string): string {
  if (visitType === "RESERVED") return "직접 방문 (예약일 지정)";
  if (visitType === "WALK_IN") return "예약 없이 방문";
  return visitType;
}

function formatVisitSchedule(payload: Miracle10ApplyAlertPayload): string {
  if (payload.visitType !== "RESERVED") return "-";
  const parts: string[] = [];
  if (payload.visitDate) {
    parts.push(formatKstYmdLong(payload.visitDate) ?? payload.visitDate);
  }
  if (payload.reservedStart) {
    parts.push(`${payload.reservedStart} 시작`);
  } else if (payload.visitTimeSlot) {
    parts.push(payload.visitTimeSlot);
  }
  return parts.length > 0 ? parts.join(" · ") : "-";
}

function buildAlertHtml(payload: Miracle10ApplyAlertPayload): string {
  const rows: [string, string][] = [
    ["접수번호", payload.applicationNo],
    ["이름", payload.name],
    ["연락처", payload.contact],
    ["수량", `${payload.quantity}모`],
    ["방문 방식", visitTypeLabel(payload.visitType)],
    ["예약 일·시간", formatVisitSchedule(payload)],
    ["사무실", payload.officeName ?? "-"],
    ["메모", payload.memo?.trim() ? payload.memo.trim() : "-"],
    ["접수 시각", fmtKstMinute(payload.createdAt)],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><th style="text-align:left;padding:8px 12px 8px 0;color:#6b7280;font-weight:600;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</th><td style="padding:8px 0;color:#111827">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ko">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.5;color:#111827;margin:0;padding:16px">
  <p style="margin:0 0 12px">새 10모 All-in-One 신청이 접수되었습니다.</p>
  <table style="border-collapse:collapse;width:100%;max-width:520px">${tableRows}</table>
  <p style="margin:16px 0 0"><a href="${ADMIN_MIRACLE10_URL}" style="color:#4338ca">어드민에서 확인 →</a></p>
</body>
</html>`;
}

/** 운영자 알림 메일 — RESEND_API_KEY 없으면 조용히 스킵. */
export async function sendMiracle10ApplyAlert(
  payload: Miracle10ApplyAlertPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[miracle10/apply-alert] RESEND_API_KEY not set, skip email");
    return;
  }

  const resend = new Resend(apiKey);
  const subject = `[춘심] All-in-One 신청 — ${payload.name} ${payload.quantity}모`;

  const { error } = await resend.emails.send({
    from: getAlertFromAddress(),
    to: await getAlertRecipients(),
    subject,
    html: buildAlertHtml(payload),
  });

  if (error) {
    throw new Error(error.message || "Resend send failed");
  }
}
