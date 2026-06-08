"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  MIRACLE10_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  type Miracle10Status,
} from "@/lib/miracle10-status";

const Page = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  &:hover {
    background: #f9fafb;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
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

const Table = styled.div`
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
`;

const HeadRow = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr 1fr 80px 110px 120px;
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
  grid-template-columns: 64px 1fr 1fr 80px 110px 120px;
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

const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: ${(p) => p.$color};
  white-space: nowrap;
`;

const Empty = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

interface Item {
  id: number;
  createdAt: string;
  status: Miracle10Status;
  quantity: number;
  visitType: string | null;
  visitDate: string | null;
  isSbmbMember: boolean;
  nameMasked: string;
  contactMasked: string;
}

export default function Miracle10AdminPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | Miracle10Status>("ALL");
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter === "ALL" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/miracle10${qs}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "목록을 불러오지 못했습니다.");
      }
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <Page>
      <TopBar>
        <Title>10모의 기적 신청 관리</Title>
        <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
      </TopBar>

      <Tabs>
        <Tab $active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          전체
        </Tab>
        {MIRACLE10_STATUSES.map((s) => (
          <Tab key={s} $active={filter === s} onClick={() => setFilter(s)}>
            {STATUS_LABELS[s]}
          </Tab>
        ))}
      </Tabs>

      {loading && <Empty>불러오는 중...</Empty>}
      {error && <Empty style={{ color: "#dc2626" }}>{error}</Empty>}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: 8, color: "#6b7280", fontSize: 13 }}>
            총 {total}건
          </div>
          <Table>
            <HeadRow>
              <span>번호</span>
              <span>이름</span>
              <Hide>연락처</Hide>
              <span>수량</span>
              <Hide>접수일</Hide>
              <span>상태</span>
            </HeadRow>
            {items.length === 0 ? (
              <Empty>신청이 없습니다.</Empty>
            ) : (
              items.map((it) => (
                <Row key={it.id} href={`/admin/miracle10/${it.id}`}>
                  <span>#{it.id}</span>
                  <span>
                    {it.nameMasked}
                    {it.isSbmbMember ? " · SBMB" : ""}
                  </span>
                  <Hide>{it.contactMasked}</Hide>
                  <span>{it.quantity}모</span>
                  <Hide>
                    {new Date(it.createdAt).toLocaleDateString("ko-KR")}
                  </Hide>
                  <span>
                    <Badge $color={STATUS_COLORS[it.status]}>
                      {STATUS_LABELS[it.status]}
                    </Badge>
                  </span>
                </Row>
              ))
            )}
          </Table>
        </>
      )}
    </Page>
  );
}
