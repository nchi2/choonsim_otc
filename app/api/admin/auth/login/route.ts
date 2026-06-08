import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "사용자명과 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!adminUsername || !adminPassword || !secret) {
    console.error("[admin/login] ADMIN_USERNAME/ADMIN_PASSWORD/SESSION_SECRET not set");
    return NextResponse.json(
      { error: "서버 설정 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  if (username !== adminUsername || password !== adminPassword) {
    return NextResponse.json(
      { error: "사용자명 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SEC,
    path: "/",
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
