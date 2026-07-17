"use client";

// BMB 구매·판매(OTC) 신청 목록 — /admin/requests 세그먼트에서 사용.
// useAdminData 캐시(첫 페이지) + 서버 counts/?status + [테스트 포함] 토글.
// 구분(구매/판매)은 로드분 내 클라 필터.

import { Fragment, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
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
  ChipDivider,
  ChipScroll,
  Hide,
  HeadRow,
  ListMeta,
  LoadMoreBtn,
  Row,
  Table,
  Tabs,
  TestBadge,
  Toolbar,
} from "@/components/admin/requests/list-ui";
import { IncludeTestToggle } from "@/components/admin/requests/Miracle10List";
import { fetchAdminJson, useAdminData } from "@/lib/admin-data";
import { LIST_TTL, otcListKey, otcListUrl } from "@/lib/admin-fetchers";
import {
  OTC_REQUEST_STATUSES,
  OTC_REQUEST_STATUS_LABELS,
  otcRequestStatusColor,
  otcRequestStatusLabel,
  type OtcRequestStatus,
} from "@/lib/otc-request-status";

const COLS = "56px 60px 1fr 1fr 64px 96px 88px 96px";
const MOBILE_COLS = "48px 56px 1fr 88px";
const MIN_WIDTH = 800;

/** 메인 배너와 동일 브랜드 색 — 구매 #A8639F / 판매 #6570C5. */
const SideBadge = styled.span<{ $side: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${adminColors.white};
  background: ${(p) => (p.$side === "SELL" ? adminColors.brandSell : adminColors.brandBuy)};
  white-space: nowrap;
`;

type SideFilter = "ALL" | "BUY" | "SELL";
type StatusFilter = "ALL" | OtcRequestStatus;

const SIDE_TAB_LABELS: Record<SideFilter, string> = {
  ALL: "전체",
  BUY: "구매",
  SELL: "판매",
};

const STATUS_TAB_ORDER: StatusFilter[] = [...OTC_REQUEST_STATUSES, "ALL"];

const STATUS_TAB_LABELS: Record<StatusFilter, string> = {
  ...OTC_REQUEST_STATUS_LABELS,
  ALL: "전체",
};

interface Item {
  id: number;
  createdAt: string;
  side: string;
  name: string;
  contact: string;
  quantity: number;
  desiredPrice: number | null;
  status: string;
  lastEditedAt: string | null;
  isTest: boolean;
  commentCount: number;
  unreadCommentCount: number;
}

interface ListResponse {
  items: Item[];
  counts: Record<string, number>;
  total: number;
}

export function OtcRequestList({
  initialStatus,
}: {
  initialStatus?: string | null;
}) {
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    initialStatus === "ALL" ||
    (OTC_REQUEST_STATUSES as readonly string[]).includes(initialStatus ?? "")
      ? (initialStatus as StatusFilter)
      : "ALL",
  );
  const [includeTest, setIncludeTest] = useState(false);
  const [extraItems, setExtraItems] = useState<Item[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  const cacheKey = otcListKey(statusFilter, includeTest);
  const { data, error, isLoading, isValidating, refresh } =
    useAdminData<ListResponse>(
      cacheKey,
      () =>
        fetchAdminJson<ListResponse>(otcListUrl(statusFilter, includeTest)),
      { ttl: LIST_TTL },
    );

  useEffect(() => {
    setExtraItems([]);
  }, [cacheKey]);

  const items = useMemo(
    () => [...(data?.items ?? []), ...extraItems],
    [data, extraItems],
  );
  const counts = data?.counts ?? null;

  const filteredTotal =
    statusFilter === "ALL"
      ? (counts?.total ?? 0)
      : (counts?.[statusFilter] ?? 0);
  const hasMore = data != null && items.length < filteredTotal;

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchAdminJson<ListResponse>(
        otcListUrl(statusFilter, includeTest, items.length),
      );
      setExtraItems((prev) => [...prev, ...res.items]);
    } catch {
      /* 재시도 가능 */
    } finally {
      setLoadingMore(false);
    }
  };

  const visible = useMemo(() => {
    const filtered =
      sideFilter === "ALL"
        ? items
        : items.filter((it) => it.side === sideFilter);
    // 완료·취소 탭만 최근 처리(최종 수정)순 DESC. lastEditedAt 없으면 뒤로. 그 외 탭은 서버 순서(접수일 최신순) 유지.
    if (statusFilter === "COMPLETED" || statusFilter === "CANCELED") {
      return [...filtered].sort((a, b) => {
        const ta = a.lastEditedAt ? Date.parse(a.lastEditedAt) : null;
        const tb = b.lastEditedAt ? Date.parse(b.lastEditedAt) : null;
        if (ta == null && tb == null) return b.id - a.id;
        if (ta == null) return 1;
        if (tb == null) return -1;
        return tb - ta || b.id - a.id;
      });
    }
    return filtered;
  }, [items, sideFilter, statusFilter]);

  const sideCount = (side: SideFilter) =>
    side === "ALL"
      ? items.length
      : items.filter((it) => it.side === side).length;

  const statusCount = (tab: StatusFilter) =>
    tab === "ALL" ? (counts?.total ?? 0) : (counts?.[tab] ?? 0);

  return (
    <>
      <Toolbar>
        <Tabs aria-label="구분 필터">
          {(["ALL", "BUY", "SELL"] as SideFilter[]).map((tab) => (
            <FilterTab
              key={tab}
              type="button"
              $active={sideFilter === tab}
              onClick={() => setSideFilter(tab)}
            >
              {SIDE_TAB_LABELS[tab]}
              <FilterTabCount $active={sideFilter === tab}>
                {sideCount(tab)}
              </FilterTabCount>
            </FilterTab>
          ))}
        </Tabs>
        <IncludeTestToggle>
          <input
            type="checkbox"
            checked={includeTest}
            onChange={(e) => setIncludeTest(e.target.checked)}
          />
          테스트 포함
        </IncludeTestToggle>
      </Toolbar>
      <Toolbar style={{ marginTop: "-0.4rem" }}>
        <ChipScroll aria-label="상태 필터">
          {STATUS_TAB_ORDER.map((tab) => (
            <Fragment key={tab}>
              {/* 완료·취소·전체는 구분선 뒤로 (한 급 아래) */}
              {tab === "COMPLETED" ? <ChipDivider /> : null}
              <FilterTab
                type="button"
                $active={statusFilter === tab}
                onClick={() => setStatusFilter(tab)}
              >
                {STATUS_TAB_LABELS[tab]}
                <FilterTabCount $active={statusFilter === tab}>
                  {statusCount(tab)}
                </FilterTabCount>
              </FilterTab>
            </Fragment>
          ))}
        </ChipScroll>
      </Toolbar>

      <RefreshingBar active={isValidating && data != null} />

      {isLoading ? (
        <Skeleton variant="table" count={5} />
      ) : error && data == null ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={refresh}
        />
      ) : (
        <>
          <ListMeta>
            {SIDE_TAB_LABELS[sideFilter]}
            {statusFilter !== "ALL"
              ? ` · ${STATUS_TAB_LABELS[statusFilter]}`
              : ""}{" "}
            {visible.length}건
            {statusFilter !== "ALL" || sideFilter !== "ALL"
              ? ` · 전체 ${counts?.total ?? 0}건`
              : ""}
          </ListMeta>
          {visible.length === 0 ? (
            <EmptyState
              icon="🗂"
              title="조건에 맞는 신청이 없습니다"
              desc="필터를 바꾸거나, 새 신청이 접수되면 여기에 표시됩니다."
            />
          ) : (
            <Table>
              <HeadRow
                $cols={COLS}
                $mobileCols={MOBILE_COLS}
                $minWidth={MIN_WIDTH}
              >
                <span>번호</span>
                <span>구분</span>
                <span>이름</span>
                <Hide>연락처</Hide>
                <Hide>수량</Hide>
                <Hide>희망가</Hide>
                <span>상태</span>
                <Hide>접수일</Hide>
              </HeadRow>
              {visible.map((it) => (
                <Row
                  key={it.id}
                  href={`/admin/otc-requests/${it.id}`}
                  $cols={COLS}
                  $mobileCols={MOBILE_COLS}
                  $minWidth={MIN_WIDTH}
                  style={it.isTest ? { opacity: 0.6 } : undefined}
                >
                  <span>#{it.id}</span>
                  <span>
                    <SideBadge $side={it.side}>
                      {it.side === "SELL" ? "판매" : "구매"}
                    </SideBadge>
                  </span>
                  <span>
                    {it.name}
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
                  <Hide>{it.contact}</Hide>
                  <Hide>{it.quantity}</Hide>
                  <Hide>
                    {it.desiredPrice != null
                      ? `${it.desiredPrice.toLocaleString("ko-KR")}원`
                      : "미정"}
                  </Hide>
                  <span>
                    <StatusBadge $color={otcRequestStatusColor(it.status)}>
                      {otcRequestStatusLabel(it.status)}
                    </StatusBadge>
                  </span>
                  <Hide>
                    {new Date(it.createdAt).toLocaleDateString("ko-KR")}
                  </Hide>
                </Row>
              ))}
            </Table>
          )}

          {/* 모바일 카드 (≤640px 전용) */}
          {visible.length > 0 ? (
            <CardList>
              {visible.map((it) => (
                <CardLink
                  key={it.id}
                  href={`/admin/otc-requests/${it.id}`}
                  $test={it.isTest}
                >
                  <CardTop>
                    <CardId>#{it.id}</CardId>
                    <CardName>
                      <SideBadge $side={it.side}>
                        {it.side === "SELL" ? "판매" : "구매"}
                      </SideBadge>
                      {it.name}
                      {it.isTest ? <TestBadge>TEST</TestBadge> : null}
                      {it.commentCount > 0 ? (
                        <CommentBadge>💬{it.commentCount}</CommentBadge>
                      ) : null}
                      {it.unreadCommentCount > 0 ? (
                        <UnreadBadge>{it.unreadCommentCount}</UnreadBadge>
                      ) : null}
                    </CardName>
                    <StatusBadge $color={otcRequestStatusColor(it.status)}>
                      {otcRequestStatusLabel(it.status)}
                    </StatusBadge>
                  </CardTop>
                  <CardVisit>
                    <CardMetaFaint>
                      {it.quantity.toLocaleString("ko-KR")}개 ·{" "}
                      {it.desiredPrice != null
                        ? `${it.desiredPrice.toLocaleString("ko-KR")}원`
                        : "가격 미정"}
                    </CardMetaFaint>
                  </CardVisit>
                </CardLink>
              ))}
            </CardList>
          ) : null}
          {hasMore ? (
            <LoadMoreBtn
              type="button"
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore ? "불러오는 중…" : "더 보기"}
            </LoadMoreBtn>
          ) : null}
        </>
      )}
    </>
  );
}
