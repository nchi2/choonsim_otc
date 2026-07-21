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
  /* 컨테이너 쿼리 기준 — 목록 카드(작음)·캐러셀(중간)·히어로(큼) 세 곳 어디서 렌더되든
   * Info의 cqw 기반 폰트 크기가 이 박스의 실제 렌더 너비에 비례해 스스로 스케일된다(Step 23). */
  container-type: inline-size;
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

/* 이음매 없는 자연스러운 폴백을 위해 그라데이션을 박스 높이의 상당 부분에 퍼뜨린다
 * (기존엔 텍스트 콘텐츠 높이만큼만 어두워져 "잘린 듯한 가로 띠"로 보였음 — Step 22).
 * Step 23: 제목을 "포스터의 주인공"으로 키우려면 텍스트 영역 자체가 더 넓어야 해서
 * top을 더 위로 올렸다(비compact 25% — 박스 높이의 3/4을 텍스트 영역으로).
 * 폰트는 cqw(컨테이너 너비 기준) 단위로 목록 카드·캐러셀·히어로 어디서든 카드 크기에
 * 비례해 자동 스케일 — clamp()의 rem 상하한이 너무 작거나(좁은 리스트) 과하게
 * 크지(넓은 히어로) 않도록 안전선을 잡아준다. */
const Info = styled.div<{ $compact?: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: ${(p) => (p.$compact ? "44%" : "25%")};
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: ${(p) => (p.$compact ? "0.35rem 0.45rem" : "1rem 1.1rem")};
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 0, 0, 0.34) 45%,
    rgba(0, 0, 0, 0.58)
  );
  color: ${eduColors.white};

  .t {
    /* font-size 단독 지정(폴백) 뒤에 clamp()를 두어, cqw 미지원 브라우저에서
     * clamp() 선언 전체가 무효화되더라도 이 값으로 자연 폴백되게 한다. */
    font-size: ${(p) => (p.$compact ? "0.68rem" : "1.35rem")};
    font-size: ${(p) => (p.$compact ? "clamp(0.6rem, 9.5cqw, 0.85rem)" : "clamp(1.15rem, 8.6cqw, 2.6rem)")};
    font-weight: 800;
    line-height: 1.22;
    display: -webkit-box;
    -webkit-line-clamp: ${(p) => (p.$compact ? 2 : 3)};
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  .sub {
    margin-top: ${(p) => (p.$compact ? "0.2rem" : "0.4rem")};
    font-size: 0.74rem;
    font-size: clamp(0.72rem, 3.4cqw, 1.05rem);
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
  /** true면 폴백에서 제목/일시/장소 텍스트를 숨기고 카테고리 톤·아이콘만 표시.
   *  상세 페이지 히어로처럼 바로 옆에 같은 정보(H1 제목·MetaList)가 이미 있는
   *  화면에서 중복 노출을 피하기 위함(Step 22) — 카드/캐러셀 등 단독 노출 맥락에서는 쓰지 않는다. */
  hideOverlayText?: boolean;
}

/** 포스터 or 디자인된 폴백. 부모가 border-radius/크기를 감싸는 컨테이너로 제어. */
export function PosterCard({
  title,
  subtitle,
  dateLabel,
  category,
  posterUrl,
  compact,
  hideOverlayText,
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
          {hideOverlayText ? null : (
            <Info $compact={compact}>
              <div className="t">{title}</div>
              {subtitle || dateLabel ? (
                <div className="sub">
                  {[dateLabel, subtitle].filter(Boolean).join(" · ")}
                </div>
              ) : null}
            </Info>
          )}
        </>
      )}
    </Box>
  );
}
