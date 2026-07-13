"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import {
  AdminSessionProvider,
  type AdminSession,
} from "@/components/admin/AdminSessionContext";
import { adminColors } from "@/components/admin/ui";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "대시보드",
    shortLabel: "홈",
    title: "운영 대시보드",
    exact: true,
    showPendingBadge: false,
  },
  {
    href: "/admin/schedule",
    label: "근무·예약",
    shortLabel: "근무",
    title: "근무 슬롯 등록",
    showPendingBadge: false,
  },
  {
    href: "/admin/miracle10",
    label: "10모 신청",
    shortLabel: "10모",
    title: "10모의 기적 신청 관리",
    showPendingBadge: true,
  },
  {
    href: "/admin/otc-requests",
    label: "OTC 신청",
    shortLabel: "OTC",
    title: "BMB 구매·판매 신청",
    showPendingBadge: false,
  },
  {
    href: "/admin/calculator",
    label: "OTC 계산기",
    shortLabel: "계산",
    title: "BMB OTC 단가 계산기",
    showPendingBadge: false,
  },
] as const;

const Shell = styled.div`
  min-height: 100vh;
  background: #f9fafb;
  display: flex;
`;

const Sidebar = styled.aside`
  display: none;
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  padding: 1.25rem 0.85rem;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 768px) {
    display: flex;
  }
`;

const Brand = styled.div`
  font-size: 0.95rem;
  font-weight: 800;
  color: #111827;
  padding: 0.35rem 0.65rem 0.85rem;
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

const PendingBadge = styled.span`
  flex-shrink: 0;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: ${adminColors.alert};
  color: #fff;
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

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1rem 1rem 0.75rem;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 1.25rem 1.5rem 1rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const TopRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const UserBadge = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 4px 10px;
  border-radius: 999px;
`;

const LogoutButton = styled.button`
  padding: 0.45rem 0.85rem;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  &:hover {
    background: #f9fafb;
  }
`;

const Main = styled.main`
  flex: 1;
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
  border-top: 1px solid #e5e7eb;
  background: #fff;
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
  font-size: 0.7rem;
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
  right: calc(50% - 1.35rem);
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: ${adminColors.alert};
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1rem;
  text-align: center;
`;

function isNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolvePageTitle(pathname: string): string {
  if (/^\/admin\/miracle10\/[^/]+$/.test(pathname)) {
    return "신청 상세";
  }
  if (pathname === "/admin/otc-requests") {
    return "BMB 구매·판매 신청";
  }
  const item = NAV_ITEMS.find((nav) =>
    isNavActive(pathname, nav.href, "exact" in nav ? nav.exact : false),
  );
  return item?.title ?? "운영";
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
  const [pendingCount, setPendingCount] = useState(0);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const statsRes = await fetch("/api/admin/stats");
        const statsJson = statsRes.ok ? await statsRes.json() : null;
        if (!cancelled && statsJson?.ok) {
          setPendingCount(statsJson.stats?.pending ?? 0);
        }
      } catch {
        /* badge는 부가 UI — 실패 시 0 유지 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const pageTitle = useMemo(() => resolvePageTitle(pathname), [pathname]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <AdminSessionProvider value={session}>
      <Shell>
        <Sidebar>
          <Brand>춘심 OTC 운영</Brand>
          <SideNav>
            {NAV_ITEMS.map((item) => (
              <SideLink
                key={item.href}
                href={item.href}
                $active={isNavActive(
                  pathname,
                  item.href,
                  "exact" in item ? item.exact : false,
                )}
              >
                <SideLinkLabel>{item.label}</SideLinkLabel>
                {item.showPendingBadge && pendingCount > 0 ? (
                  <PendingBadge aria-label={`접수 ${pendingCount}건`}>
                    {pendingCount}
                  </PendingBadge>
                ) : null}
              </SideLink>
            ))}
          </SideNav>
        </Sidebar>

        <MainColumn>
          <TopBar>
            <PageTitle>{pageTitle}</PageTitle>
            <TopRight>
              {session.displayName ? (
                <UserBadge>{session.displayName}</UserBadge>
              ) : session.loading ? (
                <UserBadge>…</UserBadge>
              ) : null}
              <LogoutButton type="button" onClick={handleLogout}>
                로그아웃
              </LogoutButton>
            </TopRight>
          </TopBar>

          <Main>{children}</Main>
        </MainColumn>

        <BottomNav aria-label="어드민 메뉴">
          {NAV_ITEMS.map((item) => (
            <TabLink
              key={item.href}
              href={item.href}
              $active={isNavActive(
                pathname,
                item.href,
                "exact" in item ? item.exact : false,
              )}
            >
              {item.showPendingBadge && pendingCount > 0 ? (
                <TabBadge aria-hidden="true">{pendingCount}</TabBadge>
              ) : null}
              {item.shortLabel}
            </TabLink>
          ))}
        </BottomNav>
      </Shell>
    </AdminSessionProvider>
  );
}
