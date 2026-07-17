import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

// 어드민 신청자 명단 — 한 행사의 EventApplication 목록 + 행사 요약(정원/세션).
// 연락처는 운영 업무상 전체 노출(입금·출석 확인 필요). 읽기 전용 — 체크 저장은 4-B.

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    const event = await prisma.educationEvent.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        capacity: true,
        feeKrw: true,
        sessions: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          select: { id: true, date: true, startTime: true, endTime: true },
        },
      },
    });
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "행사를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const applications = await prisma.eventApplication.findMany({
      where: { eventId: id, isTest: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        sessionId: true,
        name: true,
        contact: true,
        email: true,
        depositorName: true,
        question: true,
        status: true,
        paidConfirmedAt: true,
        attendedAt: true,
        createdAt: true,
      },
    });

    const appliedCount = applications.filter((a) => a.status === "APPLIED").length;

    return NextResponse.json({
      ok: true,
      event,
      applications,
      appliedCount,
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/education/:id/applicants] get failed", code);
    return NextResponse.json(
      { ok: false, error: "명단을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
