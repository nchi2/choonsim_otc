"use client";

// 새 메인 조립 — PublicShell(헤더·시세 스트립·푸터·모바일 3탭) 안에
// [행사 캐러셀] → [이번 주 행사] → [회관 OTC 카드] → [캘린더 링크] → [유튜브(기존 재사용)].
// 기존 OTCSection의 시세/CTA 역할은 PriceTicker(셸 내장)·OfficeOtcCard가 대체.

import Link from "next/link";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import { EventCarousel } from "@/components/education/EventCarousel";
import {
  EventCard,
  EventCardGrid,
  EventCardList,
} from "@/components/education/EventCard";
import { OfficeOtcCard } from "@/components/education/OfficeOtcCard";
import { eduColors, eduLayout, media } from "@/components/education/tokens";
import { dDayFromKstYmd, type EventCardData } from "@/components/education/types";
import YouTubeSection from "./components/YouTubeSection";

const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 2rem 0 0.9rem;

  &:first-child {
    margin-top: 0.5rem;
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: ${eduColors.text};

  ${media.sm} {
    font-size: 1.05rem;
  }
`;

const MoreLink = styled(Link)`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${eduColors.primary};
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`;

const EmptyNote = styled.p`
  margin: 0;
  padding: 1.5rem 1rem;
  text-align: center;
  border: 1px dashed ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  color: ${eduColors.textMuted};
  font-size: 0.86rem;
`;

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

/* 캘린더 미리보기 카드 — 미니 달력 대신 가벼운 CTA(과설계 회피). */
const CalendarCta = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.surface};
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: ${eduColors.primaryBorder};
    background: ${eduColors.primarySofter};
  }

  .txt {
    min-width: 0;
    h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      font-weight: 800;
      color: ${eduColors.text};
    }
    p {
      margin: 0;
      font-size: 0.8rem;
      color: ${eduColors.textMuted};
    }
  }
  .go {
    flex-shrink: 0;
    font-size: 0.85rem;
    font-weight: 800;
    color: ${eduColors.primary};
    white-space: nowrap;
  }
`;

const YoutubeWrap = styled.div`
  margin-top: 2.5rem;
  border-top: 1px solid ${eduColors.border};
`;

export function HomeClient({ events }: { events: EventCardData[] }) {
  const featured = events.filter((e) => e.isFeatured);
  // 다가오는(오늘 이후) 행사 — 조회 레이어가 이미 임박순 정렬. 이번 주(7일) 우선, 없으면 다가오는 순.
  const upcoming = events.filter((e) => {
    const d = dDayFromKstYmd(e.session?.date ?? null);
    return d != null && d >= 0;
  });
  const thisWeek = upcoming.filter((e) => {
    const d = dDayFromKstYmd(e.session?.date ?? null);
    return d != null && d <= 7;
  });
  const weekList = (thisWeek.length > 0 ? thisWeek : upcoming).slice(0, 6);

  return (
    <PublicShell>
      {featured.length > 0 ? (
        <>
          <SectionHead>
            <SectionTitle>추천 행사</SectionTitle>
            <MoreLink href="/events">전체 행사 →</MoreLink>
          </SectionHead>
          <EventCarousel events={featured} />
        </>
      ) : null}

      <SectionHead>
        <SectionTitle>이번 주 행사</SectionTitle>
        <MoreLink href="/events">전체 행사 →</MoreLink>
      </SectionHead>
      {weekList.length === 0 ? (
        <EmptyNote>
          예정된 행사가 준비 중입니다. 곧 새 강연·실습이 열려요.
        </EmptyNote>
      ) : (
        <>
          <DesktopOnly>
            <EventCardGrid>
              {weekList.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </EventCardGrid>
          </DesktopOnly>
          <MobileOnly>
            <EventCardList>
              {weekList.map((ev) => (
                <EventCard key={ev.id} event={ev} variant="list" />
              ))}
            </EventCardList>
          </MobileOnly>
        </>
      )}

      <SectionHead>
        <SectionTitle>모빅회관 OTC</SectionTitle>
      </SectionHead>
      <OfficeOtcCard />

      <SectionHead>
        <SectionTitle>행사 캘린더</SectionTitle>
      </SectionHead>
      <CalendarCta href="/events/calendar">
        <span className="txt">
          <h3>이번 달 일정 한눈에 보기</h3>
          <p>전국 모빅회관의 강연·실습·이벤트 일정을 달력으로 확인하세요.</p>
        </span>
        <span className="go">캘린더 열기 →</span>
      </CalendarCta>

      <YoutubeWrap>
        <YouTubeSection />
      </YoutubeWrap>
    </PublicShell>
  );
}
