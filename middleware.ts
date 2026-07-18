import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";
import { MEMBER_SESSION_COOKIE, verifyMemberToken } from "@/lib/member-session";

/**
 * 보호 구역 2개 — 세션이 완전히 분리돼 교차 통과 불가:
 *  - /admin/**·/api/admin/**  → admin_session (sub="admin"만 통과, 기존 로직 무변경)
 *  - /mypage/**·/api/member/** → member_session (sub="member"만 통과)
 * 예외: /admin/login·/api/admin/auth/*·/api/member/auth/* 는 공개.
 * 그 외 공개 페이지(/events·/host·/otc 등)와 비로그인 신청 API는 미들웨어 대상 아님.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 회원 구역 ──
  if (pathname.startsWith("/mypage") || pathname.startsWith("/api/member")) {
    if (pathname.startsWith("/api/member/auth/")) return NextResponse.next();

    const memberToken = request.cookies.get(MEMBER_SESSION_COOKIE)?.value;
    if (await verifyMemberToken(memberToken)) return NextResponse.next();

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    // 로그인 화면은 B-2에서 — 그때 /login 으로 변경 예정
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── 운영자 구역 (기존 로직 그대로) ──
  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname.startsWith("/api/admin/auth/")) return NextResponse.next();

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);
  if (valid) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/mypage/:path*",
    "/api/member/:path*",
  ],
};
