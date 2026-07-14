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

export const ListMeta = styled.div`
  margin-bottom: 0.5rem;
  color: ${adminColors.textMuted};
  font-size: 0.8rem;
`;

export const Table = styled.div`
  width: 100%;
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  /* 중간 폭(태블릿)에서 컬럼 압축으로 겹치지 않게 가로 스크롤 허용 */
  overflow-x: auto;
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
    background: #fafafa;
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
  background: #fff;
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
