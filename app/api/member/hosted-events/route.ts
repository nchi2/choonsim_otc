import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";

export const runtime = "nodejs";

// 내가 연 강의 — hostMemberId=본인 행사 목록(제목·상태·공개 여부·신청자 수). 읽기 전용.
// ★ 미들웨어(/api/member 보호) + getMemberUser 이중 가드.

export async function GET() {
  const session = await getMemberUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.educationEvent.findMany({
      where: { hostMemberId: session.memberId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        isPublished: true,
        rejectReason: true,
        createdAt: true,
        sessions: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          select: { date: true, startTime: true },
          take: 1,
        },
        _count: {
          select: { applications: { where: { status: "APPLIED", isTest: false } } },
        },
      },
    });
    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      isPublished: r.isPublished,
      rejectReason: r.rejectReason,
      createdAt: r.createdAt,
      firstSession: r.sessions[0] ?? null,
      applicationCount: r._count.applications,
    }));
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[member/hosted-events] failed", err);
    return NextResponse.json(
      { ok: false, error: "목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
