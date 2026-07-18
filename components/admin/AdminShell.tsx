"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import {
  AdminSessionProvider,
  type AdminSession,
} from "@/components/admin/AdminSessionContext";
import {
  AdminPageHeaderProvider,
  type AdminPageHeader,
} from "@/components/admin/AdminPageHeaderContext";
import { adminColors } from "@/components/admin/ui";
import {
  fetchAdminJson,
  isFresh,
  prefetch,
  useAdminData,
} from "@/lib/admin-data";
import {
  DASHBOARD_KEY,
  DASHBOARD_TTL,
  INVENTORY_KEY,
  INVENTORY_TTL,
  LIST_TTL,
  OFFICES_KEY,
  OFFICES_TTL,
  STATS_KEY,
  STATS_TTL,
  dashboardFetcher,
  inventoryFetcher,
  miracle10ListKey,
  miracle10ListUrl,
  officesFetcher,
  otcListKey,
  otcListUrl,
  statsFetcher,
  UNREAD_KEY,
  UNREAD_TTL,
  unreadFetcher,
  type AdminStatsData,
  type UnreadNotification,
} from "@/lib/admin-fetchers";

/** 데스크탑 사이드바 항목 */
const SIDE_ITEMS = [
  { href: "/admin", label: "대시보드", exact: true, badge: false },
  { href: "/admin/requests", label: "신청 관리", exact: false, badge: true },
  { href: "/admin/education", label: "교육 관리", exact: false, badge: false },
  { href: "/admin/schedule", label: "일정 캘린더", exact: false, badge: false },
  { href: "/admin/calculator", label: "OTC 계산기", exact: false, badge: false },
  {
    href: "/admin/wallet-inventory",
    label: "10모 지갑 재고",
    exact: false,
    badge: false,
  },
] as const;

/** 모바일 하단탭 — 4개 (과밀 해소) */
const TAB_ITEMS = [
  { href: "/admin", label: "홈", exact: true, badge: false },
  { href: "/admin/requests", label: "신청", exact: false, badge: true },
  { href: "/admin/schedule", label: "캘린더", exact: false, badge: false },
  { href: "/admin/calculator", label: "계산기", exact: false, badge: false },
] as const;

/** 배지 폴링 주기 — 화면에 머무는 동안에도 새 신청·코멘트를 반영 */
const BADGE_POLL_MS = 45_000;

const Shell = styled.div`
  min-height: 100vh;
  background: ${adminColors.bgPage};
  display: flex;
`;

const Sidebar = styled.aside`
  display: none;
  width: 210px;
  flex-shrink: 0;
  border-right: 1px solid ${adminColors.border};
  background: ${adminColors.white};
  padding: 1rem 0.85rem;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 768px) {
    display: flex;
  }
`;

const SideNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const SideLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: ${(p) => (p.$active ? 700 : 600)};
  color: ${(p) => (p.$active ? adminColors.primary : adminColors.textMuted)};
  background: ${(p) => (p.$active ? adminColors.primarySoft : "transparent")};
  text-decoration: none;
  &:hover {
    color: ${(p) => (p.$active ? adminColors.primary : adminColors.text)};
    background: ${(p) =>
      p.$active ? adminColors.primarySoft : adminColors.bgSubtle};
  }
`;

const SideLinkLabel = styled.span`
  flex: 1;
  min-width: 0;
`;

const CountBadge = styled.span`
  flex-shrink: 0;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: ${adminColors.alert};
  color: ${adminColors.white};
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1.25rem;
  text-align: center;
`;

const MainColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

/* ── 상단 헤더 (전 페이지 공통 고정) ── */

const TopHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: ${adminColors.white};
  border-bottom: 1px solid ${adminColors.border};

  @media (min-width: 768px) {
    padding: 0.6rem 1.5rem;
  }
`;

const BrandLink = styled(Link)`
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  font-size: 1rem;
  font-weight: 800;
  color: ${adminColors.text};
  text-decoration: none;
  white-space: nowrap;

  em {
    font-style: normal;
    font-size: 0.8rem;
    font-weight: 700;
    color: ${adminColors.primary};
  }
`;

const TopRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

/** 알림 벨 — 클릭 시 안읽음 코멘트 드롭다운 */
const BellWrap = styled.div`
  position: relative;
`;

const BellButton = styled.button<{ $dim: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${(p) => (p.$dim ? adminColors.textFaint : adminColors.textSub)};
  opacity: ${(p) => (p.$dim ? 0.55 : 1)};
  cursor: pointer;

  &:hover {
    background: ${adminColors.bgSubtle};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const BellBadge = styled.span`
  position: absolute;
  top: 1px;
  right: 0;
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: ${adminColors.danger};
  color: ${adminColors.white};
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1rem;
  text-align: center;
`;

const BellDropdown = styled.div`
  position: absolute;
  top: 2.5rem;
  right: 0;
  z-index: 50;
  width: 320px;
  max-width: calc(100vw - 1.5rem);
  max-height: 70vh;
  overflow-y: auto;
  background: ${adminColors.white};
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(17, 24, 39, 0.14);
`;

const BellHead = styled.div`
  padding: 0.7rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${adminColors.textSub};
  border-bottom: 1px solid ${adminColors.rowDivider};
`;

const NotifItem = styled(Link)`
  display: block;
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid ${adminColors.rowDivider};
  text-decoration: none;
  color: ${adminColors.text};

  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${adminColors.bgSubtle};
  }
`;

const NotifTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 700;
`;

const NotifUnread = styled.span`
  min-width: 1rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: ${adminColors.danger};
  color: ${adminColors.white};
  font-size: 0.62rem;
  font-weight: 800;
  text-align: center;
`;

const NotifPreview = styled.div`
  margin-top: 0.2rem;
  font-size: 0.76rem;
  color: ${adminColors.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NotifEmpty = styled.div`
  padding: 1.5rem 1rem;
  text-align: center;
  font-size: 0.82rem;
  color: ${adminColors.textFaint};
`;

const ProfileLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.55rem;
  border-radius: 8px;
  color: ${adminColors.textSub};
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;

  &:hover {
    background: ${adminColors.bgSubtle};
    color: ${adminColors.text};
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const ProfileName = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`;

const LogoutIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${adminColors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${adminColors.bgSubtle};
    color: ${adminColors.text};
  }

  svg {
    width: 19px;
    height: 19px;
  }
`;

/* ── 하단 줄 — 페이지 제목 + 액션 슬롯 (셸이 유일한 제목 소유자) ── */

const PageHeaderBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem 0.7rem;
  background: ${adminColors.white};
  border-bottom: 1px solid ${adminColors.border};

  @media (min-width: 768px) {
    padding: 1rem 1.5rem 0.85rem;
  }
`;

const PageTitle = styled.h1`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 1.15rem;
  font-weight: 800;
  color: ${adminColors.text};
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.35rem;
  }
`;

const PageActions = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Main = styled.main`
  flex: 1;
  padding-top: 0.75rem;
  padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));

  @media (min-width: 768px) {
    padding-bottom: 2rem;
  }
`;

const BottomNav = styled.nav`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  border-top: 1px solid ${adminColors.border};
  background: ${adminColors.white};
  padding-bottom: env(safe-area-inset-bottom, 0px);

  @media (min-width: 768px) {
    display: none;
  }
`;

const TabLink = styled(Link)<{ $active: boolean }>`
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  min-height: 3.5rem;
  font-size: 0.72rem;
  font-weight: ${(p) => (p.$active ? 700 : 600)};
  color: ${(p) => (p.$active ? adminColors.primary : adminColors.textFaint)};
  text-decoration: none;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 25%;
    right: 25%;
    height: 2px;
    border-radius: 0 0 2px 2px;
    background: ${(p) => (p.$active ? adminColors.primary : "transparent")};
  }
`;

const TabBadge = styled.span`
  position: absolute;
  top: 0.45rem;
  right: calc(50% - 1.6rem);
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: ${adminColors.danger};
  color: ${adminColors.white};
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1rem;
  text-align: center;
`;

/* ── 아이콘 (인라인 SVG) ── */

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function isNavActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 신청 탭 활성 — 통합 화면 + 기존 목록/상세 경로 전부 */
function isRequestsActive(pathname: string): boolean {
  return (
    pathname.startsWith("/admin/requests") ||
    pathname.startsWith("/admin/miracle10") ||
    pathname.startsWith("/admin/otc-requests")
  );
}

function navActive(pathname: string, href: string, exact: boolean): boolean {
  if (href === "/admin/requests") return isRequestsActive(pathname);
  return isNavActive(pathname, href, exact);
}

function resolvePageTitle(pathname: string): string {
  if (/^\/admin\/(miracle10|otc-requests)\/[^/]+$/.test(pathname)) {
    return "신청 상세";
  }
  if (
    pathname.startsWith("/admin/requests") ||
    pathname === "/admin/miracle10" ||
    pathname === "/admin/otc-requests"
  ) {
    return "신청 관리";
  }
  if (pathname.startsWith("/admin/profile")) return "내 프로필";
  if (/^\/admin\/education\/[^/]+\/applicants$/.test(pathname)) {
    return "신청자 명단";
  }
  if (pathname === "/admin/education/educators") return "교육자 신청";
  if (pathname === "/admin/education/slots") return "교육 슬롯";
  if (/^\/admin\/education\/[^/]+$/.test(pathname)) return "행사 상세";
  if (pathname.startsWith("/admin/education")) return "교육 관리";
  if (pathname.startsWith("/admin/schedule")) return "일정·근무 캘린더";
  if (pathname.startsWith("/admin/calculator")) return "BMB OTC 단가 계산기";
  if (pathname.startsWith("/admin/wallet-inventory")) {
    return "10모의 기적 지갑 재고";
  }
  if (pathname === "/admin") return "운영 대시보드";
  return "운영";
}

/** 내비 링크 hover/touchstart 시 해당 화면 API를 캐시에 선주입 (B-5). */
function prefetchForHref(href: string) {
  if (href === "/admin") {
    prefetch(DASHBOARD_KEY, dashboardFetcher, DASHBOARD_TTL);
  } else if (href === "/admin/requests") {
    prefetch(
      miracle10ListKey("PENDING", false),
      () => fetchAdminJson(miracle10ListUrl("PENDING", false)),
      LIST_TTL,
    );
    prefetch(
      otcListKey("ALL", false),
      () => fetchAdminJson(otcListUrl("ALL", false)),
      LIST_TTL,
    );
  } else if (href === "/admin/schedule") {
    prefetch(OFFICES_KEY, officesFetcher, OFFICES_TTL);
  } else if (href === "/admin/wallet-inventory") {
    prefetch(INVENTORY_KEY, inventoryFetcher, INVENTORY_TTL);
    prefetch(STATS_KEY, statsFetcher, STATS_TTL);
  }
}

function fmtNotifTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 알림 벨 — 클릭 시 안읽음 코멘트 드롭다운. 열릴 때만 목록 fetch(lazy). */
function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const dim = unreadCount === 0;

  // 바깥 클릭·ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <BellWrap>
      <BellButton
        type="button"
        $dim={dim}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={
          unreadCount > 0 ? `안 읽은 코멘트 ${unreadCount}개` : "알림 없음"
        }
        title={unreadCount > 0 ? `안 읽은 코멘트 ${unreadCount}개` : "알림 없음"}
      >
        <BellIcon />
        {unreadCount > 0 ? <BellBadge>{unreadCount}</BellBadge> : null}
      </BellButton>
      {open ? (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <BellDropdown role="menu">
            <BellHead>안 읽은 코멘트</BellHead>
            <NotificationList onNavigate={() => setOpen(false)} />
          </BellDropdown>
        </>
      ) : null}
    </BellWrap>
  );
}

function NotificationList({ onNavigate }: { onNavigate: () => void }) {
  const { data, isLoading } = useAdminData<UnreadNotification[]>(
    UNREAD_KEY,
    unreadFetcher,
    { ttl: UNREAD_TTL },
  );

  if (isLoading && !data) {
    return <NotifEmpty>불러오는 중…</NotifEmpty>;
  }
  if (!data || data.length === 0) {
    return <NotifEmpty>안 읽은 코멘트가 없습니다.</NotifEmpty>;
  }
  return (
    <>
      {data.map((n) => (
        <NotifItem
          key={`${n.targetType}-${n.targetId}`}
          href={n.href}
          onClick={onNavigate}
        >
          <NotifTop>
            <span>
              #{n.targetId} {n.name}
            </span>
            <NotifUnread>{n.unread}</NotifUnread>
          </NotifTop>
          <NotifPreview>
            {n.lastAuthorName}: {n.lastBody}
          </NotifPreview>
          <NotifPreview style={{ marginTop: "0.1rem" }}>
            {fmtNotifTime(n.lastCreatedAt)}
          </NotifPreview>
        </NotifItem>
      ))}
    </>
  );
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession>({
    adminUserId: null,
    username: null,
    displayName: null,
    loading: true,
  });
  const [pageHeader, setPageHeader] = useState<AdminPageHeader | null>(null);

  const headerApi = useMemo(() => ({ setHeader: setPageHeader }), []);

  // 배지·벨 — 캐시 공유 (대시보드 응답이 admin:stats를 채우면 별도 호출 없음, B-2)
  const { data: stats, refresh: refreshStats } = useAdminData<AdminStatsData>(
    STATS_KEY,
    statsFetcher,
    { ttl: STATS_TTL },
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/auth/me");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const meJson = await res.json();
        if (!cancelled) {
          if (meJson.ok) {
            setSession({
              adminUserId: meJson.adminUserId ?? null,
              username: meJson.username ?? null,
              displayName: meJson.displayName ?? null,
              loading: false,
            });
          } else {
            setSession((prev) => ({ ...prev, loading: false }));
          }
        }
      } catch {
        if (!cancelled) {
          setSession((prev) => ({ ...prev, loading: false }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // 라우트 이동 시 — 캐시가 fresh면 스킵 (중복 호출 제거)
  useEffect(() => {
    if (!isFresh(STATS_KEY, STATS_TTL)) refreshStats();
  }, [pathname, refreshStats]);

  // 45초 폴링 — fresh면 스킵, 백그라운드면 중단 (포커스 복귀 revalidate는 훅이 처리)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && !isFresh(STATS_KEY, STATS_TTL)) refreshStats();
    }, BADGE_POLL_MS);
    return () => clearInterval(timer);
  }, [refreshStats]);

  const requestBadgeCount = (stats?.pending ?? 0) + (stats?.otcPending ?? 0);
  const commentUnread = stats?.commentUnread ?? 0;
  const defaultTitle = useMemo(() => resolvePageTitle(pathname), [pathname]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <AdminSessionProvider value={session}>
      <AdminPageHeaderProvider value={headerApi}>
        <Shell>
          <Sidebar>
            <SideNav>
              {SIDE_ITEMS.map((item) => (
                <SideLink
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onMouseEnter={() => prefetchForHref(item.href)}
                  onTouchStart={() => prefetchForHref(item.href)}
                  $active={navActive(pathname, item.href, item.exact)}
                >
                  <SideLinkLabel>{item.label}</SideLinkLabel>
                  {item.badge && requestBadgeCount > 0 ? (
                    <CountBadge aria-label={`접수 대기 ${requestBadgeCount}건`}>
                      {requestBadgeCount}
                    </CountBadge>
                  ) : null}
                </SideLink>
              ))}
            </SideNav>
          </Sidebar>

          <MainColumn>
            <TopHeader>
              <BrandLink href="/admin">
                춘심 <em>Admin</em>
              </BrandLink>
              <TopRight>
                <NotificationBell unreadCount={commentUnread} />
                <ProfileLink href="/admin/profile" aria-label="내 프로필">
                  <UserIcon />
                  {session.displayName ? (
                    <ProfileName>{session.displayName}</ProfileName>
                  ) : null}
                </ProfileLink>
                <LogoutIconButton
                  type="button"
                  onClick={handleLogout}
                  aria-label="로그아웃"
                  title="로그아웃"
                >
                  <LogoutIcon />
                </LogoutIconButton>
              </TopRight>
            </TopHeader>

            <PageHeaderBar>
              <PageTitle>{pageHeader?.title ?? defaultTitle}</PageTitle>
              {pageHeader?.actions ? (
                <PageActions>{pageHeader.actions}</PageActions>
              ) : null}
            </PageHeaderBar>

            <Main>{children}</Main>
          </MainColumn>

          <BottomNav aria-label="어드민 메뉴">
            {TAB_ITEMS.map((item) => (
              <TabLink
                key={item.href}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => prefetchForHref(item.href)}
                onTouchStart={() => prefetchForHref(item.href)}
                $active={navActive(pathname, item.href, item.exact)}
              >
                {item.badge && requestBadgeCount > 0 ? (
                  <TabBadge aria-hidden="true">{requestBadgeCount}</TabBadge>
                ) : null}
                {item.label}
              </TabLink>
            ))}
          </BottomNav>
        </Shell>
      </AdminPageHeaderProvider>
    </AdminSessionProvider>
  );
}
