"use client";

// [2-A 데모] 토대 컴포넌트 쇼케이스 — 셸·캐러셀·필터·카드(그리드/리스트)·OTC 카드가
// 실제 시드 데이터로 렌더되는 것만 확인한다. 페이지 완성은 2-B.

import { useMemo, useState } from "react";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import { EventCarousel } from "@/components/education/EventCarousel";
import {
  EventCard,
  EventCardGrid,
  EventCardList,
} from "@/components/education/EventCard";
import {
  EMPTY_EVENT_FILTER,
  FilterBar,
  applyEventFilter,
  type EventFilterValue,
} from "@/components/education/FilterBar";
import { OfficeOtcCard } from "@/components/education/OfficeOtcCard";
import { eduColors, media } from "@/components/education/tokens";
import type { EventCardData } from "@/components/education/types";

const DemoNote = styled.p`
  margin: 0 0 1.25rem;
  padding: 0.5rem 0.8rem;
  border: 1px dashed ${eduColors.borderInput};
  border-radius: 8px;
  font-size: 0.75rem;
  color: ${eduColors.textFaint};
`;

const SectionTitle = styled.h2`
  margin: 2rem 0 0.8rem;
  font-size: 1.1rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

/* 데모: 데스크톱=그리드 / 모바일=리스트 전환 패턴 시연 */
const DesktopOnly = styled.div`
  ${media.sm} {
    display: none;
  }
`;
const MobileOnly = styled.div`
  display: none;
  ${media.sm} {
    display: block;
  }
`;

export function FoundationDemo({ events }: { events: EventCardData[] }) {
  const [filter, setFilter] = useState<EventFilterValue>(EMPTY_EVENT_FILTER);
  const featured = events.filter((e) => e.isFeatured);
  const filtered = useMemo(
    () => applyEventFilter(events, filter),
    [events, filter],
  );

  return (
    <PublicShell>
      <DemoNote>
        [2-A 토대 데모] 아래는 컴포넌트 동작 확인용 임시 화면 — 실제 /events
        페이지는 2-B에서 조립됩니다.
      </DemoNote>

      <SectionTitle>추천 행사 (캐러셀 · isFeatured {featured.length}건)</SectionTitle>
      <EventCarousel events={featured} />

      <SectionTitle>필터 + 카드</SectionTitle>
      <FilterBar value={filter} onChange={setFilter} />

      <SectionTitle as="h3" style={{ fontSize: "0.9rem" }}>
        그리드 변주 (데스크톱) — {filtered.length}건
      </SectionTitle>
      <DesktopOnly>
        <EventCardGrid>
          {filtered.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </EventCardGrid>
      </DesktopOnly>
      <MobileOnly>
        <EventCardList>
          {filtered.map((ev) => (
            <EventCard key={ev.id} event={ev} variant="list" />
          ))}
        </EventCardList>
      </MobileOnly>

      <SectionTitle>회관 OTC 상주 카드</SectionTitle>
      <OfficeOtcCard />
    </PublicShell>
  );
}
