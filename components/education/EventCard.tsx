"use client";

// 행사 카드 — 두 변주:
//  - variant="grid" (기본): 데스크톱 그리드용. 포스터 상단(4:3) + 본문.
//  - variant="list": 모바일 세로 리스트용. 썸네일 좌측(96px) + 본문 우측 1행 압축.
// 링크는 /events/[slug]. 포스터 없으면 PosterCard의 카테고리별 디자인 폴백.

import Link from "next/link";
import styled from "styled-components";
import { eduColors, eduLayout, media } from "./tokens";
import { CategoryBadge, DDayBadge, FeeBadge } from "./Badge";
import { PosterCard } from "./PosterCard";
import {
  dDayFromKstYmd,
  formatSessionBrief,
  type EventCardData,
} from "./types";

const CardLink = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.surface};
  overflow: hidden;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: ${eduColors.primaryBorder};
    box-shadow: 0 4px 16px rgba(107, 95, 208, 0.12);
    transform: translateY(-2px);
  }
`;

/* 포스터 영역 래퍼 — 실제 렌더는 PosterCard(이미지 or 카테고리별 디자인 폴백) */
const PosterBox = styled.div<{ $list?: boolean }>`
  flex-shrink: 0;
  ${(p) =>
    p.$list
      ? `
  width: 96px;
  height: 96px;
  border-radius: 10px;
  overflow: hidden;
  /* 96px 정사각 썸네일 — PosterCard의 4:3보다 세로가 길어 살짝 크롭 */
  display: flex;
  align-items: center;
  & > div { min-height: 100%; }
  `
      : `
  width: 100%;
  `}
`;

const Body = styled.div`
  padding: 0.8rem 0.9rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
`;

const Title = styled.h3<{ $clamp?: number }>`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${eduColors.text};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: ${(p) => p.$clamp ?? 2};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaLine = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: ${eduColors.textMuted};
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  strong {
    color: ${eduColors.textSub};
    font-weight: 600;
  }
`;

/* ── 리스트 변주 ── */
const ListRow = styled(Link)`
  display: flex;
  gap: 0.8rem;
  align-items: stretch;
  text-decoration: none;
  color: inherit;
  padding: 0.75rem;
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.surface};
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: ${eduColors.primaryBorder};
    background: ${eduColors.primarySofter};
  }
`;

const ListBody = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  justify-content: center;
`;

export function EventCard({
  event,
  variant = "grid",
}: {
  event: EventCardData;
  variant?: "grid" | "list";
}) {
  const dDay = dDayFromKstYmd(event.session?.date ?? null);
  const sessionLabel =
    formatSessionBrief(event.session) +
    (event.sessionCount > 1 ? ` 외 ${event.sessionCount - 1}회` : "");
  const href = `/events/${event.slug}`;
  const poster = (
    <PosterCard
      title={event.title}
      subtitle={event.locationName}
      dateLabel={event.session ? formatSessionBrief(event.session) : null}
      category={event.category}
      posterUrl={event.posterUrl}
      compact={variant === "list"}
    />
  );

  if (variant === "list") {
    return (
      <ListRow href={href}>
        <PosterBox $list>{poster}</PosterBox>
        <ListBody>
          <BadgeRow>
            <DDayBadge dDay={dDay} />
            <CategoryBadge category={event.category} />
            <FeeBadge feeKrw={event.feeKrw} />
          </BadgeRow>
          <Title $clamp={1}>{event.title}</Title>
          <MetaLine>
            <strong>{sessionLabel}</strong>
            {event.locationName ? <>· {event.locationName}</> : null}
          </MetaLine>
        </ListBody>
      </ListRow>
    );
  }

  return (
    <CardLink href={href}>
      <PosterBox>{poster}</PosterBox>
      <Body>
        <BadgeRow>
          <DDayBadge dDay={dDay} />
          <CategoryBadge category={event.category} />
          <FeeBadge feeKrw={event.feeKrw} />
        </BadgeRow>
        <Title>{event.title}</Title>
        <MetaLine>
          <strong>{sessionLabel}</strong>
        </MetaLine>
        {event.locationName ? <MetaLine>📍 {event.locationName}</MetaLine> : null}
      </Body>
    </CardLink>
  );
}

/** 데스크톱 3열 그리드 ↔ 모바일 세로 리스트 컨테이너.
 *  variant="grid" 카드용. 모바일 전환은 페이지에서 variant="list"로 바꾸는 쪽을 권장하나,
 *  그대로 그리드 카드를 1열로 떨어뜨리는 간단 전환도 이 컨테이너로 가능. */
export const EventCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;

  ${media.lg} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  ${media.sm} {
    grid-template-columns: 1fr;
  }
`;

/** 모바일 리스트 컨테이너 (variant="list" 카드 세로 나열) */
export const EventCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;
