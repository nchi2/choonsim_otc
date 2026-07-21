// 시간 입력(오전/오후 + 시 + 분) ⇄ 24시간 "HH:MM" 저장 형식 변환 (Step 20, 공유 Step 21).
// 저장·조회·캘린더는 전부 "HH:MM"(24h)에 의존 — UI만 바꾸고 형식은 절대 유지.
// 프레임워크 무관(순수 함수) — /host(HostFormClient)와 어드민 편집 폼(Step 21)이 함께 사용,
// 두 곳의 UI 스타일(eduColors·adminColors)은 다르지만 변환 로직은 하나로 유지한다.

import type { MouseEvent } from "react";

export const AMPM_OPTS = ["오전", "오후"] as const;
export const HOUR12_OPTS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
export const MINUTE_OPTS = ["00", "30"] as const;

export interface TimeParts {
  ampm: string;
  hour: number;
  minute: string;
}

/** "HH:MM"(24h) → {오전/오후, 12시제 시, 분}. 형식 아니면 null. */
export function parse24(v: string): TimeParts | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  if (h < 0 || h > 23) return null;
  const ampm = h < 12 ? "오전" : "오후";
  const hour = h % 12 === 0 ? 12 : h % 12; // 0시·12시 → 12
  return { ampm, hour, minute: m[2] };
}

/** {오전/오후, 12시제 시, 분} → "HH:MM"(24h). */
export function to24(ampm: string, hour12: number, minute: string): string {
  let h = hour12 % 12; // 12 → 0
  if (ampm === "오후") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

/** 날짜 인풋 클릭 시 네이티브 달력 피커 열기(지원 브라우저) — 필드 어디를 눌러도 달력이 뜨게. */
export function openDatePicker(e: MouseEvent<HTMLInputElement>) {
  try {
    e.currentTarget.showPicker?.();
  } catch {
    // 일부 브라우저/상황에서 showPicker 미지원 — 기본 동작(입력)으로 폴백
  }
}
