// /events — 공개 행사 목록. 서버에서 공개 행사 카드 + 활성 회관을 조회해 클라이언트에 전달.
// 필터·URL 동기화는 EventsListClient(클라). 공개 조건은 lib/education-public 표준.

import { Suspense } from "react";
import type { Metadata } from "next";
import { loadPublishedEventCards, loadActiveOffices } from "@/lib/education-public";
import { todayKst } from "@/lib/kst";
import { EventsListClient } from "./EventsListClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "행사 찾기 — Choonsim Hub",
  description: "BMB·SBMB 강연·실습·이벤트. 모빅회관에서 열리는 교육 행사를 찾아보세요.",
};

export default async function EventsPage() {
  const [events, offices] = await Promise.all([
    loadPublishedEventCards(),
    loadActiveOffices(),
  ]);

  return (
    <Suspense fallback={null}>
      <EventsListClient events={events} offices={offices} today={todayKst()} />
    </Suspense>
  );
}
