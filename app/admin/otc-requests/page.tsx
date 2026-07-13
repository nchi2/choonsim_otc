"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  FilterTab,
  FilterTabCount,
  StateBox,
  StatusBadge,
  ToolbarButton,
  adminColors,
} from "@/components/admin/ui";
import {
  otcRequestStatusColor,
  otcRequestStatusLabel,
} from "@/lib/otc-request-status";

const Page = styled.div`
  max-width: 1100px;
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

const ListMeta = styled.div`
  margin-bottom: 0.5rem;
  color: ${adminColors.textMuted};
  font-size: 0.8rem;
`;

const Table = styled.div`
  width: 100%;
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  /* 중간 폭(태블릿)에서 컬럼 압축으로 겹치지 않게 가로 스크롤 허용 */
  overflow-x: auto;
`;

const HeadRow = styled.div`
  display: grid;
  grid-template-columns: 56px 60px 1fr 1fr 64px 96px 88px 96px;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${adminColors.bgSubtle};
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.textMuted};

  @media (min-width: 641px) {
    min-width: 800px;
  }
  @media (max-width: 640px) {
    grid-template-columns: 48px 56px 1fr 88px;
  }
`;

const Row = styled(Link)`
  display: grid;
  grid-template-columns: 56px 60px 1fr 1fr 64px 96px 88px 96px;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid ${adminColors.rowDivider};
  font-size: 0.85rem;
  color: ${adminColors.text};
  align-items: center;
  text-decoration: none;

  &:hover {
    background: #fafafa;
  }

  @media (min-width: 641px) {
    min-width: 800px;
  }
  @media (max-width: 640px) {
    grid-template-columns: 48px 56px 1fr 88px;
  }
`;

const Hide = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`;

/* 모바일 — 숨긴 수량·희망가를 이름 아래 한 줄로 병기 (10모 목록과 동일 패턴) */
const SubMobile = styled.span`
  display: none;
  @media (max-width: 640px) {
    display: block;
    margin-top: 2px;
    font-size: 0.72rem;
    color: ${adminColors.textMuted};
  }
`;

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

const TAB_LABELS: Record<SideFilter, string> = {
  ALL: "전체",
  BUY: "구매",
  SELL: "판매",
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
}

export default function AdminOtcRequestsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<SideFilter>("ALL");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await fetch("/api/admin/otc-requests");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "목록을 불러오지 못했습니다.");
        }
        setItems(data.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((it) => it.side === filter);
  }, [items, filter]);

  const tabCount = useCallback(
    (tab: SideFilter) => {
      if (tab === "ALL") return items.length;
      return items.filter((it) => it.side === tab).length;
    },
    [items],
  );

  return (
    <Page>
      <Toolbar>
        <Tabs>
          {(["ALL", "BUY", "SELL"] as SideFilter[]).map((tab) => (
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
          {refreshing ? "새로고침 중…" : "새로고침"}
        </ToolbarButton>
      </Toolbar>

      {loading && <StateBox $variant="loading">불러오는 중…</StateBox>}
      {error && <StateBox $variant="error">{error}</StateBox>}

      {!loading && !error && (
        <>
          <ListMeta>
            {TAB_LABELS[filter]} {filtered.length}건
            {filter !== "ALL" ? ` · 전체 ${items.length}건` : ""}
          </ListMeta>
          {filtered.length === 0 ? (
            <StateBox $variant="empty">
              {filter === "ALL"
                ? "신청이 없습니다."
                : `${TAB_LABELS[filter]} 신청이 없습니다.`}
            </StateBox>
          ) : (
            <Table>
              <HeadRow>
                <span>번호</span>
                <span>구분</span>
                <span>이름</span>
                <Hide>연락처</Hide>
                <Hide>수량</Hide>
                <Hide>희망가</Hide>
                <span>상태</span>
                <Hide>접수일</Hide>
              </HeadRow>
              {filtered.map((it) => {
                return (
                  <Row key={it.id} href={`/admin/otc-requests/${it.id}`}>
                    <span>#{it.id}</span>
                    <span>
                      <SideBadge $side={it.side}>
                        {it.side === "SELL" ? "판매" : "구매"}
                      </SideBadge>
                    </span>
                    <span>
                      {it.name}
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
                );
              })}
            </Table>
          )}
        </>
      )}
    </Page>
  );
}
