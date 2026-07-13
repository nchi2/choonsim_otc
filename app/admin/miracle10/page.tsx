"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import {
  MIRACLE10_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  formatVisitBrief,
  type Miracle10Status,
} from "@/lib/miracle10-status";
import {
  FilterTab,
  FilterTabCount,
  StateBox,
  StatusBadge,
  ToolbarButton,
  adminColors,
} from "@/components/admin/ui";

const Page = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 1rem;
  }
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Table = styled.div`
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
`;

const HeadRow = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr 1fr 72px 100px 100px 140px 120px;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  @media (max-width: 640px) {
    grid-template-columns: 48px 1fr 70px 96px;
  }
`;

const Row = styled(Link)`
  display: grid;
  grid-template-columns: 64px 1fr 1fr 72px 100px 100px 140px 120px;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid #f1f5f9;
  font-size: 0.85rem;
  color: #111827;
  text-decoration: none;
  align-items: center;
  &:hover {
    background: #fafafa;
  }
  @media (max-width: 640px) {
    grid-template-columns: 48px 1fr 70px 96px;
  }
`;

const Hide = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`;

const ListMeta = styled.div`
  margin-bottom: 0.5rem;
  color: ${adminColors.textMuted};
  font-size: 0.8rem;
`;

const EditorCell = styled(Hide)`
  font-size: 0.75rem;
  color: ${adminColors.textMuted};
`;

const VisitCell = styled(Hide)`
  font-size: 0.78rem;
  color: ${adminColors.textSub};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* 모바일 — 방문 일정을 이름 아래 한 줄로 병기 */
const VisitSubMobile = styled.span`
  display: none;
  @media (max-width: 640px) {
    display: block;
    margin-top: 2px;
    font-size: 0.72rem;
    color: ${adminColors.textMuted};
  }
`;

interface Item {
  id: number;
  createdAt: string;
  status: Miracle10Status;
  quantity: number;
  visitType: string | null;
  visitDate: string | null;
  reservedStart: string | null;
  visitTimeSlot: string | null;
  isSbmbMember: boolean;
  lastEditedBy: string | null;
  lastEditedByName: string | null;
  lastEditedAt: string | null;
  nameMasked: string;
  contactMasked: string;
}

type StatusFilter = "ALL" | Miracle10Status;

/** 탭 순서 — 처리 우선 상태 먼저, 전체는 맨 끝. */
const STATUS_TAB_ORDER: StatusFilter[] = [
  ...MIRACLE10_STATUSES,
  "ALL",
];

const TAB_LABELS: Record<StatusFilter, string> = {
  ...STATUS_LABELS,
  ALL: "전체",
};

function emptyStatusCounts(): Record<Miracle10Status, number> {
  return {
    PENDING: 0,
    CONTACTED: 0,
    VERIFIED: 0,
    COMPLETED: 0,
    CANCELED: 0,
  };
}

function Miracle10AdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<StatusFilter>("PENDING");
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) return;
    if (tab === "ALL" || MIRACLE10_STATUSES.includes(tab as Miracle10Status)) {
      setFilter(tab as StatusFilter);
    }
  }, [searchParams]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch("/api/admin/miracle10?limit=200");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "목록을 불러오지 못했습니다.");
      }
      setAllItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const statusCounts = useMemo(() => {
    const counts = emptyStatusCounts();
    for (const it of allItems) {
      counts[it.status]++;
    }
    return counts;
  }, [allItems]);

  const filteredItems = useMemo(() => {
    if (filter === "ALL") return allItems;
    return allItems.filter((it) => it.status === filter);
  }, [allItems, filter]);

  const tabCount = useCallback(
    (tab: StatusFilter) => {
      if (tab === "ALL") return allItems.length;
      return statusCounts[tab];
    },
    [allItems.length, statusCounts],
  );

  return (
    <Page>
      <Toolbar>
        <Tabs>
          {STATUS_TAB_ORDER.map((tab) => (
            <FilterTab
              key={tab}
              type="button"
              $active={filter === tab}
              onClick={() => setFilter(tab)}
            >
              {TAB_LABELS[tab]}
              <FilterTabCount $active={filter === tab}>
                {tabCount(tab)}
              </FilterTabCount>
            </FilterTab>
          ))}
        </Tabs>
        <ToolbarButton
          type="button"
          onClick={() => load(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? "새로고침 중..." : "새로고침"}
        </ToolbarButton>
      </Toolbar>

      {loading && <StateBox $variant="loading">불러오는 중…</StateBox>}
      {error && <StateBox $variant="error">{error}</StateBox>}

      {!loading && !error && (
        <>
          <ListMeta>
            {TAB_LABELS[filter]} {filteredItems.length}건
            {filter !== "ALL" ? ` · 전체 ${allItems.length}건` : ""}
          </ListMeta>
          <Table>
            <HeadRow>
              <span>번호</span>
              <span>이름</span>
              <Hide>연락처</Hide>
              <span>수량</span>
              <Hide>방문</Hide>
              <Hide>접수일</Hide>
              <Hide>최종 수정</Hide>
              <span>상태</span>
            </HeadRow>
            {filteredItems.length === 0 ? (
              <StateBox $variant="empty">
                {filter === "ALL"
                  ? "신청이 없습니다."
                  : `${TAB_LABELS[filter]} 상태 신청이 없습니다.`}
              </StateBox>
            ) : (
              filteredItems.map((it) => {
                const visitBrief = formatVisitBrief(it);
                return (
                <Row key={it.id} href={`/admin/miracle10/${it.id}`}>
                  <span>#{it.id}</span>
                  <span>
                    {it.nameMasked}
                    {it.isSbmbMember ? " · SBMB" : ""}
                    {visitBrief !== "-" ? (
                      <VisitSubMobile>{visitBrief}</VisitSubMobile>
                    ) : null}
                  </span>
                  <Hide>{it.contactMasked}</Hide>
                  <span>{it.quantity}모</span>
                  <VisitCell title={visitBrief}>{visitBrief}</VisitCell>
                  <Hide>
                    {new Date(it.createdAt).toLocaleDateString("ko-KR")}
                  </Hide>
                  <EditorCell>
                    {it.lastEditedByName && it.lastEditedAt
                      ? `${it.lastEditedByName} · ${new Date(it.lastEditedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : "-"}
                  </EditorCell>
                  <span>
                    <StatusBadge $color={STATUS_COLORS[it.status]}>
                      {STATUS_LABELS[it.status]}
                    </StatusBadge>
                  </span>
                </Row>
                );
              })
            )}
          </Table>
        </>
      )}
    </Page>
  );
}

export default function Miracle10AdminPage() {
  return (
    <Suspense fallback={<StateBox $variant="loading">불러오는 중…</StateBox>}>
      <Miracle10AdminPageInner />
    </Suspense>
  );
}
