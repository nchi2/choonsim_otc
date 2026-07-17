// [2-A 데모] 교육 UI 토대 최소 데모 — 시드 데이터로 컴포넌트가 렌더되는지 확인용.
// ★ 실제 /events 목록 페이지 조립은 Step 2-B(Opus)가 이 파일을 대체한다.
// 서버 컴포넌트: 공개 노출 조건(APPROVED + isPublished + !isTest)으로 조회해
// EventCardData로 매핑, 클라이언트 데모에 전달. 공개 API는 Step 3에서 신설 예정.

import { prisma } from "@/lib/prisma";
import { todayKst } from "@/lib/kst";
import type { EventCardData } from "@/components/education/types";
import { FoundationDemo } from "./FoundationDemo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadPublishedEvents(): Promise<EventCardData[]> {
  const today = todayKst();
  const rows = await prisma.educationEvent.findMany({
    where: { status: "APPROVED", isPublished: true, isTest: false },
    orderBy: { id: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      mode: true,
      posterUrl: true,
      customLocation: true,
      feeKrw: true,
      capacity: true,
      isFeatured: true,
      office: { select: { name: true } },
      sessions: {
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        select: { date: true, startTime: true, endTime: true },
      },
      _count: {
        select: { applications: { where: { status: "APPLIED", isTest: false } } },
      },
    },
  });

  return rows.map((r) => {
    // 대표 세션 = 가장 이른 "오늘 이후" 세션, 전부 지났으면 마지막 세션
    const upcoming = r.sessions.find((s) => s.date >= today);
    const session = upcoming ?? r.sessions[r.sessions.length - 1] ?? null;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      mode: r.mode,
      posterUrl: r.posterUrl,
      locationName: r.office?.name ?? r.customLocation ?? null,
      feeKrw: r.feeKrw,
      capacity: r.capacity,
      applicationCount: r._count.applications,
      session,
      sessionCount: r.sessions.length,
      isFeatured: r.isFeatured,
    };
  });
}

export default async function EventsFoundationDemoPage() {
  const events = await loadPublishedEvents();
  return <FoundationDemo events={events} />;
}
