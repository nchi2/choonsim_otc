import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  MEMBER_SESSION_COOKIE,
  MEMBER_SESSION_MAX_AGE_SEC,
  createMemberToken,
} from "@/lib/member-session";

export const runtime = "nodejs";

// 구글 OAuth 콜백 — code를 구글 token 엔드포인트와 직접(TLS) 교환하므로
// 응답의 id_token 페이로드는 서명 재검증 없이 신뢰 가능(표준 관행).
// 계정 매칭: providerAccountId(구글 sub) 우선 → 이메일 일치 시 기존 계정에 연결(구글이
// email_verified를 보증할 때만) → 없으면 신규 가입(provider=google, 비번 없음, 전화는 추후 보완).

function fail(request: Request, reason: string) {
  return NextResponse.redirect(new URL(`/?google=${reason}`, request.url));
}

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return fail(request, "disabled");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieHeader = request.headers.get("cookie") ?? "";
  const stateCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${GOOGLE_OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return fail(request, "state");
  }

  try {
    const origin = url.origin;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/member/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = (await tokenRes.json()) as {
      id_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!tokenRes.ok || !tokenJson.id_token) {
      // 진단 로그 — 구글 에러 본문(민감정보 없음)과 사용한 redirect_uri를 남긴다.
      // (Step 13에서 추가: invalid_client=시크릿 불일치 / redirect_uri_mismatch / invalid_grant=code 만료·재사용)
      console.error(
        "[member/google/callback] token exchange failed",
        tokenRes.status,
        tokenJson.error ?? "(no error field)",
        tokenJson.error_description ?? "",
        "redirect_uri=",
        `${origin}/api/member/auth/google/callback`,
      );
      return fail(request, "token");
    }

    // id_token payload 디코드(직접 교환 응답 — 신뢰 가능)
    const payloadB64 = tokenJson.id_token.split(".")[1] ?? "";
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    const googleSub = payload.sub;
    const email = payload.email?.trim().toLowerCase();
    const name = payload.name?.trim() || email?.split("@")[0] || "회원";
    if (!googleSub || !email) return fail(request, "profile");

    // ① 구글 sub로 기존 연결 찾기 → ② 이메일 일치 시 연결(구글 인증 이메일만) → ③ 신규
    let member = await prisma.member.findFirst({
      where: { provider: "google", providerAccountId: googleSub },
      select: { id: true, email: true, name: true, status: true },
    });
    if (!member) {
      const byEmail = await prisma.member.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, status: true, providerAccountId: true },
      });
      if (byEmail) {
        if (payload.email_verified !== true) return fail(request, "unverified");
        member = await prisma.member.update({
          where: { id: byEmail.id },
          data: {
            providerAccountId: byEmail.providerAccountId ?? googleSub,
            // 구글이 이메일 소유를 보증 — 미인증 계정이면 인증 처리
            emailVerifiedAt: new Date(),
          },
          select: { id: true, email: true, name: true, status: true },
        });
      } else {
        member = await prisma.member.create({
          data: {
            email,
            name,
            provider: "google",
            providerAccountId: googleSub,
            passwordHash: null,
            phone: null, // 구글 가입은 전화 미보유 — 마이페이지에서 보완(B-2)
            emailVerifiedAt: payload.email_verified === true ? new Date() : null,
          },
          select: { id: true, email: true, name: true, status: true },
        });
      }
    }
    if (member.status !== "ACTIVE") return fail(request, "suspended");

    const sessionToken = await createMemberToken({
      memberId: member.id,
      email: member.email,
      name: member.name,
    });
    const res = NextResponse.redirect(new URL("/", request.url));
    res.cookies.set(MEMBER_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MEMBER_SESSION_MAX_AGE_SEC,
      path: "/",
    });
    res.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("[member/google/callback] failed", err);
    return fail(request, "error");
  }
}
