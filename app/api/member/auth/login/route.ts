import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  MEMBER_SESSION_COOKIE,
  MEMBER_SESSION_MAX_AGE_SEC,
  createMemberToken,
} from "@/lib/member-session";
import { allowMemberLogin, clientIpOf } from "@/lib/member-rate-limit";

export const runtime = "nodejs";

// 회원 로그인 — 이메일 미인증이어도 로그인 허용(미인증 안내는 B-2 화면에서, 과한 차단 회피).
// 존재 여부를 숨기기 위해 이메일/비번 오류 메시지는 동일하게.

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const ip = clientIpOf(request);
  if (!allowMemberLogin(ip)) {
    return bad("요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.", 429);
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return bad("잘못된 요청입니다.");
  }
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return bad("이메일과 비밀번호를 입력해 주세요.");
  }

  try {
    const member = await prisma.member.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        status: true,
        provider: true,
      },
    });
    // 구글 전용 계정(passwordHash null)은 비번 로그인 불가 — 동일 메시지로 응답
    if (!member || !member.passwordHash) {
      return bad("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
    }
    const ok = await bcrypt.compare(password, member.passwordHash);
    if (!ok) return bad("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
    if (member.status !== "ACTIVE") {
      return bad("이용이 제한된 계정입니다.", 403);
    }

    const token = await createMemberToken({
      memberId: member.id,
      email: member.email,
      name: member.name,
    });
    const res = NextResponse.json({
      ok: true,
      member: { id: member.id, email: member.email, name: member.name },
    });
    res.cookies.set(MEMBER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MEMBER_SESSION_MAX_AGE_SEC,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[member/login] failed", err);
    return bad("로그인에 실패했습니다.", 500);
  }
}
