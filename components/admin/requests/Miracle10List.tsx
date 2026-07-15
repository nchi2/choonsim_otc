"use client";

// 10모의 기적 신청 목록 — /admin/requests 세그먼트에서 사용.
// useAdminData 캐시(첫 페이지) + 서버 counts/?status + [테스트 포함] 토글.

import { Fragment, useEffect, useMemo, useState } from "react";
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
  StatusBadge,
  UnreadBadge,
  adminColors,
} from "@/components/admin/ui";
import {
  EmptyState,
  ErrorState,
  RefreshingBar,
  Skeleton,
} from "@/components/admin/States";
import {
  CardId,
  CardLink,
  CardList,
  CardMetaFaint,
  CardName,
  CardTop,
  CardVisit,
  CardVisitStrong,
  ChipDivider,
  ChipScroll,
  Hide,
  HeadRow,
  ListMeta,
  ListMetaRow,
  LoadMoreBtn,
  Row,
  SortHead,
  StockSummary,
  Table,
  TestBadge,
  Toolbar,
} from "@/components/admin/requests/list-ui";
import { fetchAdminJson, useAdminData } from "@/lib/admin-data";
import {
  LIST_TTL,
  miracle10ListKey,
  miracle10ListUrl,
} from "@/lib/admin-fetchers";

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

export const IncludeTestToggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: auto;
  font-size: 0.76rem;
  font-weight: 600;
  color: ${adminColors.textMuted};
  cursor: pointer;
  white-space: nowrap;

  input {
    margin: 0;
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
  isTest: boolean;
  lastEditedByName: string | null;
  lastEditedAt: string | null;
  nameMasked: string;
  contactMasked: string;
  commentCount: number;
  unreadCommentCount: number;
}

interface ListResponse {
  items: Item[];
  counts: Record<string, number>;
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
  wallet,
}: {
  initialStatus?: string | null;
  /** 우측 재고 요약 (10모 목록에만) — requests 페이지의 stats 캐시에서 전달 */
  wallet?: { stock: number; reserved: number; onOrder: number };
}) {
  const [filter, setFilter] = useState<StatusFilter>(() =>
    initialStatus === "ALL" ||
    MIRACLE10_STATUSES.includes(initialStatus as Miracle10Status)
      ? (initialStatus as StatusFilter)
      : "PENDING",
  );
  const [includeTest, setIncludeTest] = useState(false);
  // 더 보기 추가분 — 캐시(첫 페이지) 밖 컴포넌트 로컬
  const [extraItems, setExtraItems] = useState<Item[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const cacheKey = miracle10ListKey(filter, includeTest);
  const { data, error, isLoading, isValidating, refresh } =
    useAdminData<ListResponse>(
      cacheKey,
      () => fetchAdminJson<ListResponse>(miracle10ListUrl(filter, includeTest)),
      { ttl: LIST_TTL },
    );

  // 필터/토글 변경 시 더 보기 누적분 초기화
  useEffect(() => {
    setExtraItems([]);
  }, [cacheKey]);

  const items = useMemo(
    () => [...(data?.items ?? []), ...extraItems],
    [data, extraItems],
  );
  const counts = data?.counts ?? null;

  const filteredTotal =
    filter === "ALL" ? (counts?.total ?? 0) : (counts?.[filter] ?? 0);
  const hasMore = data != null && items.length < filteredTotal;

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchAdminJson<ListResponse>(
        miracle10ListUrl(filter, includeTest, items.length),
      );
      setExtraItems((prev) => [...prev, ...res.items]);
    } catch {
      /* 더 보기 실패 — 버튼 재시도 가능 */
    } finally {
      setLoadingMore(false);
    }
  };

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
        <ChipScroll>
          {STATUS_TAB_ORDER.map((tab, i) => (
            <Fragment key={tab}>
              {/* 완료·취소·전체는 구분선 뒤로 (한 급 아래) */}
              {tab === "COMPLETED" ? <ChipDivider /> : null}
              <FilterTab
                type="button"
                $active={filter === tab}
                onClick={() => setFilter(tab)}
              >
                {TAB_LABELS[tab]}
                <FilterTabCount $active={filter === tab}>
                  {tabCount(tab)}
                </FilterTabCount>
              </FilterTab>
            </Fragment>
          ))}
        </ChipScroll>
        <IncludeTestToggle>
          <input
            type="checkbox"
            checked={includeTest}
            onChange={(e) => setIncludeTest(e.target.checked)}
          />
          테스트 포함
        </IncludeTestToggle>
      </Toolbar>

      <RefreshingBar active={isValidating && data != null} />

      {isLoading ? (
        <Skeleton variant="table" count={6} />
      ) : error && data == null ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={refresh}
        />
      ) : (
        <>
          <ListMetaRow>
            <ListMeta>
              {TAB_LABELS[filter]} {filteredTotal}건
              {filter !== "ALL" ? ` · 전체 ${counts?.total ?? 0}건` : ""}
              {items.length < filteredTotal
                ? ` · ${items.length}건 표시 중`
                : ""}
            </ListMeta>
            {wallet ? (
              <StockSummary
                stock={wallet.stock}
                reserved={wallet.reserved}
                onOrder={wallet.onOrder}
              />
            ) : null}
          </ListMetaRow>
          {sortedItems.length === 0 ? (
            <EmptyState
              icon="🗂"
              title={
                filter === "ALL"
                  ? "신청이 없습니다"
                  : `${TAB_LABELS[filter]} 상태 신청이 없습니다`
              }
              desc="새 신청이 접수되면 여기에 표시됩니다."
            />
          ) : (
            <Table>
              <HeadRow
                $cols={COLS}
                $mobileCols={MOBILE_COLS}
                $minWidth={MIN_WIDTH}
              >
                <span>{sortHead("id", "번호")}</span>
                <span>{sortHead("name", "이름")}</span>
                <Hide>연락처</Hide>
                <span>{sortHead("quantity", "수량")}</span>
                <Hide>{sortHead("visit", "방문")}</Hide>
                <Hide>{sortHead("createdAt", "접수일")}</Hide>
                <Hide>{sortHead("edited", "최종 수정")}</Hide>
                <span>{sortHead("status", "상태")}</span>
              </HeadRow>
              {sortedItems.map((it) => {
                const visitBrief = formatVisitBrief(it);
                return (
                  <Row
                    key={it.id}
                    href={`/admin/miracle10/${it.id}`}
                    $cols={COLS}
                    $mobileCols={MOBILE_COLS}
                    $minWidth={MIN_WIDTH}
                    style={it.isTest ? { opacity: 0.6 } : undefined}
                  >
                    <span>#{it.id}</span>
                    <span>
                      {it.nameMasked}
                      {it.isSbmbMember ? " · SBMB" : ""}
                      {it.isTest ? <TestBadge>TEST</TestBadge> : null}
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
              })}
            </Table>
          )}

          {/* 모바일 카드 — 방문일시 승격 (≤640px 전용) */}
          {sortedItems.length > 0 ? (
            <CardList>
              {sortedItems.map((it) => {
                const visitBrief = formatVisitBrief(it);
                return (
                  <CardLink
                    key={it.id}
                    href={`/admin/miracle10/${it.id}`}
                    $test={it.isTest}
                  >
                    <CardTop>
                      <CardId>#{it.id}</CardId>
                      <CardName>
                        {it.nameMasked}
                        {it.isSbmbMember ? " · SBMB" : ""}
                        {it.isTest ? <TestBadge>TEST</TestBadge> : null}
                        {it.commentCount > 0 ? (
                          <CommentBadge>💬{it.commentCount}</CommentBadge>
                        ) : null}
                        {it.unreadCommentCount > 0 ? (
                          <UnreadBadge>{it.unreadCommentCount}</UnreadBadge>
                        ) : null}
                      </CardName>
                      <StatusBadge $color={STATUS_COLORS[it.status]}>
                        {STATUS_LABELS[it.status]}
                      </StatusBadge>
                    </CardTop>
                    <CardVisit>
                      <CardVisitStrong>
                        {visitBrief !== "-" ? visitBrief : "방문 미정"}
                      </CardVisitStrong>
                      <CardMetaFaint>{it.quantity}모</CardMetaFaint>
                    </CardVisit>
                  </CardLink>
                );
              })}
            </CardList>
          ) : null}
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
