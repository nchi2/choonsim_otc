// 교육 플랫폼 공개 UI 디자인 토큰 — 춘심 퍼플(#6B5FD0) 계열.
// 어드민(adminColors)과 별개의 공개용 팔레트. 그레이·상태색은 기존 사이트 관례와 정합.
// ★ 교육 공개 화면에서 새 hex 하드코딩 금지 — 반드시 여기 토큰을 쓴다.

export const eduColors = {
  // 브랜드 퍼플 스케일
  primary: "#6B5FD0",
  primaryHover: "#5A4EBF",
  primaryActive: "#4A3FA8",
  primarySoft: "#F0EEFB", // 옅은 배경(칩·강조 카드)
  primarySofter: "#F8F7FD", // near-white 틴트
  primaryBorder: "#D6D1F2",
  primaryText: "#4A3FA8", // soft 배경 위 텍스트

  // 서피스·그레이 (기존 공개 페이지 관례: #111827 / #6b7280 / #e5e7eb / #f9fafb)
  bg: "#f9fafb",
  surface: "#ffffff",
  text: "#111827",
  textSub: "#374151",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  border: "#e5e7eb",
  borderInput: "#d1d5db",

  // 시맨틱
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  warn: "#d97706",
  warnSoft: "#fffbeb",
  success: "#16a34a",
  successSoft: "#f0fdf4",
  info: "#2563eb",
  infoSoft: "#eff6ff",
  teal: "#0d9488",
  tealSoft: "#f0fdfa",
  pink: "#db2777",
  pinkSoft: "#fdf2f8",

  white: "#ffffff",
} as const;

/** 뱃지 톤 — Badge 컴포넌트가 소비. bg/색/보더 세트 표준. */
export type EduBadgeTone =
  | "purple"
  | "gray"
  | "teal"
  | "amber"
  | "pink"
  | "blue"
  | "green"
  | "red"
  | "solidPurple"
  | "solidRed";

export const eduBadgeTones: Record<
  EduBadgeTone,
  { bg: string; fg: string; border: string }
> = {
  purple: { bg: eduColors.primarySoft, fg: eduColors.primaryText, border: eduColors.primaryBorder },
  gray: { bg: eduColors.bg, fg: eduColors.textMuted, border: eduColors.border },
  teal: { bg: eduColors.tealSoft, fg: eduColors.teal, border: "#ccfbf1" },
  amber: { bg: eduColors.warnSoft, fg: eduColors.warn, border: "#fde68a" },
  pink: { bg: eduColors.pinkSoft, fg: eduColors.pink, border: "#fbcfe8" },
  blue: { bg: eduColors.infoSoft, fg: eduColors.info, border: "#bfdbfe" },
  green: { bg: eduColors.successSoft, fg: eduColors.success, border: "#bbf7d0" },
  red: { bg: eduColors.dangerSoft, fg: eduColors.danger, border: "#fecaca" },
  solidPurple: { bg: eduColors.primary, fg: eduColors.white, border: eduColors.primary },
  solidRed: { bg: eduColors.danger, fg: eduColors.white, border: eduColors.danger },
};

/** 도메인 → 뱃지 톤 표준 매핑 (카탈로그 문서와 동기 유지) */
export const CATEGORY_TONE: Record<string, EduBadgeTone> = {
  LECTURE: "purple",
  WORKSHOP: "amber",
  EVENT: "pink",
};

export const CATEGORY_LABEL: Record<string, string> = {
  LECTURE: "강연",
  WORKSHOP: "실습",
  EVENT: "이벤트",
};

export const MODE_TONE: Record<string, EduBadgeTone> = {
  OFFLINE: "gray",
  ONLINE: "blue",
  HYBRID: "teal",
};

export const MODE_LABEL: Record<string, string> = {
  OFFLINE: "오프라인",
  ONLINE: "온라인",
  HYBRID: "혼합",
};

/** 반응형 브레이크포인트 — 데스크톱 그리드 ↔ 모바일 리스트/하단탭 전환 기준.
 *  sm 이하 = 모바일(리스트·1장 캐러셀·하단탭), md 이상 = 데스크톱 헤더 내비. */
export const eduBp = {
  sm: 640,
  md: 768,
  lg: 1024,
} as const;

/** styled 템플릿용 미디어 헬퍼: `${media.sm} { ... }` */
export const media = {
  sm: `@media (max-width: ${eduBp.sm}px)`,
  md: `@media (max-width: ${eduBp.md}px)`,
  lg: `@media (max-width: ${eduBp.lg}px)`,
  overMd: `@media (min-width: ${eduBp.md + 1}px)`,
} as const;

/** 공통 레이아웃 상수 */
export const eduLayout = {
  maxWidth: 1120, // px — 본문 컨테이너
  headerHeight: 60, // px
  bottomTabHeight: 56, // px (모바일 하단탭)
  radius: 12, // px — 카드 기본 라운드
} as const;
