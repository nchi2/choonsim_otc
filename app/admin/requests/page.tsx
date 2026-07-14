"use client";

// 신청 관리 통합 화면 — 10모의 기적 + BMB 구매·판매를 세그먼트로 전환.
// 스키마·API 통합이 아니라 화면 한 곳에서 두 목록을 오가는 것. URL ?type=miracle10|otc.

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { StateBox, ToolbarButton, adminColors } from "@/components/admin/ui";
import { useAdminPageHeader } from "@/components/admin/AdminPageHeaderContext";
import { Miracle10List } from "@/components/admin/requests/Miracle10List";
import { OtcRequestList } from "@/components/admin/requests/OtcRequestList";
import { ListSection } from "@/components/admin/requests/list-ui";

type SegmentType = "miracle10" | "otc";

const SegmentRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const SegmentBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  max-width: 260px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  border: 1.5px solid
    ${(p) => (p.$active ? adminColors.primary : adminColors.border)};
  background: ${(p) => (p.$active ? adminColors.primarySoft : "#fff")};
  color: ${(p) => (p.$active ? adminColors.primary : adminColors.textMuted)};
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
`;

const SegmentPendingBadge = styled.span<{ $active: boolean }>`
  min-width: 1.15rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: ${(p) => (p.$active ? adminColors.alert : adminColors.bgHover)};
  color: ${(p) => (p.$active ? "#fff" : adminColors.textMuted)};
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.15rem;
`;

/** 세그먼트 전환 시 상태 유지를 위해 비활성 쪽은 숨김만 (언마운트 금지 → 재조회 없음) */
const SegmentPanel = styled.div<{ $hidden: boolean }>`
  display: ${(p) => (p.$hidden ? "none" : "block")};
`;

function RequestsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState<SegmentType>(() =>
    searchParams.get("type") === "otc" ? "otc" : "miracle10",
  );
  const [refreshTick, setRefreshTick] = useState(0);
  const [pendingBadges, setPendingBadges] = useState({
    miracle10: 0,
    otc: 0,
  });

  // ?type= 직접 진입/변경 반영
  useEffect(() => {
    const t = searchParams.get("type");
    if (t === "otc" || t === "miracle10") setType(t);
  }, [searchParams]);

  const switchType = (next: SegmentType) => {
    setType(next);
    router.replace(`/admin/requests?type=${next}`, { scroll: false });
  };

  // 세그먼트 배지 = 접수 대기 건수 (stats 재사용)
  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const json = res.ok ? await res.json() : null;
      if (json?.ok) {
        setPendingBadges({
          miracle10: json.stats?.pending ?? 0,
          otc: json.stats?.otcPending ?? 0,
        });
      }
    } catch {
      /* 배지는 부가 UI */
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges, refreshTick]);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  const headerActions = useMemo(
    () => (
      <ToolbarButton type="button" style={{ marginLeft: 0 }} onClick={refresh}>
        새로고침
      </ToolbarButton>
    ),
    [refresh],
  );

  useAdminPageHeader(undefined, headerActions);

  // 초기 상태 필터 패스스루 — 구 경로 redirect(?tab=/?status=) 호환
  const initialM10Status = searchParams.get("tab");
  const initialOtcStatus = searchParams.get("status");

  return (
    <ListSection>
      <SegmentRow role="tablist" aria-label="신청 종류">
        <SegmentBtn
          type="button"
          role="tab"
          aria-selected={type === "miracle10"}
          $active={type === "miracle10"}
          onClick={() => switchType("miracle10")}
        >
          10모의 기적
          <SegmentPendingBadge
            $active={type === "miracle10" && pendingBadges.miracle10 > 0}
          >
            {pendingBadges.miracle10}
          </SegmentPendingBadge>
        </SegmentBtn>
        <SegmentBtn
          type="button"
          role="tab"
          aria-selected={type === "otc"}
          $active={type === "otc"}
          onClick={() => switchType("otc")}
        >
          BMB 구매·판매
          <SegmentPendingBadge
            $active={type === "otc" && pendingBadges.otc > 0}
          >
            {pendingBadges.otc}
          </SegmentPendingBadge>
        </SegmentBtn>
      </SegmentRow>

      <SegmentPanel $hidden={type !== "miracle10"}>
        <Miracle10List
          initialStatus={initialM10Status}
          refreshTick={refreshTick}
        />
      </SegmentPanel>
      <SegmentPanel $hidden={type !== "otc"}>
        <OtcRequestList
          initialStatus={initialOtcStatus}
          refreshTick={refreshTick}
        />
      </SegmentPanel>
    </ListSection>
  );
}

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<StateBox $variant="loading">불러오는 중…</StateBox>}>
      <RequestsPageInner />
    </Suspense>
  );
}
