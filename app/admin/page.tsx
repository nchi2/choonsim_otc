"use client";

// 운영 대시보드 — "할 일 중심".
// ① 지금 할 일(접수 대기) ② 오늘 내 일정 ③ 현황 요약(압축) ④ 지갑 재고 ⑤ 바로가기.
// 데이터는 /api/admin/dashboard 한 번으로 (구 stats+offices+사무실별 reservations 3+N회 → 1회).

import { useEffect, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { adminColors } from "@/components/admin/ui";
import {
  ErrorState,
  RefreshingBar,
  Skeleton,
} from "@/components/admin/States";
import { useAdminData } from "@/lib/admin-data";
import {
  DASHBOARD_KEY,
  DASHBOARD_TTL,
  dashboardFetcher,
  type DashboardData,
} from "@/lib/admin-fetchers";

const Page = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1.5rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 2rem;
  }
`;

/* ── 상단 2컬럼: 지금 할 일 + 오늘 내 일정 ── */

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    align-items: stretch;
  }
`;

const Card = styled.section`
  border: 1px solid ${adminColors.border};
  border-radius: 14px;
  background: ${adminColors.white};
  padding: 1.1rem 1.25rem;
`;

const CardLabel = styled.h2`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: ${adminColors.textMuted};
  margin: 0 0 0.75rem;
`;

/* 지금 할 일 */

const TodoCard = styled(Card)<{ $alert: boolean }>`
  border-color: ${(p) =>
    p.$alert ? adminColors.alertBorder : adminColors.border};
  background: ${(p) => (p.$alert ? adminColors.alertSoft : adminColors.white)};
`;

const TodoRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
`;

const TodoItem = styled(Link)<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid
    ${(p) => (p.$active ? adminColors.alertBorder : adminColors.border)};
  background: ${adminColors.white};
  text-decoration: none;
  transition: box-shadow 0.15s, border-color 0.15s;

  &:hover {
    border-color: ${(p) =>
      p.$active ? adminColors.alert : adminColors.borderInput};
    box-shadow: ${(p) =>
      p.$active ? "0 4px 14px rgba(234, 88, 12, 0.15)" : "none"};
  }
`;

const TodoNameRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
`;

const TodoName = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
`;

const TodoChevron = styled.span<{ $active: boolean }>`
  font-size: 0.9rem;
  color: ${(p) => (p.$active ? adminColors.alert : adminColors.textFaint)};
`;

const TodoValue = styled.span<{ $active: boolean }>`
  font-size: 2rem;
  line-height: 1.15;
  font-weight: 800;
  color: ${(p) => (p.$active ? adminColors.alertTextStrong : adminColors.textFaint)};
`;

const TodoUnit = styled.span`
  font-size: 1rem;
  font-weight: 700;
`;

const CalmText = styled.p`
  margin: 0.25rem 0 0.35rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${adminColors.textMuted};
`;

/* 오늘 내 일정 */

const ScheduleList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const ScheduleItem = styled.li`
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${adminColors.rowDivider};
  border-radius: 10px;
  background: ${adminColors.successSoft};
  font-size: 0.88rem;
`;

const ScheduleTime = styled.span`
  flex-shrink: 0;
  font-weight: 800;
  color: ${adminColors.success};
  font-variant-numeric: tabular-nums;
`;

const ScheduleName = styled.span`
  font-weight: 700;
  color: ${adminColors.text};
`;

const ScheduleOffice = styled.span`
  margin-left: auto;
  font-size: 0.75rem;
  color: ${adminColors.textMuted};
  white-space: nowrap;
`;

const EmptyLine = styled.p`
  margin: 0.25rem 0 0.35rem;
  font-size: 0.88rem;
  color: ${adminColors.textFaint};
`;

const CardFootLink = styled(Link)`
  display: inline-block;
  margin-top: 0.7rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${adminColors.primary};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

/* ── 현황 요약 — 상태 열 정렬 그리드 ── */

const SummaryCard = styled(Card)`
  margin-bottom: 1rem;
  padding: 0.9rem 1.25rem;
`;

/* 6열 그리드: 라벨 | 연락완료 | 진행 | 완료 | 취소(회색) | 전체 */
const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(6rem, auto) repeat(5, minmax(0, 1fr));
  gap: 0.15rem 0.35rem;
  align-items: baseline;
  overflow-x: auto;
`;

const SgHead = styled.span<{ $muted?: boolean }>`
  font-size: 0.68rem;
  font-weight: 700;
  text-align: center;
  color: ${(p) => (p.$muted ? adminColors.textFaint : adminColors.textMuted)};
  padding-bottom: 0.15rem;
`;

const SgRowLabel = styled.span`
  font-size: 0.82rem;
  font-weight: 800;
  color: ${adminColors.text};
  white-space: nowrap;
`;

const SgCell = styled(Link)<{ $muted?: boolean }>`
  font-size: 0.92rem;
  font-weight: 800;
  text-align: center;
  text-decoration: none;
  color: ${(p) => (p.$muted ? adminColors.textFaint : adminColors.textSub)};

  &:hover {
    color: ${(p) => (p.$muted ? adminColors.textMuted : adminColors.primary)};
  }
`;

const WalletRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.8rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${adminColors.rowDivider};
  font-size: 0.84rem;
`;

const UpdatedText = styled.span`
  font-size: 0.72rem;
  color: ${adminColors.textFaint};
`;

const WalletStat = styled.span`
  color: ${adminColors.textMuted};
  white-space: nowrap;

  strong {
    color: ${adminColors.textSub};
    font-weight: 800;
  }
`;

const WalletShortage = styled.span`
  color: ${adminColors.danger};
  font-weight: 800;
  white-space: nowrap;
`;

const WalletBig = styled(Link)`
  font-size: 1.15rem;
  font-weight: 800;
  color: ${adminColors.primary};
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`;

/* ── 바로가기 ── */

const SectionTitle = styled.h2`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${adminColors.textMuted};
  margin: 1.25rem 0 0.75rem;
`;

/* 바로가기 — 아이콘 타일 그리드로 압축 */
const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 0.6rem;

  @media (min-width: 560px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
`;

const MenuCard = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.35rem;
  padding: 0.85rem 0.6rem;
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  text-decoration: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover {
    border-color: ${adminColors.primaryBorder};
    box-shadow: 0 4px 14px rgba(67, 56, 202, 0.08);
  }
`;

const MenuIcon = styled.span`
  font-size: 1.5rem;
  line-height: 1;
`;

const MenuTitle = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${adminColors.text};
  line-height: 1.3;
`;

interface Stats {
  total: number;
  pending: number;
  contacted: number;
  verified: number;
  completed: number;
  canceled: number;
  active: number;
  otc: {
    total: number;
    pending: number;
    contacted: number;
    agreed: number;
    completed: number;
    canceled: number;
  };
  walletStock: number;
  walletIn: number;
  walletOut: number;
  wallet: { stock: number; onOrder: number; reserved: number };
}

interface TodayItem {
  orderId: number;
  time: string;
  name: string;
  officeName: string | null;
}

/** "방금 갱신" / "N분 전 갱신" — 초 단위는 노이즈라 분 기준. */
function relativeUpdated(ts: number, now: number): string {
  if (!ts) return "";
  const sec = Math.max(0, Math.round((now - ts) / 1000));
  if (sec < 60) return "방금 갱신";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}분 전 갱신`;
  return `${Math.round(min / 60)}시간 전 갱신`;
}

export default function AdminHubPage() {
  // 단일 엔드포인트 + 캐시 — 재방문 시 즉시 렌더 + 백그라운드 갱신 (SWR)
  const { data, error, isLoading, isValidating, refresh, dataUpdatedAt } =
    useAdminData<DashboardData>(DASHBOARD_KEY, dashboardFetcher, {
      ttl: DASHBOARD_TTL,
    });

  // 상대 갱신 시각 표시 — 20초마다 라벨 갱신
  const [now, setNow] = useState(() => dataUpdatedAt || 0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(t);
  }, [dataUpdatedAt]);

  if (isLoading) {
    return (
      <Page>
        <Skeleton variant="stat" count={3} />
        <div style={{ height: "1rem" }} />
        <Skeleton variant="card" count={2} />
      </Page>
    );
  }
  if (error && !data) {
    return (
      <Page>
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={refresh}
        />
      </Page>
    );
  }
  if (!data) return null;

  const stats: Stats = data.stats;
  const today: TodayItem[] = data.todayMySchedule ?? [];

  const todoTotal = stats.pending + stats.otc.pending;

  return (
    <Page>
      <RefreshingBar active={isValidating} />
      <TopGrid>
        <TodoCard $alert={todoTotal > 0}>
          <CardLabel>지금 할 일 — 처리 대기</CardLabel>
          {todoTotal === 0 ? (
            <CalmText>처리 대기 중인 접수가 없습니다.</CalmText>
          ) : (
            <TodoRow>
              <TodoItem
                href="/admin/requests?type=miracle10&tab=PENDING"
                $active={stats.pending > 0}
              >
                <TodoNameRow>
                  <TodoName>10모의 기적 접수</TodoName>
                  <TodoChevron $active={stats.pending > 0}>›</TodoChevron>
                </TodoNameRow>
                <TodoValue $active={stats.pending > 0}>
                  {stats.pending}
                  <TodoUnit>건</TodoUnit>
                </TodoValue>
              </TodoItem>
              <TodoItem
                href="/admin/requests?type=otc&status=PENDING"
                $active={stats.otc.pending > 0}
              >
                <TodoNameRow>
                  <TodoName>OTC 접수</TodoName>
                  <TodoChevron $active={stats.otc.pending > 0}>›</TodoChevron>
                </TodoNameRow>
                <TodoValue $active={stats.otc.pending > 0}>
                  {stats.otc.pending}
                  <TodoUnit>건</TodoUnit>
                </TodoValue>
              </TodoItem>
            </TodoRow>
          )}
        </TodoCard>

        <Card>
          <CardLabel>오늘 내 일정 (확정 방문)</CardLabel>
          {today.length === 0 ? (
            <EmptyLine>오늘 확정된 방문 일정이 없습니다.</EmptyLine>
          ) : (
            <ScheduleList>
              {today.map((t) => (
                <ScheduleItem key={`${t.orderId}`}>
                  <ScheduleTime>{t.time}</ScheduleTime>
                  <ScheduleName>
                    <Link
                      href={`/admin/miracle10/${t.orderId}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {t.name}
                    </Link>
                  </ScheduleName>
                  <ScheduleOffice>{t.officeName}</ScheduleOffice>
                </ScheduleItem>
              ))}
            </ScheduleList>
          )}
          <CardFootLink href="/admin/schedule">
            일정 캘린더 열기 →
          </CardFootLink>
        </Card>
      </TopGrid>

      <SummaryCard>
        <CardLabel
          as="div"
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span>현황 요약</span>
          {dataUpdatedAt ? (
            <UpdatedText>{relativeUpdated(dataUpdatedAt, now)}</UpdatedText>
          ) : null}
        </CardLabel>
        <StatusGrid>
          {/* 헤더 — 취소 열은 회색으로 격하 */}
          <span />
          <SgHead>연락완료</SgHead>
          <SgHead>진행</SgHead>
          <SgHead>완료</SgHead>
          <SgHead $muted>취소</SgHead>
          <SgHead>전체</SgHead>

          <SgRowLabel>10모의 기적</SgRowLabel>
          <SgCell href="/admin/requests?type=miracle10&tab=CONTACTED">
            {stats.contacted}
          </SgCell>
          <SgCell
            href="/admin/requests?type=miracle10&tab=VERIFIED"
            title="일정확정"
          >
            {stats.verified}
          </SgCell>
          <SgCell href="/admin/requests?type=miracle10&tab=COMPLETED">
            {stats.completed}
          </SgCell>
          <SgCell href="/admin/requests?type=miracle10&tab=CANCELED" $muted>
            {stats.canceled}
          </SgCell>
          <SgCell href="/admin/requests?type=miracle10&tab=ALL">
            {stats.total}
          </SgCell>

          <SgRowLabel>BMB 구매·판매</SgRowLabel>
          <SgCell href="/admin/requests?type=otc&status=CONTACTED">
            {stats.otc.contacted}
          </SgCell>
          <SgCell
            href="/admin/requests?type=otc&status=AGREED"
            title="합의완료"
          >
            {stats.otc.agreed}
          </SgCell>
          <SgCell href="/admin/requests?type=otc&status=COMPLETED">
            {stats.otc.completed}
          </SgCell>
          <SgCell href="/admin/requests?type=otc&status=CANCELED" $muted>
            {stats.otc.canceled}
          </SgCell>
          <SgCell href="/admin/requests?type=otc&status=ALL">
            {stats.otc.total}
          </SgCell>
        </StatusGrid>

        <WalletRow>
          <SgRowLabel>10모 지갑 재고</SgRowLabel>
          <WalletBig href="/admin/wallet-inventory">
            {stats.wallet.stock}장
            {stats.wallet.onOrder > 0
              ? ` (+${stats.wallet.onOrder} 예정)`
              : ""}
          </WalletBig>
          <WalletStat>
            확정 예약 소요 <strong>{stats.wallet.reserved}</strong>장
          </WalletStat>
          {stats.wallet.stock - stats.wallet.reserved < 0 ? (
            <WalletShortage>
              부족 {stats.wallet.reserved - stats.wallet.stock}장 ⚠️
            </WalletShortage>
          ) : null}
        </WalletRow>
      </SummaryCard>

      <SectionTitle>바로가기</SectionTitle>
      <MenuGrid>
        <MenuCard href="/admin/schedule">
          <MenuIcon aria-hidden>📅</MenuIcon>
          <MenuTitle>일정·근무 캘린더</MenuTitle>
        </MenuCard>
        <MenuCard href="/admin/requests?type=miracle10">
          <MenuIcon aria-hidden>🎯</MenuIcon>
          <MenuTitle>10모의 기적</MenuTitle>
        </MenuCard>
        <MenuCard href="/admin/requests?type=otc">
          <MenuIcon aria-hidden>💱</MenuIcon>
          <MenuTitle>BMB 구매·판매</MenuTitle>
        </MenuCard>
        <MenuCard href="/admin/calculator">
          <MenuIcon aria-hidden>🧮</MenuIcon>
          <MenuTitle>단가 계산기</MenuTitle>
        </MenuCard>
        <MenuCard href="/admin/wallet-inventory">
          <MenuIcon aria-hidden>📦</MenuIcon>
          <MenuTitle>지갑 재고</MenuTitle>
        </MenuCard>
        <MenuCard href="/admin/profile">
          <MenuIcon aria-hidden>👤</MenuIcon>
          <MenuTitle>내 프로필</MenuTitle>
        </MenuCard>
      </MenuGrid>
    </Page>
  );
}
