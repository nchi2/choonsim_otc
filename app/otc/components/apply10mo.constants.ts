// 10모의 기적 신청 플로우(가치 / 신청 폼 / 접수 완료) 공유 상수.
// 세 화면이 같은 URL·주소·환산·문구를 단일 소스에서 가져온다.

// 문의는 이메일(mailto)로 받는다.
export const KAKAO_INQUIRY_URL = "mailto:contact@choonsim.com";

// 방문지 주소(복사·표시용 전체 주소).
export const OFFICE_ADDRESS = "서울 서초구 사임당로 149-5 지하층 (서초 모빅회관 내)";

// 지도 길찾기 — 주소 검색 기반(장소 ID 확보 시 정밀 링크로 교체).
export const NAVER_MAP_URL =
  "https://map.naver.com/p/search/" +
  encodeURIComponent("서울 서초구 사임당로 149-5");
export const KAKAO_MAP_URL =
  "https://map.kakao.com/?q=" + encodeURIComponent("서울 서초구 사임당로 149-5");

// 모 단위를 WBMB로 환산하는 비율(현재 1:1).
export const MO_TO_WBMB = 1;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

// "YYYY-MM-DD" → "2026년 1월 15일 (목)" (로컬 타임존 기준). 유효하지 않으면 null.
export function formatVisitDateLong(
  s: string | null | undefined,
): string | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일 (${WEEKDAYS[dt.getDay()]})`;
}
