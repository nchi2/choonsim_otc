// 신청 알림 이메일 공통 — 수신자·발신자 결정.
// 수신자 = AdminUser.email이 채워진 운영자 전원(DB). env ALERT_EMAILS는 fallback.
import { prisma } from "@/lib/prisma";

const DEFAULT_ALERT_EMAILS = [
  "choonsim.dev@gmail.com",
] as const;

const DEFAULT_FROM = "onboarding@resend.dev";

/** env/기본값 fallback — DB 조회 실패·비어있음 대비. */
function getFallbackAlertEmails(): string[] {
  const raw = process.env.ALERT_EMAILS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
  }
  return [...DEFAULT_ALERT_EMAILS];
}

/**
 * 알림 수신자 — AdminUser.email 채워진 전원.
 * DB에 하나도 없거나 조회 실패 시 env(ALERT_EMAILS)/기본값으로 폴백.
 */
export async function getAlertRecipients(): Promise<string[]> {
  try {
    const admins = await prisma.adminUser.findMany({
      where: { email: { not: null } },
      select: { email: true },
    });
    const emails = admins
      .map((a) => a.email?.trim() ?? "")
      .filter((e) => e.includes("@"));
    if (emails.length > 0) return [...new Set(emails)];
  } catch (err) {
    console.warn("[alert-email] DB 수신자 조회 실패 — env 폴백", err);
  }
  return getFallbackAlertEmails();
}

export function getAlertFromAddress(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_FROM;
}

export function escapeAlertHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
