// /events/calendar — 공개 행사 캘린더. 공개 행사의 모든 세션을 조회해(소규모) 클라 캘린더에 전달.
// MonthCalendar를 dayEvents opt-in으로만 사용(시그니처 변경 없음). 비회원 열람 가능.

import type { Metadata } from "next";
import { addDaysKstYmd, todayKst } from "@/lib/kst";
import { loadCalendarSessions } from "@/lib/education-public";
import { CalendarClient } from "./CalendarClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "행사 캘린더 — Choonsim Hub",
  description: "모빅회관 교육 행사 일정을 달력으로 확인하세요.",
};

export default async function EventsCalendarPage() {
  const today = todayKst();
  // 브라우즈용 넓은 범위(±1년) — 세션 데이터가 작아 한 번에 로드.
  const sessions = await loadCalendarSessions(
    addDaysKstYmd(today, -365),
    addDaysKstYmd(today, 365),
  );
  return <CalendarClient sessions={sessions} today={today} />;
}
