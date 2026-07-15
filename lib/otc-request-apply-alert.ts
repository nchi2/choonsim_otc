import { Resend } from "resend";
import { fmtKstMinute, formatKstYmdLong } from "@/lib/kst";
import { getAlertFromAddress, getAlertRecipients } from "@/lib/alert-email";
import { otcSideLabel } from "@/lib/otc-request-status";

// BMB OTC 신청(otc-request) 운영자 알림 — 10모(miracle10-apply-alert)와 대칭 구조.
// ★ 계좌번호·지갑주소 등 민감정보는 본문에 넣지 않는다(이름·연락처·구분·수량·희망가·방문일만).

const ADMIN_OTC_URL = "https://choonsim.com/admin/otc-requests";

export interface OtcRequestApplyAlertPayload {
  applicationNo: string;
  side: string; // "BUY" | "SELL"
  name: string;
  contact: string;
  quantity: number;
  desiredPrice: number | null;
  visitDate: string | null;
  reservedStart: string | null;
  officeName: string | null;
  createdAt: Date;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatVisitSchedule(payload: OtcRequestApplyAlertPayload): string {
  const parts: string[] = [];
  if (payload.visitDate) {
    parts.push(formatKstYmdLong(payload.visitDate) ?? payload.visitDate);
  }
  if (payload.reservedStart) parts.push(`${payload.reservedStart} 시작`);
  if (payload.officeName) parts.push(payload.officeName);
  return parts.length > 0 ? parts.join(" · ") : "-";
}

function buildAlertHtml(payload: OtcRequestApplyAlertPayload): string {
  const rows: [string, string][] = [
    ["접수번호", payload.applicationNo],
    ["구분", `BMB ${otcSideLabel(payload.side)}`],
    ["이름", payload.name],
    ["연락처", payload.contact],
    ["수량", `${payload.quantity}모`],
    [
      "희망가",
      payload.desiredPrice != null
        ? `${payload.desiredPrice.toLocaleString("ko-KR")}원`
        : "-",
    ],
    ["방문 일정", formatVisitSchedule(payload)],
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
  <p style="margin:0 0 12px">새 BMB ${escapeHtml(otcSideLabel(payload.side))} 신청이 접수되었습니다.</p>
  <table style="border-collapse:collapse;width:100%;max-width:520px">${tableRows}</table>
  <p style="margin:16px 0 0"><a href="${ADMIN_OTC_URL}" style="color:#4338ca">어드민에서 확인 →</a></p>
</body>
</html>`;
}

/** 운영자 알림 메일 — RESEND_API_KEY 없으면 조용히 스킵. */
export async function sendOtcRequestApplyAlert(
  payload: OtcRequestApplyAlertPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[otc-request/apply-alert] RESEND_API_KEY not set, skip email");
    return;
  }

  const resend = new Resend(apiKey);
  const subject = `[춘심] BMB ${otcSideLabel(payload.side)} 신청 — ${payload.name} ${payload.quantity}모`;

  const { error } = await resend.emails.send({
    from: getAlertFromAddress(),
    to: await getAlertRecipients("otc"),
    subject,
    html: buildAlertHtml(payload),
  });

  if (error) {
    throw new Error(error.message || "Resend send failed");
  }
}
