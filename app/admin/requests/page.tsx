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
import { ToolbarButton, adminColors } from "@/components/admin/ui";
import { Skeleton } from "@/components/admin/States";
import { useAdminPageHeader } from "@/components/admin/AdminPageHeaderContext";
import { Miracle10List } from "@/components/admin/requests/Miracle10List";
import { OtcRequestList } from "@/components/admin/requests/OtcRequestList";
import { ListSection } from "@/components/admin/requests/list-ui";
import { invalidate, useAdminData } from "@/lib/admin-data";
import {
  STATS_KEY,
  STATS_TTL,
  statsFetcher,
  type AdminStatsData,
} from "@/lib/admin-fetchers";

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
  background: ${(p) => (p.$active ? adminColors.primarySoft : adminColors.white)};
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
  color: ${(p) => (p.$active ? adminColors.white : adminColors.textMuted)};
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

  // ?type= 직접 진입/변경 반영
  useEffect(() => {
    const t = searchParams.get("type");
    if (t === "otc" || t === "miracle10") setType(t);
  }, [searchParams]);

  const switchType = (next: SegmentType) => {
    setType(next);
    router.replace(`/admin/requests?type=${next}`, { scroll: false });
  };

  // 세그먼트 배지 = 접수 대기 건수 — 셸과 같은 admin:stats 캐시 공유 (중복 호출 없음)
  const { data: stats } = useAdminData<AdminStatsData>(
    STATS_KEY,
    statsFetcher,
    { ttl: STATS_TTL },
  );
  const pendingBadges = {
    miracle10: stats?.pending ?? 0,
    otc: stats?.otcPending ?? 0,
  };

  // 새로고침 = 목록·집계 캐시 무효화 → 마운트된 훅들이 알아서 재검증
  const refresh = useCallback(() => {
    invalidate("admin:list");
    invalidate(STATS_KEY);
  }, []);

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
          wallet={stats?.wallet}
        />
      </SegmentPanel>
      <SegmentPanel $hidden={type !== "otc"}>
        <OtcRequestList initialStatus={initialOtcStatus} />
      </SegmentPanel>
    </ListSection>
  );
}

export default function AdminRequestsPage() {
  return (
    <Suspense
      fallback={
        <ListSection>
          <Skeleton variant="table" count={6} />
        </ListSection>
      }
    >
      <RequestsPageInner />
    </Suspense>
  );
}
