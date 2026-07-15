"use client";

/**
 * 어드민 공통 디자인 토큰 + UI 프리미티브 (표시 레이어 전용).
 * 모든 /admin 화면은 여기 색·크기를 기준으로 한다 — 새 hex 하드코딩 금지.
 */

import styled from "styled-components";

export const adminColors = {
  /** 브랜드/주 액션 — 인디고 */
  primary: "#4338ca",
  primaryHover: "#3730a3",
  primarySoft: "#eef2ff",
  primaryBorder: "#c7d2fe",

  /** 접수·대기 알림 — 주황 (STATUS_COLORS.PENDING과 동일 계열) */
  alert: "#ea580c",
  alertSoft: "#fff7ed",
  alertBorder: "#fdba74",
  alertTextStrong: "#c2410c",

  /** 확정·성공 — 틸 (STATUS_COLORS.VERIFIED와 동일) */
  success: "#0d9488",
  successSoft: "#f0fdfa",
  successStrong: "#059669",
  successDeep: "#0f766e",
  successBg: "#ccfbf1", // teal-100 (확정 이벤트·체크 배경)
  successBorder: "#99f6e4", // teal-200

  /** 완료 — 초록 (STATUS_COLORS.COMPLETED) */
  done: "#16a34a",

  /** 오류·취소 */
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  dangerBorder: "#fca5a5",
  dangerText: "#b91c1c",
  dangerTextStrong: "#991b1b",

  /** 경고(앰버) — 지갑 부족·하한 등 */
  warnText: "#92400e",
  warnSoft: "#fef3c7",
  warnBorder: "#fde68a",
  warnAmber: "#ca8a04",

  /** 정보 — 파랑 (STATUS_COLORS.CONTACTED) */
  info: "#2563eb",

  /** 그레이 스케일 (Tailwind gray) */
  text: "#111827",
  textStrong: "#1f2937",
  textSub: "#374151",
  textSub2: "#4b5563",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  border: "#e5e7eb",
  borderInput: "#d1d5db",
  borderFaint: "#f5f5f5", // 카드 내 필드 구분선(아주 옅음)
  borderFaint2: "#eceef1", // 계산기 카드 테두리
  rowDivider: "#f1f5f9",
  bgSubtle: "#f9fafb",
  bgHover: "#f3f4f6",
  bgPage: "#f9fafb",
  bgHoverRow: "#fafafa",
  primarySofter: "#fafaff", // 카드 강조 배경(near-white 인디고 tint)
  white: "#fff",

  /** OTC 브랜드색 (메인 배너 — 구매/판매) */
  brandBuy: "#a8639f",
  brandSell: "#6570c5",
} as const;

/**
 * 상태 → 배지 색 (10모·OTC 공통 팔레트).
 * 접수=주황 · 연락완료=파랑 · 일정확정=틸 · 완료=초록 · 취소=회색.
 * (합의완료 AGREED는 OTC 전용 — 틸 계열)
 */
const STATUS_COLOR_MAP: Record<string, string> = {
  PENDING: adminColors.alert,
  CONTACTED: adminColors.info,
  VERIFIED: adminColors.success,
  AGREED: adminColors.success,
  COMPLETED: adminColors.done,
  CANCELED: adminColors.textMuted,
};

export function statusColor(status: string): string {
  return STATUS_COLOR_MAP[status] ?? adminColors.textMuted;
}

export const CardTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${adminColors.text};
  margin: 0 0 0.35rem;
`;

export const CardSub = styled.p`
  font-size: 0.8rem;
  color: ${adminColors.textMuted};
  line-height: 1.5;
  margin: 0 0 0.85rem;
`;

/** 필터 탭 (pill) — 활성=인디고. */
export const FilterTab = styled.button<{ $active: boolean }>`
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  border: 1px solid
    ${(p) => (p.$active ? adminColors.primary : adminColors.border)};
  background: ${(p) => (p.$active ? adminColors.primary : adminColors.white)};
  color: ${(p) => (p.$active ? adminColors.white : adminColors.textSub)};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;

  &:hover {
    border-color: ${(p) =>
      p.$active ? adminColors.primary : adminColors.borderInput};
  }
`;

export const FilterTabCount = styled.span<{ $active: boolean }>`
  margin-left: 0.3rem;
  font-weight: 700;
  color: ${(p) =>
    p.$active ? "rgba(255,255,255,0.85)" : adminColors.textFaint};
`;

/** 툴바 보조 버튼 (새로고침 등) — pill로 탭과 라디우스 통일. */
export const ToolbarButton = styled.button`
  margin-left: auto;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  border: 1px solid ${adminColors.borderInput};
  background: ${adminColors.white};
  color: ${adminColors.textSub};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${adminColors.bgSubtle};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled.button`
  padding: 0.55rem 1.2rem;
  border-radius: 8px;
  border: 1px solid ${adminColors.primary};
  background: ${adminColors.primary};
  color: ${adminColors.white};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: ${adminColors.primaryHover};
    border-color: ${adminColors.primaryHover};
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  padding: 0.55rem 1.2rem;
  border-radius: 8px;
  border: 1px solid ${adminColors.borderInput};
  background: ${adminColors.white};
  color: ${adminColors.textSub};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${adminColors.bgSubtle};
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

/** 상태 pill 뱃지 — 색은 STATUS_COLORS 등에서 주입. */
export const StatusBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.white};
  background: ${(p) => p.$color};
  white-space: nowrap;
`;

// StateBox는 components/admin/States.tsx의 Skeleton/RefreshingBar/ErrorState/EmptyState로
// 대체·제거됨 (3덩이 B-4) — 새 코드는 States 4종만 사용할 것.

/** 목록 행 코멘트 수 배지 — 💬N. */
export const CommentBadge = styled.span`
  display: inline-block;
  margin-left: 0.35rem;
  padding: 1px 7px;
  border-radius: 999px;
  background: ${adminColors.bgHover};
  color: ${adminColors.textMuted};
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
`;

/** 안 읽은 코멘트 수 — 빨강 배지. */
export const UnreadBadge = styled.span`
  display: inline-block;
  margin-left: 0.25rem;
  min-width: 1.1rem;
  padding: 1px 5px;
  border-radius: 999px;
  background: ${adminColors.danger};
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  text-align: center;
  white-space: nowrap;
`;

/** 인라인 에러 배너 — 작업 지점 근처에 배치. */
export const InlineError = styled.p`
  margin: 0.6rem 0 0;
  padding: 0.6rem 0.85rem;
  border: 1px solid ${adminColors.dangerBorder};
  border-radius: 8px;
  background: ${adminColors.dangerSoft};
  color: ${adminColors.dangerTextStrong};
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.45;
`;
