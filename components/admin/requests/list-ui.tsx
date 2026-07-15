"use client";

// 신청 목록 공용 프리미티브 — 10모·OTC 목록이 공유 (렌더 코드 복제 금지).
import Link from "next/link";
import styled from "styled-components";
import { adminColors } from "@/components/admin/ui";

export const ListSection = styled.section`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0 1.5rem 1rem;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.9rem;
`;

export const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

/** 상태 칩 한 줄 — 가로 스크롤 (2줄 접힘 방지) */
export const ChipScroll = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  & > * {
    flex-shrink: 0;
  }
`;

/** 주 상태(접수·연락완료·일정확정)와 부 상태(완료·취소·전체) 구분선 */
export const ChipDivider = styled.span`
  width: 1px;
  align-self: stretch;
  margin: 2px 0.15rem;
  background: ${adminColors.border};
`;

/** 상단 요약 줄 — 좌: 건수, 우: (10모) 재고 요약 */
export const ListMetaRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

export const ListMeta = styled.div`
  color: ${adminColors.textMuted};
  font-size: 0.8rem;
`;

/** 10모 목록 우측 재고 여유 요약 (탭 → 재고) */
const StockSummaryLink = styled(Link)<{ $short: boolean }>`
  flex-shrink: 0;
  font-size: 0.78rem;
  text-decoration: none;
  white-space: nowrap;
  color: ${(p) => (p.$short ? adminColors.danger : adminColors.textMuted)};

  strong {
    font-weight: 800;
    color: ${(p) => (p.$short ? adminColors.danger : adminColors.textSub)};
  }
  &:hover {
    text-decoration: underline;
  }
`;

export function StockSummary({
  stock,
  reserved,
  onOrder,
}: {
  stock: number;
  reserved: number;
  onOrder: number;
}) {
  const spare = stock - reserved;
  const short = spare < 0;
  return (
    <StockSummaryLink href="/admin/wallet-inventory" $short={short}>
      가용 <strong>{stock}</strong>
      {onOrder > 0 ? ` (+${onOrder} 예정)` : ""} · 소요{" "}
      <strong>{reserved}</strong> →{" "}
      {short ? (
        <strong>부족 {Math.abs(spare)}장 ⚠️</strong>
      ) : (
        <>
          여유 <strong>{spare}장</strong>
        </>
      )}
    </StockSummaryLink>
  );
}

/* 데스크탑/태블릿(≥641px) = 정렬 테이블. 모바일(≤640px)에서는 카드로 대체. */
export const Table = styled.div`
  width: 100%;
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  overflow: hidden;
  /* 중간 폭(태블릿)에서 컬럼 압축으로 겹치지 않게 가로 스크롤 허용 */
  overflow-x: auto;

  @media (max-width: 640px) {
    display: none;
  }
`;

/* ── 모바일 카드 리스트 (≤640px 전용) ── */

export const CardList = styled.div`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

export const CardLink = styled(Link)<{ $test?: boolean }>`
  display: block;
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  padding: 0.7rem 0.85rem;
  text-decoration: none;
  color: ${adminColors.text};
  ${(p) => (p.$test ? `opacity: 0.62;` : "")}

  &:active {
    background: ${adminColors.bgHoverRow};
  }
`;

export const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

export const CardId = styled.span`
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${adminColors.textFaint};
`;

export const CardName = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: ${adminColors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.2rem;
`;

/** 방문일시 승격 — 카드 2번째 줄, 굵게 (운영자가 가장 자주 보는 값) */
export const CardVisit = styled.div`
  margin-top: 0.35rem;
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

export const CardVisitStrong = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${adminColors.textSub};
`;

export const CardMetaFaint = styled.span`
  font-size: 0.76rem;
  color: ${adminColors.textMuted};
`;

/** 그리드 컬럼은 목록별 프롭으로 — 데스크탑/모바일 템플릿 + 최소 폭 */
export const HeadRow = styled.div<{
  $cols: string;
  $mobileCols: string;
  $minWidth: number;
}>`
  display: grid;
  grid-template-columns: ${(p) => p.$cols};
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${adminColors.bgSubtle};
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.textMuted};

  @media (min-width: 641px) {
    min-width: ${(p) => p.$minWidth}px;
  }
  @media (max-width: 640px) {
    grid-template-columns: ${(p) => p.$mobileCols};
  }
`;

export const Row = styled(Link)<{
  $cols: string;
  $mobileCols: string;
  $minWidth: number;
}>`
  display: grid;
  grid-template-columns: ${(p) => p.$cols};
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid ${adminColors.rowDivider};
  font-size: 0.85rem;
  color: ${adminColors.text};
  text-decoration: none;
  align-items: center;

  &:hover {
    background: ${adminColors.bgHoverRow};
  }

  @media (min-width: 641px) {
    min-width: ${(p) => p.$minWidth}px;
  }
  @media (max-width: 640px) {
    grid-template-columns: ${(p) => p.$mobileCols};
  }
`;

export const Hide = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`;

/* 모바일 — 부가 정보를 이름 아래 한 줄로 병기 */
export const SubMobile = styled.span`
  display: none;
  @media (max-width: 640px) {
    display: block;
    margin-top: 2px;
    font-size: 0.72rem;
    color: ${adminColors.textMuted};
  }
`;

/* 정렬 가능한 컬럼 헤더 — 활성 컬럼은 인디고 + 방향 화살표 */
export const SortHead = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${(p) => (p.$active ? adminColors.primary : adminColors.textMuted)};
  cursor: pointer;
  text-align: left;
  white-space: nowrap;

  &:hover {
    color: ${adminColors.primary};
  }
`;

export const LoadMoreBtn = styled.button`
  display: block;
  width: 100%;
  margin-top: 0.6rem;
  padding: 0.6rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 10px;
  background: ${adminColors.white};
  color: ${adminColors.textSub};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${adminColors.bgSubtle};
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

/** 테스트 건 표시 배지 (includeTest=1일 때만 목록에 등장) */
export const TestBadge = styled.span`
  display: inline-block;
  margin-left: 0.35rem;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px dashed ${adminColors.textFaint};
  color: ${adminColors.textMuted};
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
`;
