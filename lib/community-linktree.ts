/** 춘심·SBMB 커뮤니티 Linktree (푸터·메인 춘심 섹션·SBMB 페이지 등에서 공통 사용) */
export const COMMUNITY_LINKTREE = {
  choonsim: {
    href: "https://linktr.ee/choonsim",
    label: "춘심팀 Linktree",
    shortLabel: "춘심",
  },
  stablebmb: {
    href: "https://linktr.ee/stablebmb",
    label: "SBMB Linktree",
    shortLabel: "SBMB",
  },
} as const;

/** 카카오 오픈채팅 — 메인 커뮤니티 섹션 */
export const COMMUNITY_KAKAO_OPEN_CHAT = {
  href: "https://open.kakao.com/o/gq3NvqFf",
  label: "춘심 커뮤니티",
} as const;

/** BTCMobick 생태계 Linktree — 커뮤니티 섹션·생태계 뉴스 등 */
export const COMMUNITY_ECOSYSTEM_LINKTREE = {
  href: "https://linktr.ee/btcmobick",
  label: "생태계 링크모음",
} as const;

/** 메인 `/#community-linktree` 섹션 pill (표시 순서) */
export const COMMUNITY_MAIN_SECTION_PILLS = [
  { ...COMMUNITY_KAKAO_OPEN_CHAT, icon: "kakao" as const },
  { ...COMMUNITY_ECOSYSTEM_LINKTREE, icon: "linktree" as const },
  {
    href: COMMUNITY_LINKTREE.choonsim.href,
    label: COMMUNITY_LINKTREE.choonsim.label,
    icon: null,
  },
] as const;

/** 푸터 등 사이트 전체 안내용 — 두 링크 모두 */
export const COMMUNITY_LINKTREE_LIST = [
  COMMUNITY_LINKTREE.choonsim,
  COMMUNITY_LINKTREE.stablebmb,
] as const;

/** 앵커 id — 헤더 「커뮤니티」가 이동하는 위치 */
export const COMMUNITY_SECTION_ANCHOR_ID = "community-linktree";

/** 메인 히어로·뉴스 섹션 스크롤용 */
export const ECOSYSTEM_NEWS_ANCHOR_ID = "ecosystem-news";

/** 메인 페이지 SBMB 소개 블록(HighValueSection) — 헤더·히어로 SBMB 링크 */
export const SBMB_SECTION_ANCHOR_ID = "sbmb";
