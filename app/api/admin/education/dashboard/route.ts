import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducationManager } from "@/lib/education-admin-guard";
import { addDaysKstYmd, todayKst } from "@/lib/kst";

export const runtime = "nodejs";

// 교육 대시보드 단일 엔드포인트 (Step 16) — manageEducation 게이트.
// ① 승인 대기 개설 신청 ② 교육자 자격 신청 대기 ③ 이번 주 예정 행사
// ④ 입금 확인 대기(유료) ⑤ 정원 임박·마감. 테스트 데이터(isTest)는 집계에서 제외.

const NEAR_FULL_RATIO = 0.8;

export async function GET() {
  const gate = await requireEducationManager();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const today = todayKst();
  const weekEnd = addDaysKstYmd(today, 7);

  try {
    const [pendingEvents, pendingEducators, depositPending, weekSessions, capacityEvents] =
      await Promise.all([
        prisma.educationEvent.count({
          where: { status: "PENDING", isTest: false },
        }),
        prisma.member.count({ where: { educatorStatus: "PENDING" } }),
        // 유료 행사(feeKrw>0)의 유효 신청 중 입금 미확인 건
        prisma.eventApplication.count({
          where: {
            status: "APPLIED",
            isTest: false,
            paidConfirmedAt: null,
            event: { status: "APPROVED", feeKrw: { gt: 0 }, isTest: false },
          },
        }),
        // 이번 주(오늘~+7일) 회차 — 행사 단위로 묶어 첫 회차만 표시
        prisma.eventSession.findMany({
          where: {
            date: { gte: today, lt: weekEnd },
            event: { status: "APPROVED", isTest: false },
          },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          take: 100,
          select: {
            date: true,
            startTime: true,
            event: { select: { id: true, title: true } },
          },
        }),
        // 정원 있는 승인·공개 행사 — 유효 신청 수와 함께 (임박·마감 판정)
        prisma.educationEvent.findMany({
          where: {
            status: "APPROVED",
            isPublished: true,
            isTest: false,
            capacity: { not: null },
          },
          select: {
            id: true,
            title: true,
            capacity: true,
            _count: {
              select: {
                applications: { where: { status: "APPLIED", isTest: false } },
              },
            },
          },
          take: 200,
        }),
      ]);

    // 행사 단위 dedupe — 이번 주 첫 회차 기준
    const weekMap = new Map<number, { id: number; title: string; date: string; startTime: string }>();
    for (const s of weekSessions) {
      if (!weekMap.has(s.event.id)) {
        weekMap.set(s.event.id, {
          id: s.event.id,
          title: s.event.title,
          date: s.date,
          startTime: s.startTime,
        });
      }
    }

    const nearFull = capacityEvents
      .map((e) => ({
        id: e.id,
        title: e.title,
        capacity: e.capacity as number,
        applied: e._count.applications,
      }))
      .filter((e) => e.capacity > 0 && e.applied >= e.capacity * NEAR_FULL_RATIO)
      .sort((a, b) => b.applied / b.capacity - a.applied / a.capacity)
      .slice(0, 10)
      .map((e) => ({ ...e, full: e.applied >= e.capacity }));

    return NextResponse.json({
      ok: true,
      pendingEvents,
      pendingEducators,
      depositPending,
      weekEvents: [...weekMap.values()],
      nearFull,
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/education/dashboard] failed", code);
    return NextResponse.json(
      { ok: false, error: "교육 대시보드를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
