"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

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

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? "#111827" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#111827" : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : "#374151")};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
`;

const RefreshButton = styled.button`
  padding: 0.45rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
`;

const Table = styled.div`
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow-x: auto;
`;

const HeadRow = styled.div`
  display: grid;
  grid-template-columns: 56px 52px 1fr 1fr 64px 88px 72px 100px;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  font-size: 0.72rem;
  font-weight: 700;
  color: #6b7280;
  min-width: 720px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 56px 52px 1fr 1fr 64px 88px 72px 100px;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid #f1f5f9;
  font-size: 0.82rem;
  color: #111827;
  align-items: center;
  min-width: 720px;
`;

const SideBadge = styled.span<{ $side: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  background: ${(p) => (p.$side === "SELL" ? "#6570c5" : "#a8639f")};
`;

const Empty = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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
    }
  }, [router]);

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
            <Tab
              key={tab}
              type="button"
              $active={filter === tab}
              onClick={() => setFilter(tab)}
            >
              {TAB_LABELS[tab]} ({tabCount(tab)})
            </Tab>
          ))}
        </Tabs>
        <RefreshButton type="button" onClick={load} disabled={loading}>
          {loading ? "새로고침 중…" : "새로고침"}
        </RefreshButton>
      </Toolbar>

      {loading && <Empty>불러오는 중…</Empty>}
      {error && <Empty style={{ color: "#dc2626" }}>{error}</Empty>}

      {!loading && !error && (
        <Table>
          <HeadRow>
            <span>번호</span>
            <span>구분</span>
            <span>이름</span>
            <span>연락처</span>
            <span>수량</span>
            <span>희망가</span>
            <span>상태</span>
            <span>접수일</span>
          </HeadRow>
          {filtered.length === 0 ? (
            <Empty>신청이 없습니다.</Empty>
          ) : (
            filtered.map((it) => (
              <Row key={it.id}>
                <span>#{it.id}</span>
                <span>
                  <SideBadge $side={it.side}>
                    {it.side === "SELL" ? "판매" : "구매"}
                  </SideBadge>
                </span>
                <span>{it.name}</span>
                <span>{it.contact}</span>
                <span>{it.quantity}</span>
                <span>
                  {it.desiredPrice != null
                    ? `${it.desiredPrice.toLocaleString("ko-KR")}원`
                    : "미정"}
                </span>
                <span>{it.status}</span>
                <span>
                  {new Date(it.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </Row>
            ))
          )}
        </Table>
      )}
    </Page>
  );
}
