"use client";

// 행사 목록 필터 바 — 완전 controlled(상태는 페이지가 소유, URL 쿼리 동기화도 페이지 몫).
// 카테고리 · 회관 · 무료/유료 · 온/오프 4그룹 칩. 모바일은 그룹별 가로 스크롤 한 줄.
// "전체" = 해당 키 null.

import styled from "styled-components";
import { CATEGORY_LABEL, MODE_LABEL, eduColors, media } from "./tokens";

export interface EventFilterValue {
  category: string | null; // "LECTURE" | "WORKSHOP" | "EVENT" | null(전체)
  officeId: number | null; // null=전체, -1=기타(customLocation)
  fee: "FREE" | "PAID" | null;
  mode: string | null; // "OFFLINE" | "ONLINE" | "HYBRID" | null
}

export const EMPTY_EVENT_FILTER: EventFilterValue = {
  category: null,
  officeId: null,
  fee: null,
  mode: null,
};

const Bar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;

  ${media.sm} {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.15rem;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const GroupLabel = styled.span`
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${eduColors.textFaint};
  min-width: 48px;
`;

const Chip = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid ${(p) => (p.$active ? eduColors.primary : eduColors.border)};
  background: ${(p) => (p.$active ? eduColors.primary : eduColors.surface)};
  color: ${(p) => (p.$active ? eduColors.white : eduColors.textSub)};
  transition: border-color 0.12s ease, background 0.12s ease;

  &:hover {
    border-color: ${eduColors.primary};
  }
`;

interface OfficeOption {
  id: number;
  name: string;
}

function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onSelect: (v: T | null) => void;
}) {
  return (
    <Group role="group" aria-label={label}>
      <GroupLabel>{label}</GroupLabel>
      <Chip type="button" $active={value == null} onClick={() => onSelect(null)}>
        전체
      </Chip>
      {options.map((opt) => (
        <Chip
          key={String(opt.value)}
          type="button"
          $active={value === opt.value}
          onClick={() => onSelect(value === opt.value ? null : opt.value)}
        >
          {opt.label}
        </Chip>
      ))}
    </Group>
  );
}

export function FilterBar({
  value,
  onChange,
  offices,
}: {
  value: EventFilterValue;
  onChange: (next: EventFilterValue) => void;
  /** 회관 선택지 — 페이지가 조회해 전달(활성 Office). 비우면 회관 그룹 숨김 */
  offices?: OfficeOption[];
}) {
  return (
    <Bar>
      <ChipGroup
        label="분류"
        value={value.category}
        options={Object.entries(CATEGORY_LABEL).map(([v, l]) => ({ value: v, label: l }))}
        onSelect={(category) => onChange({ ...value, category })}
      />
      {offices && offices.length > 0 ? (
        <ChipGroup
          label="회관"
          value={value.officeId}
          options={[
            ...offices.map((o) => ({ value: o.id, label: o.name })),
            { value: -1, label: "기타 장소" },
          ]}
          onSelect={(officeId) => onChange({ ...value, officeId })}
        />
      ) : null}
      <ChipGroup
        label="비용"
        value={value.fee}
        options={[
          { value: "FREE" as const, label: "무료" },
          { value: "PAID" as const, label: "유료" },
        ]}
        onSelect={(fee) => onChange({ ...value, fee })}
      />
      <ChipGroup
        label="방식"
        value={value.mode}
        options={Object.entries(MODE_LABEL).map(([v, l]) => ({ value: v, label: l }))}
        onSelect={(mode) => onChange({ ...value, mode })}
      />
    </Bar>
  );
}

/** 클라이언트 필터 적용 헬퍼 — 2-B 페이지가 목록에 그대로 사용.
 *  officeId 필터는 EventCardData에 officeId가 없어 locationName 기반이 아닌
 *  페이지 보유 원본 데이터에 적용하는 것을 권장. 여기서는 fee/category/mode만 처리. */
export function applyEventFilter<
  T extends { category: string; mode: string; feeKrw: number },
>(items: T[], f: EventFilterValue): T[] {
  return items.filter((it) => {
    if (f.category && it.category !== f.category) return false;
    if (f.mode && it.mode !== f.mode) return false;
    if (f.fee === "FREE" && it.feeKrw > 0) return false;
    if (f.fee === "PAID" && it.feeKrw <= 0) return false;
    return true;
  });
}
