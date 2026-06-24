const DEFAULT_ALERT_EMAILS = [
  "choonsim.dev@gmail.com",
] as const;

const DEFAULT_FROM = "onboarding@resend.dev";

export function getAlertEmails(): string[] {
  const raw = process.env.ALERT_EMAILS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
  }
  return [...DEFAULT_ALERT_EMAILS];
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
