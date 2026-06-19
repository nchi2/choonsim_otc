import {
  compareKstYmd,
  generateTimeSlots30,
  isKstYmd,
  isValidSlotStart,
  todayKst,
  weekdayFromKstYmd,
} from "@/lib/kst";

/** 기본 영업시간 — 추후 사무실별로 분리 가능. */
export const OFFICE_HOURS = {
  start: "13:00",
  end: "17:00",
} as const;

/** 휴무 요일(0=일). */
export const CLOSED_WEEKDAYS: readonly number[] = [0];

/** 30분 단위 영업 슬롯 목록. */
export const BUSINESS_TIME_SLOTS = generateTimeSlots30(
  OFFICE_HOURS.start,
  OFFICE_HOURS.end,
);

export function isBusinessDayKst(ymd: string): boolean {
  if (!isKstYmd(ymd)) return false;
  const wd = weekdayFromKstYmd(ymd);
  return !CLOSED_WEEKDAYS.includes(wd);
}

/** 슬롯 등록 가능일 — 오늘(KST) 이후 + 영업일. */
export function isSlotRegistrationAllowed(ymd: string): boolean {
  if (!isKstYmd(ymd) || !isBusinessDayKst(ymd)) return false;
  return compareKstYmd(ymd, todayKst()) >= 0;
}

export function isAllowedSlotTime(time: string): boolean {
  return isValidSlotStart(time) && BUSINESS_TIME_SLOTS.includes(time);
}
