import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/member-session";

export const runtime = "nodejs";

// 구글 OAuth 시작 — env 게이트: GOOGLE_CLIENT_ID/SECRET 없으면 비활성(홈으로 안내 리다이렉트).
// 외부 라이브러리(NextAuth 등) 미도입 — 자체 admin/member 세션과의 충돌 원천 차단(직접 구현).
// CSRF: state 랜덤값을 httpOnly 쿠키에 두고 콜백에서 대조.

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    // 키 미발급 상태 — 구글 경로 비활성(B-2 화면도 이때 버튼 숨김)
    return NextResponse.redirect(new URL("/?google=disabled", request.url));
  }

  const origin = new URL(request.url).origin;
  const state = randomBytes(16).toString("hex");
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set(
    "redirect_uri",
    `${origin}/api/member/auth/google/callback`,
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10분
    path: "/",
  });
  return res;
}
