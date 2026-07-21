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
import { adminColors } from "@/components/admin/ui";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export interface MonthCalendarDayMeta {
  workerCount?: number;
  /** 그날 확정 예약 건수 (전체 뷰) — 「예약 N건」 */
  reservationCount?: number;
  /** 내 배정 확정 예약 건수 ("내 것만" 뷰) — 「내 예약 N건」 */
  myReservationCount?: number;
  /** 일정만 잡힌 미확정(접수·연락완료) 신청 수 — 정원 차감과 무관, 표시 전용 */
  pendingReservationCount?: number;
  /** 확정 예약 ≥ 그날 총 슬롯 수 → 「꽉 참」(빨강 테두리) */
  full?: boolean;
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
  /**
   * 좌우 여백 제거(가장자리까지 셀 확보) — 어드민 스케줄 전용 opt-in.
   * 미지정이면 기존 padding 유지 (공개 모달 영향 없음).
   */
  edgeToEdge?: boolean;
  /**
   * 이 날짜 미만을 회색(muted)으로 표시 — "지난 날짜 읽기 전용" 뷰용 opt-in.
   * 클릭 가능 여부는 isDateEnabled/minDate가 결정(여기선 표시만).
   * 미지정이면 minDate 기준 (공개 모달 영향 없음).
   */
  pastBoundaryDate?: string;
  /**
   * 상세 모드에서 셀 안 일정 항목의 시간(HH:MM)을 숨기고 제목(label)만 표시 — 교육 공개
   * 캘린더 전용 opt-in. 미지정이면 기존대로 시간 + (모바일은 앞글자) 표시
   * (어드민 스케줄은 예약 시각이 핵심이라 이 값을 넘기지 않으므로 영향 없음).
   */
  hideEventTime?: boolean;
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
  edgeToEdge = false,
  pastBoundaryDate,
  hideEventTime = false,
  onMonthChange,
}: MonthCalendarProps) {
  // 회색 처리 기준일 — opt-in pastBoundaryDate 우선, 없으면 minDate (공개 기존 동작)
  const mutedBefore = pastBoundaryDate ?? minDate;
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
    <CalendarBox $edge={edgeToEdge}>
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
            <CalDayWrap
              key={ymd}
              $detailed={detailed}
              $full={dayMeta?.[ymd]?.full === true}
            >
              <CalDay
                type="button"
                disabled={!isEnabled(ymd)}
                $selected={valueDate === ymd}
                $sun={weekdayFromKstYmd(ymd) === 0}
                $sat={weekdayFromKstYmd(ymd) === 6}
                $muted={compareKstYmd(ymd, mutedBefore) < 0}
                onClick={() => isEnabled(ymd) && onSelect(ymd)}
              >
                {Number(ymd.slice(8, 10))}
              </CalDay>
              {dayMeta?.[ymd] ? (
                <DayBadgeRow>
                  {(dayMeta[ymd].reservationCount ?? 0) > 0 ? (
                    <DayBadge $tone="reserve">
                      예약 {dayMeta[ymd].reservationCount}건
                    </DayBadge>
                  ) : null}
                  {(dayMeta[ymd].myReservationCount ?? 0) > 0 ? (
                    <DayBadge $tone="reserve">
                      내 예약 {dayMeta[ymd].myReservationCount}건
                    </DayBadge>
                  ) : null}
                  {(dayMeta[ymd].pendingReservationCount ?? 0) > 0 ? (
                    <DayBadge $tone="pending">
                      ⚠ 미확정 {dayMeta[ymd].pendingReservationCount}
                    </DayBadge>
                  ) : null}
                  {dayMeta[ymd].full ? (
                    <DayBadge $tone="full">꽉 참</DayBadge>
                  ) : null}
                  {!dayMeta[ymd].hideWorkerCount &&
                  (dayMeta[ymd].workerCount ?? 0) > 0 ? (
                    <DayBadge $tone="all">
                      근무 {dayMeta[ymd].workerCount}명
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
                      title={`${hideEventTime ? "" : `${ev.time} `}${ev.label} ${ev.confirmed ? "확정" : "미확정"}${ev.isTest ? " · 테스트" : ""}`}
                    >
                      {hideEventTime ? (
                        // 교육 캘린더 — 시간 없이 제목만(모든 폭에서), 넘치면 말줄임
                        <EvTitle>{ev.label}</EvTitle>
                      ) : (
                        <>
                          <EvTime>{ev.time}</EvTime>
                          <EvLabelFull>{ev.label}</EvLabelFull>
                          <EvLabelShort aria-hidden="true">
                            {ev.label.slice(0, 1)}
                          </EvLabelShort>
                        </>
                      )}
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

const CalendarBox = styled.div<{ $edge?: boolean }>`
  width: 100%;
  background: ${adminColors.white};
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  /* edgeToEdge=가장자리까지 셀 확보 (어드민 스케줄 전용) */
  padding: ${(p) => (p.$edge ? "10px 2px" : "12px")};
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
  border: 1px solid ${adminColors.border};
  background: ${adminColors.white};
  color: ${adminColors.primary};
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: ${adminColors.primarySoft};
    border-color: ${adminColors.primary};
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const CalTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${adminColors.text};
`;

const CalWeekRow = styled.div`
  display: grid;
  /* ★ minmax(0, 1fr): 1fr(=minmax(auto,1fr))은 셀 콘텐츠의 최소폭(nowrap 텍스트의 max-content)
   * 만큼 컬럼을 밀어내 좁은 화면에서 7열이 화면을 넘어갔다. min을 0으로 잡아 항상 화면 폭 안에서
   * 균등 축소되게 한다(가로 오버플로우 근본 해결). 콘텐츠는 각 셀에서 overflow:hidden으로 클립. */
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 4px;
`;

const CalWeekday = styled.span<{ $sun?: boolean; $sat?: boolean }>`
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 0;
  color: ${(p) => (p.$sun ? adminColors.danger : p.$sat ? adminColors.info : adminColors.textMuted)};

  @media (max-width: 640px) {
    font-size: 0.64rem;
    padding: 3px 0;
  }
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;

  @media (max-width: 640px) {
    gap: 1px;
  }
`;

const CalDayWrap = styled.div<{ $detailed?: boolean; $full?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: ${(p) => (p.$detailed ? "88px" : "52px")};
  min-width: 0;
  ${(p) =>
    p.$detailed
      ? `
  border: 1px solid ${p.$full ? adminColors.dangerBorder : adminColors.bgHover};
  border-radius: 8px;
  padding: 2px 2px 4px;
  `
      : p.$full
        ? `
  border: 1px solid ${adminColors.dangerBorder};
  border-radius: 8px;
  padding: 1px;
  `
        : ""}

  /* 모바일 — 상세 모드 셀 높이·여백 축소로 한 화면에 들어오게(어드민·교육 공통) */
  @media (max-width: 640px) {
    min-height: ${(p) => (p.$detailed ? "60px" : "44px")};
    ${(p) => (p.$detailed ? "padding: 1px 1px 3px;" : "")}
  }
`;

const CalEmpty = styled.div<{ $detailed?: boolean }>`
  min-height: ${(p) => (p.$detailed ? "88px" : "52px")};

  @media (max-width: 640px) {
    min-height: ${(p) => (p.$detailed ? "60px" : "44px")};
  }
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

  @media (max-width: 640px) {
    max-width: 30px;
    height: 30px;
    font-size: 0.78rem;
    border-radius: 6px;
  }
  background: ${(p) => (p.$selected ? adminColors.primary : "transparent")};
  color: ${(p) =>
    p.$selected
      ? adminColors.white
      : p.$muted
        ? adminColors.borderInput
        : p.$sun
          ? adminColors.danger
          : p.$sat
            ? adminColors.info
            : adminColors.textStrong};
  transition:
    background-color 0.12s ease,
    color 0.12s ease;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$selected ? adminColors.primaryHover : adminColors.primarySoft)};
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
  $tone: "all" | "reserve" | "pending" | "full";
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
    p.$tone === "reserve"
      ? adminColors.successDeep
      : p.$tone === "pending"
        ? adminColors.warnText
        : p.$tone === "full"
          ? adminColors.danger
          : adminColors.textMuted};
  background: ${(p) =>
    p.$tone === "reserve"
      ? adminColors.successBg
      : p.$tone === "pending"
        ? adminColors.warnSoft
        : p.$tone === "full"
          ? adminColors.dangerSoft
          : adminColors.bgHover};
  border: ${(p) =>
    p.$tone === "pending"
      ? `1px solid ${adminColors.warnBorder}`
      : p.$tone === "full"
        ? `1px solid ${adminColors.dangerBorder}`
        : "1px solid transparent"};
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
  border: 1px ${(p) => (p.$confirmed && !p.$test ? "solid transparent" : `dashed ${adminColors.textFaint}`)};
  background: ${(p) =>
    p.$test ? adminColors.bgHover : p.$confirmed ? adminColors.successBg : adminColors.white};
  color: ${(p) => (p.$test ? adminColors.textFaint : p.$confirmed ? adminColors.successDeep : adminColors.textMuted)};
  font-weight: ${(p) => (p.$confirmed && !p.$test ? 700 : 500)};

  @media (max-width: 640px) {
    gap: 2px;
    padding: 1px 3px;
    font-size: 0.58rem;
  }
`;

const EvTime = styled.span`
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;

/* 교육 캘린더(hideEventTime) — 제목만, 모든 폭에서 표시하고 넘치면 말줄임 */
const EvTitle = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
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
  color: ${adminColors.textMuted};
`;
