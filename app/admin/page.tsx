"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import AdminTopBar from "@/components/admin/AdminTopBar";

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
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

const StatLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.35rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
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
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [meRes, statsRes] = await Promise.all([
          fetch("/api/admin/auth/me"),
          fetch("/api/admin/stats"),
        ]);
        if (meRes.status === 401 || statsRes.status === 401) {
          router.push("/admin/login");
          return;
        }
        const me = await meRes.json();
        const statsJson = await statsRes.json();
        if (!meRes.ok || !me.ok) {
          throw new Error(me.error || "인증 정보를 불러오지 못했습니다.");
        }
        if (!statsRes.ok || !statsJson.ok) {
          throw new Error(statsJson.error || "집계를 불러오지 못했습니다.");
        }
        if (!cancelled) {
          setDisplayName(me.displayName);
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
      <AdminTopBar
        title="운영 대시보드"
        displayName={displayName}
        showHubLink={false}
      />

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
            <StatCard>
              <StatLabel>접수</StatLabel>
              <StatValue>{stats.pending}</StatValue>
            </StatCard>
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
