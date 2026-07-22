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

/** 포스터 표준 종횡비(폴백·목록/캐러셀 크롭 기준) — 4:3. 업로드 자체엔 비율 제한 없음(Step 25):
 *  실제 이미지는 어떤 비율이든 올릴 수 있고, 이 상수는 (a) 이미지가 없을 때의 디자인 폴백,
 *  (b) 목록·캐러셀처럼 레이아웃 일관성이 필요한 곳의 고정 크롭 박스에만 쓰인다.
 *  상세 히어로처럼 원본 비율 그대로 보여줄 땐 fit="contain"으로 이 종횡비를 쓰지 않는다. */
export const POSTER_ASPECT_W = 4;
export const POSTER_ASPECT_H = 3;
export const POSTER_ASPECT_CSS = `${POSTER_ASPECT_W} / ${POSTER_ASPECT_H}`;

/** posterFocus → object-position. 목록·캐러셀의 고정 크롭에서만 의미가 있다. */
const FOCUS_POSITION: Record<string, string> = {
  top: "50% 0%",
  center: "50% 50%",
  bottom: "50% 100%",
};

/** 폴백 배경 — 카테고리별로 다른 그라데이션 + 은은한 텍스처(Step 30).
 *  전부 카테고리 톤(from/to) 위에 rgba 백색 오버레이만 얹어 새 hex 없이 질감을 만든다.
 *  - LECTURE(강연): 도트 그리드 + 우상단 소프트 글로우 (정갈한 학술 느낌)
 *  - WORKSHOP(실습): 45° 대각 스트라이프 (작업/핸즈온 느낌)
 *  - EVENT(이벤트): 흩뿌린 원·큰 도트 (축제 느낌) */
const FALLBACK_BG: Record<string, (from: string, to: string) => string> = {
  LECTURE: (from, to) => `
    background:
      radial-gradient(circle at 82% 16%, rgba(255,255,255,0.20), transparent 46%),
      radial-gradient(circle at 8% 92%, rgba(0,0,0,0.10), transparent 40%),
      radial-gradient(rgba(255,255,255,0.13) 1.5px, transparent 1.6px),
      linear-gradient(150deg, ${from}, ${to});
    background-size: cover, cover, 15px 15px, cover;
    background-position: center, center, 0 0, center;
  `,
  WORKSHOP: (from, to) => `
    background:
      radial-gradient(circle at 82% 16%, rgba(255,255,255,0.18), transparent 48%),
      radial-gradient(circle at 6% 94%, rgba(0,0,0,0.10), transparent 42%),
      repeating-linear-gradient(45deg, rgba(255,255,255,0.075) 0 7px, transparent 7px 15px),
      linear-gradient(150deg, ${from}, ${to});
    background-size: cover, cover, cover, cover;
  `,
  EVENT: (from, to) => `
    background:
      radial-gradient(circle at 16% 20%, rgba(255,255,255,0.17), transparent 42%),
      radial-gradient(circle at 80% 74%, rgba(255,255,255,0.12), transparent 40%),
      radial-gradient(rgba(255,255,255,0.12) 2px, transparent 2.2px),
      linear-gradient(150deg, ${from}, ${to});
    background-size: cover, cover, 24px 24px, cover;
  `,
};

const Box = styled.div<{
  $from: string;
  $to: string;
  $category: string;
  /** true = 폴백(이미지 없음) — 이때만 카테고리 텍스처를 깐다. 이미지가 있으면 깔끔한 단색 그라데이션(레터박스). */
  $fallback: boolean;
  $compact?: boolean;
  /** true = 원본 비율 그대로(크롭 없음) — 실제 이미지가 있을 때만 의미 있음(히어로). */
  $natural?: boolean;
  $focus: string;
}>`
  position: relative;
  width: 100%;
  ${(p) => (p.$natural ? "" : `aspect-ratio: ${POSTER_ASPECT_CSS};`)}
  overflow: hidden;
  /* 컨테이너 쿼리 기준 — 목록 카드(작음)·캐러셀(중간)·히어로(큼) 세 곳 어디서 렌더되든
   * Info의 cqw 기반 폰트 크기·워터마크가 이 박스의 실제 렌더 너비에 비례해 스스로 스케일된다(Step 23·30). */
  container-type: inline-size;
  ${(p) =>
    p.$fallback
      ? (FALLBACK_BG[p.$category] ?? FALLBACK_BG.LECTURE)(p.$from, p.$to)
      : `background: linear-gradient(135deg, ${p.$from}, ${p.$to});`}

  img {
    display: block;
    ${(p) =>
      p.$natural
        ? `position: static; width: 100%; height: auto;`
        : `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: ${FOCUS_POSITION[p.$focus] ?? FOCUS_POSITION.center};
    `}
  }
`;

/* 카테고리 아이콘을 워터마크처럼 크게 — 배경 장식(텍스트 뒤). cqw로 카드 크기에 비례 스케일.
 * 우하단에 살짝 걸쳐 회전(overflow:hidden으로 자연스럽게 잘림). 은은하게(낮은 opacity). */
const Watermark = styled.span`
  position: absolute;
  right: -3%;
  bottom: -8%;
  font-size: clamp(3rem, 52cqw, 15rem);
  line-height: 1;
  opacity: 0.16;
  transform: rotate(-8deg);
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.18));
  pointer-events: none;
  user-select: none;
`;

const CategoryTag = styled.span<{ $compact?: boolean }>`
  position: absolute;
  top: ${(p) => (p.$compact ? "6px" : "12px")};
  left: ${(p) => (p.$compact ? "6px" : "14px")};
  padding: ${(p) => (p.$compact ? "1px 7px" : "3px 10px")};
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(2px);
  color: ${eduColors.white};
  font-size: ${(p) => (p.$compact ? "0.58rem" : "0.72rem")};
  font-weight: 800;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
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
  top: ${(p) => (p.$compact ? "44%" : "22%")};
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: ${(p) => (p.$compact ? "0.35rem 0.45rem" : "1rem 1.1rem")};
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 0, 0, 0.30) 42%,
    rgba(0, 0, 0, 0.62)
  );
  color: ${eduColors.white};

  /* 일시 — 제목 위 eyebrow(보조 정보, 작고 살짝 투명). 타이포 위계: 일시 < 제목 > 장소 */
  .eyebrow {
    font-size: 0.68rem;
    font-size: clamp(0.62rem, 3.1cqw, 0.95rem);
    font-weight: 700;
    letter-spacing: 0.02em;
    opacity: 0.92;
    margin-bottom: ${(p) => (p.$compact ? "0.1rem" : "0.3rem")};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    display: ${(p) => (p.$compact ? "none" : "block")};
  }
  .t {
    /* font-size 단독 지정(폴백) 뒤에 clamp()를 두어, cqw 미지원 브라우저에서
     * clamp() 선언 전체가 무효화되더라도 이 값으로 자연 폴백되게 한다. */
    font-size: ${(p) => (p.$compact ? "0.68rem" : "1.35rem")};
    font-size: ${(p) => (p.$compact ? "clamp(0.6rem, 9.5cqw, 0.85rem)" : "clamp(1.15rem, 8.6cqw, 2.6rem)")};
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.01em;
    display: -webkit-box;
    -webkit-line-clamp: ${(p) => (p.$compact ? 2 : 3)};
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.34);
  }
  .sub {
    margin-top: ${(p) => (p.$compact ? "0.2rem" : "0.4rem")};
    font-size: 0.74rem;
    font-size: clamp(0.72rem, 3.4cqw, 1.05rem);
    font-weight: 600;
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: ${(p) => (p.$compact ? "none" : "flex")};
    align-items: center;
    gap: 0.3rem;
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
  /** "cover"(기본) = 고정 4:3 크롭(목록·캐러셀). "contain" = 원본 비율 그대로, 크롭 없음(상세
   *  히어로 — Step 25, 세로형 포스터가 잘리지 않게). 폴백(이미지 없음)에는 항상 4:3이 적용된다. */
  fit?: "cover" | "contain";
  /** 고정 크롭(fit="cover")일 때 어느 부분을 보여줄지 — "top"|"center"|"bottom"(Step 25).
   *  fit="contain"이거나 포스터가 없으면(폴백) 의미 없음. */
  posterFocus?: string;
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
  fit = "cover",
  posterFocus = "center",
}: PosterCardProps) {
  const tone = CATEGORY_POSTER_TONE[category] ?? DEFAULT_POSTER_TONE;
  const isFallback = !posterUrl;
  // 폴백(이미지 없음)은 항상 4:3 고정 — natural은 실제 이미지가 있을 때만 의미가 있다.
  const natural = Boolean(posterUrl) && fit === "contain";
  return (
    <Box
      $from={tone.from}
      $to={tone.to}
      $category={category}
      $fallback={isFallback}
      $compact={compact}
      $natural={natural}
      $focus={posterFocus}
    >
      {posterUrl ? (
        // 외부 이미지 도메인 미등록 정책에 따라 native img (next.config images 미설정)
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterUrl} alt="" loading="lazy" />
      ) : (
        <>
          <Watermark aria-hidden>{tone.icon}</Watermark>
          <CategoryTag $compact={compact}>
            {CATEGORY_LABEL[category] ?? "행사"}
          </CategoryTag>
          {hideOverlayText ? null : (
            <Info $compact={compact}>
              {dateLabel ? <div className="eyebrow">{dateLabel}</div> : null}
              <div className="t">{title}</div>
              {subtitle ? (
                <div className="sub">
                  <span aria-hidden>📍</span>
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {subtitle}
                  </span>
                </div>
              ) : null}
            </Info>
          )}
        </>
      )}
    </Box>
  );
}
