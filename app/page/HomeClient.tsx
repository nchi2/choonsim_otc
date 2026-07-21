"use client";

// 새 메인 조립 — PublicShell(헤더·시세 스트립·푸터·모바일 3탭) 안에
// [행사 캐러셀] → [앞으로의 행사] → [회관 OTC 카드] → [(모빅 도구, 임시 숨김)] →
// [캘린더 링크] → [유튜브] → [생태계 스트립].
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
import { ToolsSection } from "@/components/education/ToolsSection";
import { EcosystemStrip } from "@/components/education/EcosystemStrip";
import { AuthNoticeBanner } from "@/components/education/AuthNoticeBanner";
import { eduColors, eduLayout, media } from "@/components/education/tokens";
import { dDayFromKstYmd, type EventCardData } from "@/components/education/types";
import { YoutubeLite } from "@/components/education/YoutubeLite";

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

/** "앞으로의 행사" 표시 상한 — 너무 길어지지 않게(Step 22). 전체는 "전체 행사 →"로. */
const UPCOMING_DISPLAY_LIMIT = 6;

/** ★ 모빅 도구 섹션(Step 19/21) 메인 노출 스위치 — Step 22에서 코드는 보존한 채 임시로 끔.
 *  되살리려면: 이 값을 true로 바꾸기만 하면 된다(아래 조건부 렌더 외 다른 변경 불필요).
 *  ToolsSection.tsx 자체·☰메뉴/푸터의 스캐너·컨트랙트·SBMB 링크는 이 스위치와 무관하게 그대로 살아있다. */
const SHOW_TOOLS_SECTION = false;

export function HomeClient({
  events,
  carousel,
}: {
  events: EventCardData[];
  /** 서버(pickCarouselEvents)에서 선별 — 다가오는 featured 우선 + 개수 폴백 */
  carousel: EventCardData[];
}) {
  // 앞으로의 행사 — 종료되지 않은(대표 세션이 오늘 이후) 행사만, 조회 레이어가 이미
  // 가까운 순으로 정렬해서 준다(Step 22 — 7일 제한 없이 다가오는 순 전부, 표시만 상한).
  const upcoming = events.filter((e) => {
    const d = dDayFromKstYmd(e.session?.date ?? null);
    return d != null && d >= 0;
  });
  const upcomingList = upcoming.slice(0, UPCOMING_DISPLAY_LIMIT);

  return (
    <PublicShell>
      <AuthNoticeBanner />
      {carousel.length > 0 ? (
        <>
          <SectionHead>
            <SectionTitle>추천 행사</SectionTitle>
            <MoreLink href="/events">전체 행사 →</MoreLink>
          </SectionHead>
          <EventCarousel events={carousel} />
        </>
      ) : null}

      <SectionHead>
        <SectionTitle>앞으로의 행사</SectionTitle>
        <MoreLink href="/events">전체 행사 →</MoreLink>
      </SectionHead>
      {upcomingList.length === 0 ? (
        <EmptyNote>
          예정된 행사가 준비 중입니다. 곧 새 강연·실습이 열려요.
        </EmptyNote>
      ) : (
        <>
          <DesktopOnly>
            <EventCardGrid>
              {upcomingList.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </EventCardGrid>
          </DesktopOnly>
          <MobileOnly>
            <EventCardList>
              {upcomingList.map((ev) => (
                <EventCard key={ev.id} event={ev} variant="list" />
              ))}
            </EventCardList>
          </MobileOnly>
        </>
      )}

      <SectionHead>
        <SectionTitle>춘심 회관 OTC</SectionTitle>
      </SectionHead>
      <OfficeOtcCard />

      {SHOW_TOOLS_SECTION ? (
        <>
          <SectionHead>
            <SectionTitle>모빅 도구</SectionTitle>
          </SectionHead>
          <ToolsSection />
        </>
      ) : null}

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
        <YoutubeLite />
      </YoutubeWrap>

      <SectionHead>
        <SectionTitle>BTCMobick 생태계</SectionTitle>
        <MoreLink href="/ecosystem">생태계 전체 보기 →</MoreLink>
      </SectionHead>
      <EcosystemStrip />
    </PublicShell>
  );
}
