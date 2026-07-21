// 회원 인증 공개 POST용 IP 레이트리밋 — education-rate-limit와 동일 패턴(인메모리 슬라이딩 윈도우).
// 서버리스 인스턴스별 한도(버스트 억제용). env로 조정: MEMBER_RATE_*_MAX.

const WINDOW_MS = 60_000;

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

const buckets = new Map<string, number[]>();

function allow(key: string, max: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

/** 가입 — 기본 분당 5회/IP */
export function allowMemberSignup(ip: string): boolean {
  return allow(`m-signup:${ip}`, envInt("MEMBER_RATE_SIGNUP_MAX", 5));
}

/** 로그인 — 기본 분당 10회/IP (브루트포스 억제) */
export function allowMemberLogin(ip: string): boolean {
  return allow(`m-login:${ip}`, envInt("MEMBER_RATE_LOGIN_MAX", 10));
}

/** 인증 메일 재발송 — 기본 분당 3회/IP */
export function allowResendVerification(ip: string): boolean {
  return allow(`m-resend:${ip}`, envInt("MEMBER_RATE_RESEND_MAX", 3));
}

export function clientIpOf(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
