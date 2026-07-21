import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  MEMBER_SESSION_COOKIE,
  MEMBER_SESSION_MAX_AGE_SEC,
  createMemberToken,
} from "@/lib/member-session";
import {
  issueVerificationToken,
  sendVerificationEmail,
} from "@/lib/member-emails";
import { allowMemberSignup, clientIpOf } from "@/lib/member-rate-limit";

export const runtime = "nodejs";

// 자체가입 — 이메일+비밀번호+이름+전화(필수). 가입 즉시 로그인 세션 발급(미인증 배지로 안내는 B-2).
// 인증 메일 발송 실패해도 가입은 성공 유지.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const ip = clientIpOf(request);
  if (!allowMemberSignup(ip)) {
    return bad("요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!email || email.length > 100 || !EMAIL_RE.test(email)) {
    return bad("이메일 형식이 올바르지 않습니다.");
  }
  if (password.length < 8 || password.length > 100) {
    return bad("비밀번호는 8자 이상이어야 합니다.");
  }
  if (!name || name.length > 50) return bad("이름을 입력해 주세요.");
  if (!phone || phone.length > 30) return bad("전화번호를 입력해 주세요.");

  try {
    const existing = await prisma.member.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return bad("이미 가입된 이메일입니다.", 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const member = await prisma.member.create({
      data: { email, passwordHash, name, phone, provider: "local" },
      select: { id: true, email: true, name: true },
    });

    // 인증 메일 — 실패해도 가입 성공 유지
    try {
      const token = await issueVerificationToken(member.id);
      const origin = new URL(request.url).origin;
      await sendVerificationEmail(origin, member.email, member.name, token);
    } catch (mailErr) {
      console.error("[member/signup] verification email failed", mailErr);
    }

    const sessionToken = await createMemberToken({
      memberId: member.id,
      email: member.email,
      name: member.name,
    });
    const res = NextResponse.json({ ok: true, member });
    res.cookies.set(MEMBER_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MEMBER_SESSION_MAX_AGE_SEC,
      path: "/",
    });
    return res;
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    if (code === "P2002") return bad("이미 가입된 이메일입니다.", 409);
    console.error("[member/signup] failed", code);
    return bad("가입에 실패했습니다.", 500);
  }
}
