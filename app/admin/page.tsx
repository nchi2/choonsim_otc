"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 1rem 1.1rem;
`;

const PendingStatCard = styled(Link)<{ $highlight: boolean }>`
  display: block;
  border: 1px solid ${(p) => (p.$highlight ? "#fb7185" : "#e5e7eb")};
  border-radius: 12px;
  background: ${(p) => (p.$highlight ? "#fff1f2" : "#fff")};
  padding: 1rem 1.1rem;
  text-decoration: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  &:hover {
    border-color: ${(p) => (p.$highlight ? "#f43f5e" : "#d1d5db")};
    box-shadow: ${(p) =>
      p.$highlight ? "0 4px 14px rgba(244, 63, 94, 0.12)" : "none"};
  }
`;

const StatLabel = styled.div<{ $accent?: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${(p) => (p.$accent ? "#e11d48" : "#6b7280")};
  margin-bottom: 0.35rem;
`;

const StatValue = styled.div<{ $accent?: boolean }>`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${(p) => (p.$accent ? "#be123c" : "#111827")};
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 1rem;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
`;

const MenuCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.35rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  text-decoration: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  &:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.08);
  }
`;

const MenuTitle = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
`;

const MenuDesc = styled.span`
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
`;

const Empty = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6b7280;
`;

interface Stats {
  total: number;
  pending: number;
  contacted: number;
  verified: number;
  completed: number;
  canceled: number;
  active: number;
}

export default function AdminHubPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const statsRes = await fetch("/api/admin/stats");
        if (statsRes.status === 401) {
          router.push("/admin/login");
          return;
        }
        const statsJson = await statsRes.json();
        if (!statsRes.ok || !statsJson.ok) {
          throw new Error(statsJson.error || "집계를 불러오지 못했습니다.");
        }
        if (!cancelled) {
          setStats(statsJson.stats);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <Page>
      {loading && <Empty>불러오는 중...</Empty>}
      {error && <Empty style={{ color: "#dc2626" }}>{error}</Empty>}

      {!loading && !error && stats && (
        <>
          <StatsGrid>
            <StatCard>
              <StatLabel>총 신청</StatLabel>
              <StatValue>{stats.total}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>진행 중</StatLabel>
              <StatValue>{stats.active}</StatValue>
            </StatCard>
            <PendingStatCard
              href="/admin/miracle10?tab=PENDING"
              $highlight={stats.pending > 0}
            >
              <StatLabel $accent={stats.pending > 0}>접수</StatLabel>
              <StatValue $accent={stats.pending > 0}>{stats.pending}</StatValue>
            </PendingStatCard>
            <StatCard>
              <StatLabel>완료</StatLabel>
              <StatValue>{stats.completed}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>취소</StatLabel>
              <StatValue>{stats.canceled}</StatValue>
            </StatCard>
          </StatsGrid>

          <SectionTitle>메뉴</SectionTitle>
          <MenuGrid>
            <MenuCard href="/admin/schedule">
              <MenuTitle>근무 슬롯 등록</MenuTitle>
              <MenuDesc>
                사무실·날짜별 30분 근무 슬롯 등록 및 조회
              </MenuDesc>
            </MenuCard>
            <MenuCard href="/admin/miracle10">
              <MenuTitle>10모의 기적 신청 관리</MenuTitle>
              <MenuDesc>
                신청 목록·상세 조회, 상태 변경, 최종 수정자 확인
              </MenuDesc>
            </MenuCard>
            <MenuCard href="/admin/calculator">
              <MenuTitle>OTC 단가 계산기</MenuTitle>
              <MenuDesc>
                LBANK 호가 VWAP, USDT 환율, 마진 적용 매입가 시뮬레이션
              </MenuDesc>
            </MenuCard>
          </MenuGrid>
        </>
      )}
    </Page>
  );
}
