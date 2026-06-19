/**
 * KST(UTC+9) 날짜·시간 유틸 — 슬롯/예약·시장 지표 등 서버 공통 기준.
 * 브라우저 로컬 타임존 대신 이 모듈을 사용한다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** "YYYY-MM-DD" 문자열 비교. a<b → 음수. */
export function compareKstYmd(a: string, b: string): number {
  return a.localeCompare(b);
}

/** KST 달력 날짜의 요일(0=일 … 6=토). */
export function weekdayFromKstYmd(ymd: string): number {
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!y || !mo || !d) return NaN;
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/** KST "YYYY-MM-DD"에 일수 더하기. */
export function addDaysKstYmd(ymd: string, days: number): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y, mo - 1, d + days);
  return formatKstYmd(new Date(utc + KST_OFFSET_MS));
}

/** y=연, m=0-based 월 → 해당 월 첫·마지막 날 "YYYY-MM-DD". */
export function monthBoundsKst(
  y: number,
  m: number,
): { from: string; to: string } {
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

/** 오늘(KST) 이전이면 true. */
export function isPastKstYmd(ymd: string): boolean {
  return compareKstYmd(ymd, todayKst()) < 0;
}

/** "YYYY-MM-DD" 형식인지. */
export function isKstYmd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** "2026-06-18" → "6월 18일 (목)" */
export function formatKstYmdLong(ymd: string): string | null {
  if (!isKstYmd(ymd)) return null;
  const wd = ["일", "월", "화", "수", "목", "금", "토"];
  const [y, mo, d] = ymd.split("-").map(Number);
  const w = weekdayFromKstYmd(ymd);
  if (Number.isNaN(w)) return null;
  return `${y}년 ${mo}월 ${d}일 (${wd[w]})`;
}

/** UTC 시각을 KST 달력/시각으로 해석하는 Date(UTC getter 사용). */
export function toKstDate(d: Date): Date {
  return new Date(d.getTime() + KST_OFFSET_MS);
}

/** 현재 시각(KST 기준 Date). */
export function nowKst(): Date {
  return toKstDate(new Date());
}

/** 오늘 날짜 "YYYY-MM-DD"(KST). */
export function todayKst(): string {
  return formatKstYmd(nowKst());
}

/** KST Date → "YYYY-MM-DD". */
export function formatKstYmd(kst: Date): string {
  const y = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const da = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/** "2026-06-11 17:39 KST" 형식(분 단위). */
export function fmtKstMinute(d: Date): string {
  const kst = toKstDate(d);
  const y = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const da = String(kst.getUTCDate()).padStart(2, "0");
  const h = String(kst.getUTCHours()).padStart(2, "0");
  const mi = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da} ${h}:${mi} KST`;
}

/** "2026년 6월" 형식(현재 시점 검색 안내용). */
export function fmtKstYearMonth(d: Date): string {
  const kst = toKstDate(d);
  return `${kst.getUTCFullYear()}년 ${kst.getUTCMonth() + 1}월`;
}

/** "2026.06.11" 형식(KST). 타임스탬프(ms) → 날짜 문자열. */
export function fmtKstDate(ms: number): string {
  const kst = new Date(ms + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const da = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}.${mo}.${da}`;
}

const HHMM_RE = /^(\d{2}):(\d{2})$/;

/** "HH:MM" → 분(0~1439). 유효하지 않으면 null. */
export function parseTimeToMinutes(time: string): number | null {
  const m = HHMM_RE.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return h * 60 + mi;
}

/** 분 → "HH:MM". */
export function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const mi = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

/** 30분 단위 시작 시각인지. */
export function isValidSlotStart(time: string): boolean {
  const mins = parseTimeToMinutes(time);
  return mins != null && mins % 30 === 0;
}

/** 30분 슬롯 종료 시각(시작 + 30분). */
export function slotEndTime(startTime: string): string | null {
  const mins = parseTimeToMinutes(startTime);
  if (mins == null || mins % 30 !== 0) return null;
  const end = mins + 30;
  if (end > 24 * 60) return null;
  return formatMinutesToTime(end);
}

/**
 * 30분 단위 "HH:MM" 슬롯 목록 — startTime 이상, endTime 미만.
 * 예: ("13:00", "17:00") → ["13:00","13:30","14:00",...,"16:30"]
 */
export function generateTimeSlots30(
  startTime: string,
  endTime: string,
): string[] {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start == null || end == null) return [];
  if (start % 30 !== 0 || end % 30 !== 0 || start >= end) return [];
  const slots: string[] = [];
  for (let m = start; m < end; m += 30) {
    slots.push(formatMinutesToTime(m));
  }
  return slots;
}
