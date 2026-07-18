import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";

export const runtime = "nodejs";

// 내 회원 정보 — 세션 uid 기준. passwordHash 등 민감값 미노출.
// (참고: /api/member/auth/* 는 미들웨어 예외라 여기서 직접 세션 검증)

export async function GET() {
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
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerifiedAt: true,
        provider: true,
        educatorStatus: true,
        status: true,
        createdAt: true,
      },
    });
    if (!member || member.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json({ ok: true, member });
  } catch (err) {
    console.error("[member/me] failed", err);
    return NextResponse.json(
      { ok: false, error: "정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
