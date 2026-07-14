"use client";

// 10모의 기적 신청 목록 — /admin/requests 세그먼트에서 사용 (구 /admin/miracle10 이동분).
// 1덩이 백엔드 전환: 서버 counts + ?status= 필터 + limit 50(+더 보기).

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  UnreadBadge,
  adminColors,
} from "@/components/admin/ui";
import {
  Hide,
  HeadRow,
  ListMeta,
  LoadMoreBtn,
  Row,
  SortHead,
  SubMobile,
  Table,
  Tabs,
  Toolbar,
} from "@/components/admin/requests/list-ui";
import styled from "styled-components";

const PAGE_SIZE = 50;
const COLS = "64px 1fr 1fr 72px 100px 100px 140px 120px";
const MOBILE_COLS = "48px 1fr 70px 96px";
const MIN_WIDTH = 860;

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
  lastEditedByName: string | null;
  lastEditedAt: string | null;
  nameMasked: string;
  contactMasked: string;
  commentCount: number;
  unreadCommentCount: number;
}

interface Counts {
  PENDING: number;
  CONTACTED: number;
  VERIFIED: number;
  COMPLETED: number;
  CANCELED: number;
  total: number;
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

const STATUS_TAB_ORDER: StatusFilter[] = [...MIRACLE10_STATUSES, "ALL"];

const TAB_LABELS: Record<StatusFilter, string> = {
  ...STATUS_LABELS,
  ALL: "전체",
};

export function Miracle10List({
  initialStatus,
  refreshTick,
}: {
  initialStatus?: string | null;
  refreshTick: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>(() =>
    initialStatus === "ALL" ||
    MIRACLE10_STATUSES.includes(initialStatus as Miracle10Status)
      ? (initialStatus as StatusFilter)
      : "PENDING",
  );
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (status: StatusFilter, offset: number) => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/admin/miracle10?${params.toString()}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return null;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "목록을 불러오지 못했습니다.");
      }
      return data as { items: Item[]; counts: Counts; total: number };
    },
    [router],
  );

  // 필터 변경·새로고침 시 첫 페이지부터 다시
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load(filter, 0)
      .then((data) => {
        if (cancelled || !data) return;
        setItems(data.items);
        setCounts(data.counts);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, refreshTick, load]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await load(filter, items.length);
      if (data) {
        setItems((prev) => [...prev, ...data.items]);
        setCounts(data.counts);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredTotal =
    filter === "ALL" ? (counts?.total ?? 0) : (counts?.[filter] ?? 0);
  const hasMore = items.length < filteredTotal;

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
    return [...items].sort((a, b) => {
      const va = sortValue(a, key);
      const vb = sortValue(b, key);
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
  }, [items, sort]);

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

  const tabCount = (tab: StatusFilter) =>
    tab === "ALL" ? (counts?.total ?? 0) : (counts?.[tab] ?? 0);

  return (
    <>
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
      </Toolbar>

      {loading && <StateBox $variant="loading">불러오는 중…</StateBox>}
      {error && <StateBox $variant="error">{error}</StateBox>}

      {!loading && !error && (
        <>
          <ListMeta>
            {TAB_LABELS[filter]} {filteredTotal}건
            {filter !== "ALL" ? ` · 전체 ${counts?.total ?? 0}건` : ""}
            {items.length < filteredTotal
              ? ` · ${items.length}건 표시 중`
              : ""}
          </ListMeta>
          <Table>
            <HeadRow $cols={COLS} $mobileCols={MOBILE_COLS} $minWidth={MIN_WIDTH}>
              <span>{sortHead("id", "번호")}</span>
              <span>{sortHead("name", "이름")}</span>
              <Hide>연락처</Hide>
              <span>{sortHead("quantity", "수량")}</span>
              <Hide>{sortHead("visit", "방문")}</Hide>
              <Hide>{sortHead("createdAt", "접수일")}</Hide>
              <Hide>{sortHead("edited", "최종 수정")}</Hide>
              <span>{sortHead("status", "상태")}</span>
            </HeadRow>
            {sortedItems.length === 0 ? (
              <StateBox $variant="empty">
                {filter === "ALL"
                  ? "신청이 없습니다."
                  : `${TAB_LABELS[filter]} 상태 신청이 없습니다.`}
              </StateBox>
            ) : (
              sortedItems.map((it) => {
                const visitBrief = formatVisitBrief(it);
                return (
                  <Row
                    key={it.id}
                    href={`/admin/miracle10/${it.id}`}
                    $cols={COLS}
                    $mobileCols={MOBILE_COLS}
                    $minWidth={MIN_WIDTH}
                  >
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
                        <SubMobile>{visitBrief}</SubMobile>
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
          {hasMore ? (
            <LoadMoreBtn
              type="button"
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore
                ? "불러오는 중…"
                : `더 보기 (${filteredTotal - items.length}건 남음)`}
            </LoadMoreBtn>
          ) : null}
        </>
      )}
    </>
  );
}
