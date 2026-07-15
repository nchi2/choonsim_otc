"use client";

// 로딩·에러·빈 상태 공용 4종 — 전 어드민 페이지가 이것만 쓴다 (StateBox 대체).
// 규칙: 첫 로드 = 레이아웃 모양 스켈레톤 / 캐시 있음+갱신 중 = 이전 값 유지 + RefreshingBar
//       (이전 값을 스켈레톤으로 덮지 말 것 — 깜빡임 금지) / 에러 = 재시도 버튼 / 빈 = 다음 행동 안내.

import type { ReactNode } from "react";
import styled, { keyframes } from "styled-components";
import { adminColors } from "@/components/admin/ui";

/* ── Skeleton ── */

const shimmer = keyframes`
  0% { opacity: 0.55; }
  50% { opacity: 1; }
  100% { opacity: 0.55; }
`;

const SkeletonBlock = styled.div`
  border-radius: 8px;
  background: ${adminColors.bgHover};
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

const SkeletonCardBox = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const SkeletonRowBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid ${adminColors.rowDivider};
  &:first-child {
    border-top: none;
  }
`;

export type SkeletonVariant = "card" | "table" | "stat";

/**
 * 첫 로드용 스켈레톤.
 * - card: 제목줄+본문 2줄 카드 (count장)
 * - table: 테이블 행 모양 (count행)
 * - stat: 큰 숫자 통계 블록 (count개 가로)
 */
export function Skeleton({
  variant = "card",
  count = 1,
}: {
  variant?: SkeletonVariant;
  count?: number;
}) {
  const items = Array.from({ length: count }, (_, i) => i);
  if (variant === "table") {
    return (
      <div
        style={{
          border: `1px solid ${adminColors.border}`,
          borderRadius: 12,
          background: adminColors.white,
          overflow: "hidden",
        }}
        aria-busy="true"
        aria-label="불러오는 중"
      >
        {items.map((i) => (
          <SkeletonRowBox key={i}>
            <SkeletonBlock style={{ width: 40, height: 14 }} />
            <SkeletonBlock style={{ flex: 1, height: 14 }} />
            <SkeletonBlock style={{ width: 64, height: 14 }} />
            <SkeletonBlock style={{ width: 72, height: 20, borderRadius: 999 }} />
          </SkeletonRowBox>
        ))}
      </div>
    );
  }
  if (variant === "stat") {
    return (
      <div
        style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
        aria-busy="true"
        aria-label="불러오는 중"
      >
        {items.map((i) => (
          <SkeletonCardBox key={i} style={{ flex: "1 1 8rem", minWidth: 0 }}>
            <SkeletonBlock style={{ width: "55%", height: 12 }} />
            <SkeletonBlock style={{ width: "40%", height: 26 }} />
          </SkeletonCardBox>
        ))}
      </div>
    );
  }
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      aria-busy="true"
      aria-label="불러오는 중"
    >
      {items.map((i) => (
        <SkeletonCardBox key={i}>
          <SkeletonBlock style={{ width: "30%", height: 14 }} />
          <SkeletonBlock style={{ width: "100%", height: 14 }} />
          <SkeletonBlock style={{ width: "70%", height: 14 }} />
        </SkeletonCardBox>
      ))}
    </div>
  );
}

/* ── RefreshingBar — 캐시 유지 + 백그라운드 갱신 표시 ── */

const slide = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
`;

const RefreshTrack = styled.div`
  position: relative;
  height: 3px;
  margin-bottom: 0.5rem;
  border-radius: 999px;
  background: ${adminColors.primarySoft};
  overflow: hidden;
`;

const RefreshThumb = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40%;
  border-radius: 999px;
  background: ${adminColors.primary};
  animation: ${slide} 1.1s ease-in-out infinite;
`;

/** 백그라운드 갱신 중 상단 얇은 진행바 — active=false면 자리 차지 없이 사라짐. */
export function RefreshingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <RefreshTrack role="status" aria-label="갱신 중">
      <RefreshThumb />
    </RefreshTrack>
  );
}

/* ── ErrorState ── */

const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem 1rem;
  border: 1px solid ${adminColors.dangerBorder};
  border-radius: 12px;
  background: ${adminColors.dangerSoft};
  text-align: center;
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${adminColors.dangerTextStrong};
`;

const RetryBtn = styled.button`
  padding: 0.45rem 1.1rem;
  border-radius: 8px;
  border: 1px solid ${adminColors.dangerBorder};
  background: ${adminColors.white};
  color: ${adminColors.dangerTextStrong};
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: ${adminColors.dangerSoft};
  }
`;

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <ErrorBox role="alert">
      <ErrorText>{message || "불러오지 못했습니다."}</ErrorText>
      {onRetry ? (
        <RetryBtn type="button" onClick={onRetry}>
          다시 시도
        </RetryBtn>
      ) : null}
    </ErrorBox>
  );
}

/* ── EmptyState ── */

const EmptyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 2.25rem 1rem;
  border: 1px dashed ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.bgSubtle};
  text-align: center;
`;

const EmptyIcon = styled.span`
  font-size: 1.6rem;
  line-height: 1;
`;

const EmptyTitle = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: ${adminColors.textSub};
`;

const EmptyDesc = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: ${adminColors.textMuted};
  line-height: 1.5;
`;

const EmptyAction = styled.div`
  margin-top: 0.6rem;
`;

export function EmptyState({
  icon = "📭",
  title,
  desc,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <EmptyBox>
      <EmptyIcon aria-hidden>{icon}</EmptyIcon>
      <EmptyTitle>{title}</EmptyTitle>
      {desc ? <EmptyDesc>{desc}</EmptyDesc> : null}
      {action ? <EmptyAction>{action}</EmptyAction> : null}
    </EmptyBox>
  );
}
