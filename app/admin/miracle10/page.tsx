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
  CommentBadge,
  FilterTab,
  FilterTabCount,
  StateBox,
  StatusBadge,
  ToolbarButton,
  UnreadBadge,
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
  /* 중간 폭(태블릿)에서 컬럼 압축으로 겹치지 않게 가로 스크롤 허용 */
  overflow-x: auto;
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
  @media (min-width: 641px) {
    min-width: 860px;
  }
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
  @media (min-width: 641px) {
    min-width: 860px;
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

/* 정렬 가능한 컬럼 헤더 — 활성 컬럼은 인디고 + 방향 화살표 */
const SortHead = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${(p) => (p.$active ? adminColors.primary : "#6b7280")};
  cursor: pointer;
  text-align: left;
  white-space: nowrap;

  &:hover {
    color: ${adminColors.primary};
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
  commentCount: number;
  unreadCommentCount: number;
}

type StatusFilter = "ALL" | Miracle10Status;

type SortKey =
  | "id"
  | "name"
  | "quantity"
  | "visit"
  | "createdAt"
  | "edited"
  | "status";

/** 컬럼 첫 클릭 방향 — 날짜류는 최신 먼저, 나머지는 오름차순. */
const SORT_DEFAULT_DIR: Record<SortKey, 1 | -1> = {
  id: 1,
  name: 1,
  quantity: 1,
  visit: 1,
  createdAt: -1,
  edited: -1,
  status: 1,
};

/**
 * 정렬 키 값 — null이면 방향과 무관하게 항상 뒤로 보낸다.
 * 방문일: "YYYY-MM-DD HH:MM" 문자열 비교. 일정 없는 건 null(미지정).
 */
function sortValue(it: Item, key: SortKey): number | string | null {
  switch (key) {
    case "id":
      return it.id;
    case "name":
      return it.nameMasked;
    case "quantity":
      return it.quantity;
    case "createdAt":
      return Date.parse(it.createdAt);
    case "edited":
      return it.lastEditedAt ? Date.parse(it.lastEditedAt) : null;
    case "status":
      return MIRACLE10_STATUSES.indexOf(it.status);
    case "visit":
      return it.visitDate
        ? `${it.visitDate} ${it.reservedStart || it.visitTimeSlot || ""}`
        : null;
  }
}

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

  // 정렬 — 탭 필터 결과 안에서 클라이언트 정렬. 기본 = 접수일 최신순(API 순서와 동일).
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "createdAt",
    dir: -1,
  });

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: (prev.dir * -1) as 1 | -1 }
        : { key, dir: SORT_DEFAULT_DIR[key] },
    );
  };

  const sortedItems = useMemo(() => {
    const { key, dir } = sort;
    return [...filteredItems].sort((a, b) => {
      const va = sortValue(a, key);
      const vb = sortValue(b, key);
      // 미지정(null)은 방향과 무관하게 뒤로. 방문일 무지정끼리는 워크인을 앞에.
      if (va == null || vb == null) {
        if (va != null) return -1;
        if (vb != null) return 1;
        if (key === "visit") {
          const ra = a.visitType === "WALK_IN" ? 0 : 1;
          const rb = b.visitType === "WALK_IN" ? 0 : 1;
          if (ra !== rb) return ra - rb;
        }
        return b.id - a.id;
      }
      let c =
        typeof va === "string"
          ? va.localeCompare(vb as string, "ko")
          : (va as number) - (vb as number);
      if (c === 0) c = a.id - b.id;
      return c * dir;
    });
  }, [filteredItems, sort]);

  const sortHead = (key: SortKey, label: string) => (
    <SortHead
      type="button"
      $active={sort.key === key}
      onClick={() => toggleSort(key)}
      aria-label={`${label} 정렬`}
    >
      {label}
      {sort.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
    </SortHead>
  );

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
              <span>{sortHead("id", "번호")}</span>
              <span>{sortHead("name", "이름")}</span>
              <Hide>연락처</Hide>
              <span>{sortHead("quantity", "수량")}</span>
              <Hide>{sortHead("visit", "방문")}</Hide>
              <Hide>{sortHead("createdAt", "접수일")}</Hide>
              <Hide>{sortHead("edited", "최종 수정")}</Hide>
              <span>{sortHead("status", "상태")}</span>
            </HeadRow>
            {filteredItems.length === 0 ? (
              <StateBox $variant="empty">
                {filter === "ALL"
                  ? "신청이 없습니다."
                  : `${TAB_LABELS[filter]} 상태 신청이 없습니다.`}
              </StateBox>
            ) : (
              sortedItems.map((it) => {
                const visitBrief = formatVisitBrief(it);
                return (
                <Row key={it.id} href={`/admin/miracle10/${it.id}`}>
                  <span>#{it.id}</span>
                  <span>
                    {it.nameMasked}
                    {it.isSbmbMember ? " · SBMB" : ""}
                    {it.commentCount > 0 ? (
                      <CommentBadge>💬{it.commentCount}</CommentBadge>
                    ) : null}
                    {it.unreadCommentCount > 0 ? (
                      <UnreadBadge
                        title={`안 읽은 코멘트 ${it.unreadCommentCount}개`}
                      >
                        {it.unreadCommentCount}
                      </UnreadBadge>
                    ) : null}
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
