// 10모의 기적 신청 플로우(가치 / 신청 폼 / 접수 완료) 공유 상수.
// 세 화면이 같은 URL·주소·환산·문구를 단일 소스에서 가져온다.

/** true면 신청 버튼·API 접수를 막고 일시중지 안내를 표시한다. */
export const MIRACLE10_APPLY_SUSPENDED = false;

export const MIRACLE10_APPLY_SUSPENDED_TITLE = "신청 일시중지";
export const MIRACLE10_APPLY_SUSPENDED_MESSAGE =
  "10모의 기적 All-in-One 신청이 일시중지되었습니다. 재개 시 안내드리겠습니다.";

/** true면 신청은 받되 재오픈 준비 안내 배너를 표시한다. */
export const MIRACLE10_APPLY_PREPARING = true;

export const MIRACLE10_APPLY_PREPARING_TITLE = "재오픈 준비 중";
export const MIRACLE10_APPLY_PREPARING_MESSAGE =
  "10모의 기적 All-in-One을 다시 준비하고 있습니다. 지금은 신청만 접수해 두시면, 정식 오픈 시 순서대로 안내드립니다.";

// 문의는 이메일로 받는다.
export const CONTACT_EMAIL = "contact@choonsim.com";
export const KAKAO_INQUIRY_URL = `mailto:${CONTACT_EMAIL}`;

// 방문지 주소(복사·표시용 전체 주소).
export const OFFICE_ADDRESS = "서울 서초구 사임당로 149-5 지하층";

// 지도 길찾기 — 주소 검색 기반(장소 ID 확보 시 정밀 링크로 교체).
export const NAVER_MAP_URL =
  "https://map.naver.com/p/search/" +
  encodeURIComponent("서울 서초구 사임당로 149-5");
export const KAKAO_MAP_URL =
  "https://map.kakao.com/?q=" + encodeURIComponent("서울 서초구 사임당로 149-5");

// 구글맵 임베드(접수 완료 화면). output=embed로 iframe 직접 삽입.
export const OFFICE_MAP_IFRAME_URL =
  "https://maps.google.com/maps?q=37.4921191,127.0246296&z=17&output=embed";

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
