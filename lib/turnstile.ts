// Cloudflare Turnstile 검증 훅 — "자리만" (Step 3).
// ★ 켜는 법: 환경변수 2개만 꽂으면 됨.
//   - TURNSTILE_SECRET_KEY        → 이 파일의 서버 검증이 활성화됨
//   - NEXT_PUBLIC_TURNSTILE_SITE_KEY → 프런트 위젯 렌더 활성화(폼의 스텁 주석 참조)
// 시크릿이 없으면(dev/키 발급 전) 검증을 건너뛰고 통과시킨다.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  ok: boolean;
  /** 시크릿 미설정으로 검증을 건너뛴 경우 true */
  skipped: boolean;
}

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    // 키 발급 전 — 검증 생략(통과). 키를 꽂는 순간 아래 실검증 경로가 켜진다.
    return { ok: true, skipped: true };
  }
  if (!token) return { ok: false, skipped: false };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const json = (await res.json()) as { success?: boolean };
    return { ok: json.success === true, skipped: false };
  } catch (err) {
    // Cloudflare 장애 시 신청 자체를 막지 않는다(가용성 우선) — 로그만 남김.
    console.warn("[turnstile] verify failed, allowing request", err);
    return { ok: true, skipped: false };
  }
}
