"use client";

// 추천(isFeatured) 행사 캐러셀 — scroll-snap 기반(JS 최소).
// 데스크톱: 한 화면에 ~2.2장 + 좌우 화살표. 모바일: 1장 스와이프 + 점 인디케이터.
// 슬라이드는 EventCard(grid 변주)를 그대로 사용 — 카드 시각 언어 단일화.

import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { eduColors, media } from "./tokens";
import { EventCard } from "./EventCard";
import type { EventCardData } from "./types";

const Wrap = styled.div`
  position: relative;
`;

const Track = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Slide = styled.div`
  scroll-snap-align: start;
  flex: 0 0 calc((100% - 2rem) / 2.2); /* 데스크톱 ~2.2장 노출 → 이어짐 암시 */
  min-width: 0;

  ${media.md} {
    flex-basis: calc((100% - 1rem) / 1.15);
  }
  ${media.sm} {
    flex-basis: 100%; /* 모바일 1장 */
  }
`;

const Arrow = styled.button<{ $side: "left" | "right" }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => (p.$side === "left" ? "left: -14px;" : "right: -14px;")}
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid ${eduColors.border};
  background: ${eduColors.surface};
  color: ${eduColors.textSub};
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.12);
  z-index: 2;

  &:hover {
    border-color: ${eduColors.primaryBorder};
    color: ${eduColors.primary};
  }
  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  ${media.sm} {
    display: none; /* 모바일은 스와이프 */
  }
`;

const Dots = styled.div`
  display: none;
  ${media.sm} {
    display: flex;
    justify-content: center;
    gap: 0.35rem;
    margin-top: 0.6rem;
  }
`;

const Dot = styled.span<{ $active: boolean }>`
  width: ${(p) => (p.$active ? "16px" : "6px")};
  height: 6px;
  border-radius: 999px;
  background: ${(p) => (p.$active ? eduColors.primary : eduColors.border)};
  transition: width 0.2s ease, background 0.2s ease;
`;

export function EventCarousel({ events }: { events: EventCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const slideW = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 16
      : el.clientWidth;
    setIndex(Math.round(el.scrollLeft / slideW));
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncState();
  }, [events.length, syncState]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (events.length === 0) return null;

  return (
    <Wrap>
      <Arrow
        type="button"
        $side="left"
        aria-label="이전 행사"
        disabled={atStart}
        onClick={() => scrollBy(-1)}
      >
        ‹
      </Arrow>
      <Track ref={trackRef} onScroll={syncState}>
        {events.map((ev) => (
          <Slide key={ev.id}>
            <EventCard event={ev} />
          </Slide>
        ))}
      </Track>
      <Arrow
        type="button"
        $side="right"
        aria-label="다음 행사"
        disabled={atEnd}
        onClick={() => scrollBy(1)}
      >
        ›
      </Arrow>
      <Dots>
        {events.map((ev, i) => (
          <Dot key={ev.id} $active={i === index} />
        ))}
      </Dots>
    </Wrap>
  );
}
