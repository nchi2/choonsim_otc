import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // `/admin` 경로 접근 시 인증 확인 (단, `/admin/login`은 제외)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    const sessionToken = request.cookies.get("admin_session");

    // 세션이 없으면 로그인 페이지로 리다이렉트
    if (!sessionToken) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

