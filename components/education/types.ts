// 교육 공개 UI가 소비하는 직렬화 가능한 데이터 형태.
// 서버(RSC/API)에서 Prisma 결과를 이 형태로 매핑해 클라이언트 컴포넌트에 넘긴다.
import { todayKst } from "@/lib/kst";

/** 목록·캐러셀(고정 4:3 크롭)에서 포스터의 어느 부분을 보여줄지(Step 25). */
export type PosterFocus = "top" | "center" | "bottom";

/** DB는 검증 없는 plain string(앱 레벨에서만 제한) — 알 수 없는 값은 안전하게 center로. */
export function toPosterFocus(v: string | null | undefined): PosterFocus {
  return v === "top" || v === "bottom" ? v : "center";
}

/** EventCard·Carousel이 소비하는 행사 요약. */
export interface EventCardData {
  id: number;
  slug: string;
  title: string;
  category: string; // "LECTURE" | "WORKSHOP" | "EVENT"
  mode: string; // "OFFLINE" | "ONLINE" | "HYBRID"
  posterUrl: string | null;
  posterFocus: string;
  /** 회관 id — 회관 필터용(null=회관 없이 customLocation). 2-B 추가(하위호환). */
  officeId: number | null;
  /** 장소 표시명 — office.name ?? customLocation ?? null */
  locationName: string | null;
  feeKrw: number;
  capacity: number | null;
  /** APPLIED 신청 수 (정원 현황 표시용) */
  applicationCount: number;
  /** 대표(가장 이른 미래, 없으면 첫) 세션 */
  session: { date: string; startTime: string; endTime: string } | null;
  /** 세션 총 개수 (시리즈 표기 "외 N회") */
  sessionCount: number;
  isFeatured: boolean;
}

/** D-day 계산 — KST 기준. 오늘=0, 미래=양수, 지난 행사=음수. date 없으면 null. */
export function dDayFromKstYmd(ymd: string | null | undefined): number | null {
  if (!ymd || ymd.length < 10) return null;
  const today = todayKst();
  const toUtc = (s: string) =>
    Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
  return Math.round((toUtc(ymd) - toUtc(today)) / 86400000);
}

/** "7/17(금) 14:00" 형태의 세션 한 줄 표기. */
export function formatSessionBrief(
  session: { date: string; startTime: string } | null,
): string {
  if (!session) return "일정 미정";
  const d = session.date;
  const day = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(`${d}T00:00:00+09:00`).getDay()
  ];
  return `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}(${day}) ${session.startTime}`;
}

/** 무료/유료 라벨 — "무료" | "10,000원" */
export function formatFee(feeKrw: number): string {
  return feeKrw <= 0 ? "무료" : `${feeKrw.toLocaleString("ko-KR")}원`;
}

/** "7/17(금) 14:00~16:00" — 시작·종료 포함 세션 범위 표기. */
export function formatSessionRange(session: {
  date: string;
  startTime: string;
  endTime: string;
}): string {
  const d = session.date;
  const day = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(`${d}T00:00:00+09:00`).getDay()
  ];
  return `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}(${day}) ${session.startTime}~${session.endTime}`;
}
