"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  compareKstYmd,
  isKstYmd,
  monthBoundsKst,
  nowKst,
  weekdayFromKstYmd,
} from "@/lib/kst";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export interface MonthCalendarDayMeta {
  mySlotCount?: number;
  workerCount?: number;
  myReservationCount?: number;
  /** 일정만 잡힌 미확정(접수·연락완료) 신청 수 — 정원 차감과 무관, 표시 전용 */
  pendingReservationCount?: number;
  /** "내 것만" 모드에서 전체 근무자 수 배지 숨김 */
  hideWorkerCount?: boolean;
}

/** 날짜 셀 안에 직접 표시하는 일정 항목 (어드민 스케줄 상세 모드). */
export interface MonthCalendarDayEvent {
  key: string | number;
  /** "HH:MM" */
  time: string;
  /** 이름 등 — 모바일에서는 앞 글자만 표시 */
  label: string;
  /** true=확정(진하게) / false=미확정(회색·점선) */
  confirmed: boolean;
  /** 테스트 건 — 회색 점선으로 구분 (선택, 기본 false) */
  isTest?: boolean;
}

export interface MonthCalendarProps {
  valueDate: string;
  minDate: string;
  maxDate?: string;
  onSelect: (dateStr: string) => void;
  isDateEnabled?: (dateStr: string) => boolean;
  dayMeta?: Record<string, MonthCalendarDayMeta>;
  /**
   * 지정 시 상세 모드 — 셀이 커지고 일정 항목을 셀 안에 직접 표시.
   * 미지정이면 기존(배지만) 레이아웃 그대로 (공개 모달 등 다른 사용처 영향 없음).
   */
  dayEvents?: Record<string, MonthCalendarDayEvent[]>;
  /** 상세 모드에서 셀당 최대 표시 일정 수 — 초과분은 "+N건" (기본 3) */
  maxEventsPerDay?: number;
  onMonthChange?: (year: number, month: number) => void;
}

function ymdFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

export default function MonthCalendar({
  valueDate,
  minDate,
  maxDate,
  onSelect,
  isDateEnabled,
  dayMeta,
  dayEvents,
  maxEventsPerDay = 3,
  onMonthChange,
}: MonthCalendarProps) {
  const detailed = dayEvents != null;
  const initial = isKstYmd(valueDate)
    ? { y: Number(valueDate.slice(0, 4)), m: Number(valueDate.slice(5, 7)) - 1 }
    : (() => {
        const k = nowKst();
        return { y: k.getUTCFullYear(), m: k.getUTCMonth() };
      })();

  const [view, setView] = useState(initial);

  const onMonthChangeRef = useRef(onMonthChange);
  onMonthChangeRef.current = onMonthChange;
  const lastNotifiedMonthRef = useRef<{ y: number; m: number } | null>(null);

  useEffect(() => {
    if (!isKstYmd(valueDate)) return;
    const y = Number(valueDate.slice(0, 4));
    const m = Number(valueDate.slice(5, 7)) - 1;
    setView((prev) => (prev.y === y && prev.m === m ? prev : { y, m }));
  }, [valueDate]);

  useEffect(() => {
    const prev = lastNotifiedMonthRef.current;
    if (prev?.y === view.y && prev?.m === view.m) return;
    lastNotifiedMonthRef.current = { y: view.y, m: view.m };
    onMonthChangeRef.current?.(view.y, view.m);
  }, [view.y, view.m]);

  const minMonthIdx =
    Number(minDate.slice(0, 4)) * 12 + (Number(minDate.slice(5, 7)) - 1);
  const maxMonthIdx = maxDate
    ? Number(maxDate.slice(0, 4)) * 12 + (Number(maxDate.slice(5, 7)) - 1)
    : minMonthIdx + 120;
  const viewMonthIdx = view.y * 12 + view.m;
  const canPrev = viewMonthIdx > minMonthIdx;
  const canNext = viewMonthIdx < maxMonthIdx;

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const idx = v.y * 12 + v.m + delta;
      const y = Math.floor(idx / 12);
      const m = ((idx % 12) + 12) % 12;
      return v.y === y && v.m === m ? v : { y, m };
    });
  };

  const cells = useMemo(() => {
    const startWeekday = weekdayFromKstYmd(ymdFromParts(view.y, view.m, 1));
    const total = daysInMonth(view.y, view.m);
    const list: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) list.push(null);
    for (let d = 1; d <= total; d++) {
      list.push(ymdFromParts(view.y, view.m, d));
    }
    return list;
  }, [view.y, view.m]);

  const isEnabled = (ymd: string) => {
    if (compareKstYmd(ymd, minDate) < 0) return false;
    if (maxDate && compareKstYmd(ymd, maxDate) > 0) return false;
    return isDateEnabled ? isDateEnabled(ymd) : true;
  };

  return (
    <CalendarBox>
      <CalendarHeader>
        <CalNavButton
          type="button"
          disabled={!canPrev}
          onClick={() => canPrev && shiftMonth(-1)}
          aria-label="이전 달"
        >
          ‹
        </CalNavButton>
        <CalTitle>
          {view.y}년 {view.m + 1}월
        </CalTitle>
        <CalNavButton
          type="button"
          disabled={!canNext}
          onClick={() => canNext && shiftMonth(1)}
          aria-label="다음 달"
        >
          ›
        </CalNavButton>
      </CalendarHeader>
      <CalWeekRow>
        {WEEKDAYS.map((w, i) => (
          <CalWeekday key={w} $sun={i === 0} $sat={i === 6}>
            {w}
          </CalWeekday>
        ))}
      </CalWeekRow>
      <CalGrid>
        {cells.map((ymd, idx) =>
          ymd ? (
            <CalDayWrap key={ymd} $detailed={detailed}>
              <CalDay
                type="button"
                disabled={!isEnabled(ymd)}
                $selected={valueDate === ymd}
                $sun={weekdayFromKstYmd(ymd) === 0}
                $sat={weekdayFromKstYmd(ymd) === 6}
                $muted={compareKstYmd(ymd, minDate) < 0}
                onClick={() => isEnabled(ymd) && onSelect(ymd)}
              >
                {Number(ymd.slice(8, 10))}
              </CalDay>
              {dayMeta?.[ymd] ? (
                <DayBadgeRow>
                  {(dayMeta[ymd].mySlotCount ?? 0) > 0 ? (
                    <DayBadge $tone="mine">
                      내 {dayMeta[ymd].mySlotCount}
                    </DayBadge>
                  ) : null}
                  {(dayMeta[ymd].myReservationCount ?? 0) > 0 ? (
                    <DayBadge $tone="reserve">
                      예약 {dayMeta[ymd].myReservationCount}
                    </DayBadge>
                  ) : null}
                  {(dayMeta[ymd].pendingReservationCount ?? 0) > 0 ? (
                    <DayBadge $tone="pending">
                      미확정 {dayMeta[ymd].pendingReservationCount}
                    </DayBadge>
                  ) : null}
                  {!dayMeta[ymd].hideWorkerCount &&
                  (dayMeta[ymd].workerCount ?? 0) > 0 ? (
                    <DayBadge $tone="all">
                      {dayMeta[ymd].workerCount}명
                    </DayBadge>
                  ) : null}
                </DayBadgeRow>
              ) : null}
              {detailed && (dayEvents?.[ymd]?.length ?? 0) > 0 ? (
                <DayEventList
                  onClick={() => isEnabled(ymd) && onSelect(ymd)}
                  $clickable={isEnabled(ymd)}
                >
                  {dayEvents![ymd].slice(0, maxEventsPerDay).map((ev) => (
                    <DayEventItem
                      key={ev.key}
                      $confirmed={ev.confirmed}
                      $test={ev.isTest === true}
                      title={`${ev.time} ${ev.label} ${ev.confirmed ? "확정" : "미확정"}${ev.isTest ? " · 테스트" : ""}`}
                    >
                      <EvTime>{ev.time}</EvTime>
                      <EvLabelFull>{ev.label}</EvLabelFull>
                      <EvLabelShort aria-hidden="true">
                        {ev.label.slice(0, 1)}
                      </EvLabelShort>
                    </DayEventItem>
                  ))}
                  {dayEvents![ymd].length > maxEventsPerDay ? (
                    <DayEventMore>
                      +{dayEvents![ymd].length - maxEventsPerDay}건
                    </DayEventMore>
                  ) : null}
                </DayEventList>
              ) : null}
            </CalDayWrap>
          ) : (
            <CalEmpty key={`e-${idx}`} aria-hidden="true" $detailed={detailed} />
          ),
        )}
      </CalGrid>
    </CalendarBox>
  );
}

export function defaultCalendarMaxDate(minDate: string, months = 12): string {
  const y = Number(minDate.slice(0, 4));
  const m = Number(minDate.slice(5, 7)) - 1;
  const targetIdx = y * 12 + m + months;
  const ty = Math.floor(targetIdx / 12);
  const tm = ((targetIdx % 12) + 12) % 12;
  const { to } = monthBoundsKst(ty, tm);
  return to;
}

const CalendarBox = styled.div`
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const CalNavButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #4338ca;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: #eef2ff;
    border-color: #4338ca;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const CalTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
`;

const CalWeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
`;

const CalWeekday = styled.span<{ $sun?: boolean; $sat?: boolean }>`
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 0;
  color: ${(p) => (p.$sun ? "#dc2626" : p.$sat ? "#2563eb" : "#6b7280")};
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const CalDayWrap = styled.div<{ $detailed?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: ${(p) => (p.$detailed ? "88px" : "52px")};
  min-width: 0;
  ${(p) =>
    p.$detailed
      ? `
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 2px 2px 4px;
  `
      : ""}
`;

const CalEmpty = styled.div<{ $detailed?: boolean }>`
  min-height: ${(p) => (p.$detailed ? "88px" : "52px")};
`;

const CalDay = styled.button<{
  $selected: boolean;
  $sun?: boolean;
  $sat?: boolean;
  $muted?: boolean;
}>`
  width: 100%;
  max-width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: ${(p) => (p.$selected ? 800 : 500)};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => (p.$selected ? "#4338ca" : "transparent")};
  color: ${(p) =>
    p.$selected
      ? "#ffffff"
      : p.$muted
        ? "#d1d5db"
        : p.$sun
          ? "#dc2626"
          : p.$sat
            ? "#2563eb"
            : "#1f2937"};
  transition:
    background-color 0.12s ease,
    color 0.12s ease;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$selected ? "#3730a3" : "#eef2ff")};
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const DayBadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  margin-top: 2px;
  max-width: 100%;
  overflow: hidden;
`;

const DayBadge = styled.span<{
  $tone: "mine" | "all" | "reserve" | "pending";
}>`
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1.25;
  padding: 1px 4px;
  border-radius: 4px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${(p) =>
    p.$tone === "mine"
      ? "#4338ca"
      : p.$tone === "reserve"
        ? "#0f766e"
        : p.$tone === "pending"
          ? "#6b7280"
          : "#6b7280"};
  background: ${(p) =>
    p.$tone === "mine"
      ? "#eef2ff"
      : p.$tone === "reserve"
        ? "#ccfbf1"
        : p.$tone === "pending"
          ? "#ffffff"
          : "#f3f4f6"};
  border: ${(p) =>
    p.$tone === "pending" ? "1px dashed #9ca3af" : "1px solid transparent"};
`;

/* ── 상세 모드 — 셀 안 일정 항목 ── */

const DayEventList = styled.div<{ $clickable: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  margin-top: 3px;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
`;

const DayEventItem = styled.div<{ $confirmed: boolean; $test?: boolean }>`
  display: flex;
  align-items: baseline;
  gap: 3px;
  width: 100%;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 0.64rem;
  line-height: 1.4;
  overflow: hidden;
  white-space: nowrap;
  border: 1px ${(p) => (p.$confirmed && !p.$test ? "solid transparent" : "dashed #9ca3af")};
  background: ${(p) =>
    p.$test ? "#f3f4f6" : p.$confirmed ? "#ccfbf1" : "#ffffff"};
  color: ${(p) => (p.$test ? "#9ca3af" : p.$confirmed ? "#0f766e" : "#6b7280")};
  font-weight: ${(p) => (p.$confirmed && !p.$test ? 700 : 500)};
`;

const EvTime = styled.span`
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;

const EvLabelFull = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 640px) {
    display: none;
  }
`;

/* 모바일 — 셀이 좁아 이름 앞 글자만 */
const EvLabelShort = styled.span`
  display: none;

  @media (max-width: 640px) {
    display: inline;
  }
`;

const DayEventMore = styled.div`
  width: 100%;
  padding: 0 4px;
  font-size: 0.62rem;
  font-weight: 700;
  color: #6b7280;
`;
