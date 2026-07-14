"use client";

// BMB 구매·판매(OTC) 신청 목록 — /admin/requests 세그먼트에서 사용 (구 /admin/otc-requests 이동분).
// 서버 counts + ?status= 필터 + limit 50(+더 보기). 구분(구매/판매)은 로드분 내 클라 필터.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  CommentBadge,
  FilterTab,
  FilterTabCount,
  StateBox,
  StatusBadge,
  UnreadBadge,
} from "@/components/admin/ui";
import {
  Hide,
  HeadRow,
  ListMeta,
  LoadMoreBtn,
  Row,
  SubMobile,
  Table,
  Tabs,
  Toolbar,
} from "@/components/admin/requests/list-ui";
import {
  OTC_REQUEST_STATUSES,
  OTC_REQUEST_STATUS_LABELS,
  otcRequestStatusColor,
  otcRequestStatusLabel,
  type OtcRequestStatus,
} from "@/lib/otc-request-status";

const PAGE_SIZE = 50;
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
  color: #fff;
  background: ${(p) => (p.$side === "SELL" ? "#6570c5" : "#a8639f")};
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
  commentCount: number;
  unreadCommentCount: number;
}

type Counts = Record<string, number>;

export function OtcRequestList({
  initialStatus,
  refreshTick,
}: {
  initialStatus?: string | null;
  refreshTick: number;
}) {
  const router = useRouter();
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    initialStatus === "ALL" ||
    (OTC_REQUEST_STATUSES as readonly string[]).includes(initialStatus ?? "")
      ? (initialStatus as StatusFilter)
      : "ALL",
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
      const res = await fetch(`/api/admin/otc-requests?${params.toString()}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return null;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "목록을 불러오지 못했습니다.");
      }
      return data as { items: Item[]; counts: Counts };
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load(statusFilter, 0)
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
  }, [statusFilter, refreshTick, load]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await load(statusFilter, items.length);
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
    statusFilter === "ALL"
      ? (counts?.total ?? 0)
      : (counts?.[statusFilter] ?? 0);
  const hasMore = items.length < filteredTotal;

  const visible = useMemo(
    () =>
      sideFilter === "ALL"
        ? items
        : items.filter((it) => it.side === sideFilter),
    [items, sideFilter],
  );

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
      </Toolbar>
      <Toolbar style={{ marginTop: "-0.4rem" }}>
        <Tabs aria-label="상태 필터">
          {STATUS_TAB_ORDER.map((tab) => (
            <FilterTab
              key={tab}
              type="button"
              $active={statusFilter === tab}
              onClick={() => setStatusFilter(tab)}
            >
              {STATUS_TAB_LABELS[tab]}
              <FilterTabCount $active={statusFilter === tab}>
                {statusCount(tab)}
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
            <StateBox $variant="empty">조건에 맞는 신청이 없습니다.</StateBox>
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
                >
                  <span>#{it.id}</span>
                  <span>
                    <SideBadge $side={it.side}>
                      {it.side === "SELL" ? "판매" : "구매"}
                    </SideBadge>
                  </span>
                  <span>
                    {it.name}
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
                    <SubMobile>
                      {it.quantity.toLocaleString("ko-KR")}개 ·{" "}
                      {it.desiredPrice != null
                        ? `${it.desiredPrice.toLocaleString("ko-KR")}원`
                        : "가격 미정"}
                    </SubMobile>
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
