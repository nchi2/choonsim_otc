"use client";

// 공개 캘린더 — MonthCalendar(dayEvents opt-in) + 선택일 행사 리스트.
// 세션 전체를 미리 받아 날짜맵으로 구성 → 월 이동 시 재조회 없이 표시(작은 데이터셋).

import { useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { addDaysKstYmd, todayKst } from "@/lib/kst";
import MonthCalendar, {
  type MonthCalendarDayEvent,
} from "@/components/admin/MonthCalendar";
import { PublicShell } from "@/components/education/PublicShell";
import { CategoryBadge } from "@/components/education/Badge";
import { eduColors, eduLayout } from "@/components/education/tokens";
import type { CalendarSessionItem } from "@/lib/education-public";

const PageTitle = styled.h1`
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: ${eduColors.text};
`;
const PageSub = styled.p`
  margin: 0 0 1.1rem;
  font-size: 0.85rem;
  color: ${eduColors.textMuted};
`;

const Layout = styled.div`
  display: grid;
  /* ★ minmax(0, 1fr): 1fr(=minmax(auto,1fr))의 auto 최소값 = 컬럼 내 아이템 min-content 최대값.
   * DayPanel의 RowTitle(nowrap·긴 제목)이 min-width:0 없이 큰 min-content를 유지해 모바일 단일
   * 컬럼을 화면보다 넓게 밀어올렸고(그 위 캘린더까지 같이 넓어져 우측 토요일 열이 잘림), min을
   * 0으로 잡아 컬럼이 화면 폭 안에서 축소되게 한다. 내용은 각자 overflow:hidden으로 클립. */
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: ${eduLayout.maxWidth - 200}px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const CalWrap = styled.div`
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  padding: 0.5rem;
  background: ${eduColors.surface};
`;

const DayPanel = styled.aside`
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  padding: 1rem;
  background: ${eduColors.surface};
`;

const DayTitle = styled.h2`
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

const Row = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.5rem;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  border: 1px solid ${eduColors.border};
  margin-bottom: 0.5rem;

  &:hover {
    border-color: ${eduColors.primaryBorder};
    background: ${eduColors.primarySofter};
  }
`;

const RowTime = styled.span`
  font-size: 0.82rem;
  font-weight: 800;
  color: ${eduColors.primary};
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
`;

const RowTitle = styled.span`
  font-size: 0.85rem;
  color: ${eduColors.textSub};
  font-weight: 600;
  /* flex 아이템은 min-width:auto라 nowrap 텍스트가 안 줄어들어 말줄임이 동작하지 않았다.
   * min-width:0으로 축소를 허용해 말줄임이 실제로 걸리게(오버플로우 방지에도 기여). */
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyDay = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${eduColors.textFaint};
`;

export function CalendarClient({
  sessions,
  today,
}: {
  sessions: CalendarSessionItem[];
  today: string;
}) {
  const [selected, setSelected] = useState<string>(today);

  // 날짜맵: 캘린더 점(dayEvents) + 선택일 리스트 원본
  const byDate = useMemo(() => {
    const m = new Map<string, CalendarSessionItem[]>();
    for (const s of sessions) {
      const arr = m.get(s.date) ?? [];
      arr.push(s);
      m.set(s.date, arr);
    }
    return m;
  }, [sessions]);

  const dayEvents = useMemo(() => {
    const rec: Record<string, MonthCalendarDayEvent[]> = {};
    for (const [date, items] of byDate) {
      rec[date] = items.map((it) => ({
        key: it.eventId,
        time: it.startTime,
        label: it.title,
        confirmed: true,
      }));
    }
    return rec;
  }, [byDate]);

  const selectedItems = byDate.get(selected) ?? [];

  return (
    <PublicShell>
      <PageTitle>행사 캘린더</PageTitle>
      <PageSub>날짜를 누르면 그날 열리는 행사를 볼 수 있어요.</PageSub>

      <Layout>
        <CalWrap>
          <MonthCalendar
            valueDate={selected}
            minDate={addDaysKstYmd(today, -365)}
            maxDate={addDaysKstYmd(today, 365)}
            onSelect={setSelected}
            dayEvents={dayEvents}
            maxEventsPerDay={3}
            hideEventTime
          />
        </CalWrap>

        <DayPanel>
          <DayTitle>
            {Number(selected.slice(5, 7))}월 {Number(selected.slice(8, 10))}일
          </DayTitle>
          {selectedItems.length === 0 ? (
            <EmptyDay>이 날 예정된 행사가 없습니다.</EmptyDay>
          ) : (
            selectedItems.map((it) => (
              <Row key={`${it.eventId}-${it.startTime}`} href={`/events/${it.slug}`}>
                <RowTime>{it.startTime}</RowTime>
                <RowTitle>{it.title}</RowTitle>
                <CategoryBadge category={it.category} />
              </Row>
            ))
          )}
        </DayPanel>
      </Layout>
    </PublicShell>
  );
}
