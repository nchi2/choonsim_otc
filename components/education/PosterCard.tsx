"use client";

// 행사 포스터 카드 — posterUrl이 있으면 이미지, 없으면 카테고리별로 디자인된 폴백.
// ★ Phase 2 템플릿 도구 감안: 이 폴백이 "기본 템플릿 1번"으로 재사용될 수 있게
//   제목/부제(장소)/날짜/카테고리를 전부 props로 받는 순수 표시 컴포넌트(하드코딩 없음).
//   종횡비는 POSTER_ASPECT_* 상수 — 추후 업로드 규격 안내·PNG export가 이 비율을 쓴다.

import styled from "styled-components";
import {
  CATEGORY_LABEL,
  CATEGORY_POSTER_TONE,
  DEFAULT_POSTER_TONE,
  eduColors,
} from "./tokens";

/** 포스터 표준 종횡비 — 4:3. 업로드 규격·템플릿 export 공통 기준. */
export const POSTER_ASPECT_W = 4;
export const POSTER_ASPECT_H = 3;
export const POSTER_ASPECT_CSS = `${POSTER_ASPECT_W} / ${POSTER_ASPECT_H}`;

const Box = styled.div<{ $from: string; $to: string; $compact?: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${POSTER_ASPECT_CSS};
  overflow: hidden;
  background:
    /* 은은한 도트 패턴 — 카테고리 색 위에 백색 점 */
    radial-gradient(
      rgba(255, 255, 255, 0.14) 1.5px,
      transparent 1.5px
    ),
    linear-gradient(135deg, ${(p) => p.$from}, ${(p) => p.$to});
  background-size: 18px 18px, cover;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const Icon = styled.span<{ $compact?: boolean }>`
  position: absolute;
  top: ${(p) => (p.$compact ? "6px" : "12px")};
  right: ${(p) => (p.$compact ? "6px" : "14px")};
  font-size: ${(p) => (p.$compact ? "1rem" : "1.6rem")};
  opacity: 0.9;
`;

const CategoryTag = styled.span<{ $compact?: boolean }>`
  position: absolute;
  top: ${(p) => (p.$compact ? "6px" : "12px")};
  left: ${(p) => (p.$compact ? "6px" : "14px")};
  padding: ${(p) => (p.$compact ? "1px 6px" : "2px 9px")};
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: ${eduColors.white};
  font-size: ${(p) => (p.$compact ? "0.58rem" : "0.7rem")};
  font-weight: 800;
  letter-spacing: 0.04em;
`;

const Info = styled.div<{ $compact?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: ${(p) => (p.$compact ? "0.35rem 0.45rem" : "0.8rem 0.95rem")};
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.38));
  color: ${eduColors.white};

  .t {
    font-size: ${(p) => (p.$compact ? "0.62rem" : "0.98rem")};
    font-weight: 800;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  }
  .sub {
    margin-top: 0.2rem;
    font-size: ${(p) => (p.$compact ? "0.55rem" : "0.74rem")};
    font-weight: 600;
    opacity: 0.92;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: ${(p) => (p.$compact ? "none" : "block")};
  }
`;

export interface PosterCardProps {
  title: string;
  /** 부제 — 회관/장소 등 */
  subtitle?: string | null;
  /** 날짜 라벨 — "7/25(토) 14:00" 등 */
  dateLabel?: string | null;
  /** "LECTURE" | "WORKSHOP" | "EVENT" — 폴백 톤·아이콘 결정 */
  category: string;
  /** 실제 포스터 — 있으면 이미지가 폴백을 덮는다 */
  posterUrl?: string | null;
  /** true = 리스트 썸네일(96px) 축약 렌더 */
  compact?: boolean;
}

/** 포스터 or 디자인된 폴백. 부모가 border-radius/크기를 감싸는 컨테이너로 제어. */
export function PosterCard({
  title,
  subtitle,
  dateLabel,
  category,
  posterUrl,
  compact,
}: PosterCardProps) {
  const tone = CATEGORY_POSTER_TONE[category] ?? DEFAULT_POSTER_TONE;
  return (
    <Box $from={tone.from} $to={tone.to} $compact={compact}>
      {posterUrl ? (
        // 외부 이미지 도메인 미등록 정책에 따라 native img (next.config images 미설정)
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterUrl} alt="" loading="lazy" />
      ) : (
        <>
          <CategoryTag $compact={compact}>
            {CATEGORY_LABEL[category] ?? "행사"}
          </CategoryTag>
          <Icon $compact={compact} aria-hidden>
            {tone.icon}
          </Icon>
          <Info $compact={compact}>
            <div className="t">{title}</div>
            {subtitle || dateLabel ? (
              <div className="sub">
                {[dateLabel, subtitle].filter(Boolean).join(" · ")}
              </div>
            ) : null}
          </Info>
        </>
      )}
    </Box>
  );
}
