import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";
import {
  issueVerificationToken,
  sendVerificationEmail,
} from "@/lib/member-emails";
import { allowResendVerification, clientIpOf } from "@/lib/member-rate-limit";

export const runtime = "nodejs";

// 인증 메일 재발송 — 로그인 회원 본인만, IP 레이트리밋(기본 3/분)으로 남용 방지.

export async function POST(request: Request) {
  const ip = clientIpOf(request);
  if (!allowResendVerification(ip)) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }

  const session = await getMemberUser();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
      select: { id: true, email: true, name: true, emailVerifiedAt: true },
    });
    if (!member) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    if (member.emailVerifiedAt != null) {
      return NextResponse.json(
        { ok: false, error: "이미 인증된 이메일입니다." },
        { status: 400 },
      );
    }

    const token = await issueVerificationToken(member.id);
    const origin = new URL(request.url).origin;
    await sendVerificationEmail(origin, member.email, member.name, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[member/resend-verification] failed", err);
    return NextResponse.json(
      { ok: false, error: "발송에 실패했습니다." },
      { status: 500 },
    );
  }
}
