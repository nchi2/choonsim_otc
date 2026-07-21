import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  createSessionToken,
} from "@/lib/admin-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "사용자명과 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error("[admin/login] SESSION_SECRET not set");
    return NextResponse.json(
      { error: "서버 설정 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        displayName: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자명 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "사용자명 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    // 비활성화된 계정은 로그인 차단(Step 27) — 비밀번호 확인 후 검사(계정 존재 여부 노출 최소화).
    if (!user.isActive) {
      return NextResponse.json(
        { error: "비활성화된 계정입니다. 총괄 운영자에게 문의해 주세요." },
        { status: 403 },
      );
    }

    const token = await createSessionToken({
      adminUserId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SEC,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      displayName: user.displayName,
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/login] failed", code);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
