"use client";

// 교육 공개 UI 뱃지 시스템 — 톤은 tokens.ts eduBadgeTones 표준만 사용.
// 도메인 뱃지(무료/유료·카테고리·진행방식·D-day·정원)는 전용 컴포넌트로 감싸
// 색·라벨 결정 로직을 한 곳에 고정한다.

import styled from "styled-components";
import {
  CATEGORY_LABEL,
  CATEGORY_TONE,
  MODE_LABEL,
  MODE_TONE,
  eduBadgeTones,
  type EduBadgeTone,
} from "./tokens";
import { formatFee } from "./types";

export const EduBadge = styled.span<{ $tone: EduBadgeTone; $size?: "sm" | "md" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: ${(p) => (p.$size === "md" ? "0.25rem 0.6rem" : "0.15rem 0.45rem")};
  border-radius: 999px;
  font-size: ${(p) => (p.$size === "md" ? "0.78rem" : "0.7rem")};
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
  background: ${(p) => eduBadgeTones[p.$tone].bg};
  color: ${(p) => eduBadgeTones[p.$tone].fg};
  border: 1px solid ${(p) => eduBadgeTones[p.$tone].border};
`;

/** 무료/유료 — 무료=teal 강조, 유료=금액 표기(퍼플). */
export function FeeBadge({ feeKrw, size }: { feeKrw: number; size?: "sm" | "md" }) {
  return (
    <EduBadge $tone={feeKrw <= 0 ? "teal" : "purple"} $size={size}>
      {formatFee(feeKrw)}
    </EduBadge>
  );
}

/** 카테고리 — 강연/실습/이벤트. 모르는 값은 원문+gray(레거시 안전). */
export function CategoryBadge({ category, size }: { category: string; size?: "sm" | "md" }) {
  return (
    <EduBadge $tone={CATEGORY_TONE[category] ?? "gray"} $size={size}>
      {CATEGORY_LABEL[category] ?? category}
    </EduBadge>
  );
}

/** 진행 방식 — 오프라인/온라인/혼합. */
export function ModeBadge({ mode, size }: { mode: string; size?: "sm" | "md" }) {
  return (
    <EduBadge $tone={MODE_TONE[mode] ?? "gray"} $size={size}>
      {MODE_LABEL[mode] ?? mode}
    </EduBadge>
  );
}

/** D-day — 임박(≤3일)=빨강 솔리드, 미래=퍼플 솔리드, 오늘="D-DAY", 지난 행사=회색 "종료". */
export function DDayBadge({ dDay, size }: { dDay: number | null; size?: "sm" | "md" }) {
  if (dDay == null) return null;
  if (dDay < 0) {
    return (
      <EduBadge $tone="gray" $size={size}>
        종료
      </EduBadge>
    );
  }
  const label = dDay === 0 ? "D-DAY" : `D-${dDay}`;
  return (
    <EduBadge $tone={dDay <= 3 ? "solidRed" : "solidPurple"} $size={size}>
      {label}
    </EduBadge>
  );
}

/** 정원 현황 — 마감=red, 임박(잔여 ≤20%)=amber, 여유=gray. capacity null=무제한. */
export function CapacityBadge({
  capacity,
  applied,
  size,
}: {
  capacity: number | null;
  applied: number;
  size?: "sm" | "md";
}) {
  if (capacity == null) {
    return (
      <EduBadge $tone="gray" $size={size}>
        정원 제한 없음
      </EduBadge>
    );
  }
  const remaining = capacity - applied;
  const tone: EduBadgeTone =
    remaining <= 0 ? "red" : remaining <= Math.ceil(capacity * 0.2) ? "amber" : "gray";
  return (
    <EduBadge $tone={tone} $size={size}>
      {remaining <= 0 ? "정원 마감" : `${applied}/${capacity}명`}
    </EduBadge>
  );
}
