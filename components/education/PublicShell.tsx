"use client";

// 교육 플랫폼 공개 셸 — 기존 components/layouts/PageLayout(구 메인용)과 "별개" 신규.
// 판단 이유: 헤더 내비(행사찾기·캘린더·OTC·개설신청·로그인)와 하단탭 구조가 기존과 전혀 달라
// 확장 시 기존 공개 페이지 회귀 위험 > 신규 파일 비용. Step 6 메인 재편 때 이 셸로 갈아탄다.
//
// 구성: EduHeader(데스크톱 내비 + ☰ 모바일 메뉴 + 로그인 자리) → PriceTicker(옵션)
//       → main 컨테이너 → EduFooter → BottomTabBar(모바일 3탭: 행사·캘린더·OTC).

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import {
  COMMUNITY_ECOSYSTEM_LINKTREE,
  COMMUNITY_LINKTREE,
} from "@/lib/community-linktree";
import { eduColors, eduLayout, media } from "./tokens";
import { PriceTicker } from "./PriceTicker";

/* ── 헤더 ── */

const NAV_ITEMS = [
  { href: "/events", label: "행사 찾기" },
  { href: "/events/calendar", label: "캘린더" },
  { href: "/otc", label: "OTC 거래" },
  { href: "/host", label: "개설 신청" },
] as const;

const HeaderBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  background: ${eduColors.surface};
  border-bottom: 1px solid ${eduColors.border};
`;

const HeaderInner = styled.div`
  max-width: ${eduLayout.maxWidth}px;
  margin: 0 auto;
  height: ${eduLayout.headerHeight}px;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  font-weight: 800;
  font-size: 1.05rem;
  color: ${eduColors.text};
  flex-shrink: 0;

  img {
    height: 26px;
    width: auto;
    display: block;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  ${media.md} {
    display: none; /* 모바일: 하단탭 + ☰ */
  }
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: ${(p) => (p.$active ? 800 : 600)};
  color: ${(p) => (p.$active ? eduColors.primary : eduColors.textSub)};
  background: ${(p) => (p.$active ? eduColors.primarySoft : "transparent")};
  text-decoration: none;

  &:hover {
    color: ${eduColors.primary};
    background: ${eduColors.primarySofter};
  }
`;

const HeaderRight = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Phase 1: 자리·틀만. 실제 인증은 Phase 2 — onClick placeholder.
const LoginBtn = styled.button`
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  border: 1px solid ${eduColors.primary};
  background: ${eduColors.surface};
  color: ${eduColors.primary};
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: ${eduColors.primarySoft};
  }

  ${media.md} {
    display: none; /* 모바일은 ☰ 안 */
  }
`;

const MenuBtn = styled.button`
  display: none;
  ${media.md} {
    display: inline-flex;
  }
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid ${eduColors.border};
  background: ${eduColors.surface};
  color: ${eduColors.textSub};
  font-size: 1.1rem;
  cursor: pointer;
`;

const MobileMenu = styled.div`
  display: none;
  ${media.md} {
    display: block;
  }
  border-top: 1px solid ${eduColors.border};
  background: ${eduColors.surface};
  padding: 0.5rem 1rem 0.9rem;
`;

const MobileMenuLink = styled(Link)`
  display: block;
  padding: 0.65rem 0.25rem;
  font-size: 0.92rem;
  font-weight: 700;
  color: ${eduColors.textSub};
  text-decoration: none;
  border-bottom: 1px solid ${eduColors.bg};

  &:hover {
    color: ${eduColors.primary};
  }
`;

const MobileLoginBtn = styled.button`
  width: 100%;
  margin-top: 0.7rem;
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid ${eduColors.primary};
  background: ${eduColors.primarySoft};
  color: ${eduColors.primaryText};
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
`;

/* ── 본문 ── */

const Main = styled.main`
  max-width: ${eduLayout.maxWidth}px;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
  min-height: 60vh;

  ${media.md} {
    /* 모바일 하단탭에 가리지 않게 */
    padding-bottom: calc(${eduLayout.bottomTabHeight}px + 2rem);
  }
`;

/* fullWidth 모드 — 폭 제한 없는 전체폭 패스스루(블록).
 * ★ align-items:center를 쓰면 폭 미지정 flex 컨테이너(예: /otc PageContainer·/sbmb Shell)가
 *   flex-item으로 수축해 히어로가 좁아진다(Step 8 회귀). 레거시 페이지는 전부 자체 컨테이너에서
 *   margin:auto·max-width로 스스로 정렬하므로, 여기선 전체폭만 보장하고 정렬은 관여하지 않는다. */
const MainFull = styled.main`
  display: block;
  width: 100%;
  min-height: 60vh;
`;

/* ── 푸터 ── */

const Footer = styled.footer`
  border-top: 1px solid ${eduColors.border};
  background: ${eduColors.surface};
  padding: 2rem 1rem 2.5rem;

  ${media.md} {
    padding-bottom: calc(${eduLayout.bottomTabHeight}px + 2rem);
  }
`;

const FooterInner = styled.div`
  max-width: ${eduLayout.maxWidth}px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;

  ${media.sm} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const FooterCol = styled.div`
  h4 {
    margin: 0 0 0.6rem;
    font-size: 0.78rem;
    font-weight: 800;
    color: ${eduColors.textFaint};
    letter-spacing: 0.04em;
  }
  a {
    display: block;
    padding: 0.22rem 0;
    font-size: 0.82rem;
    color: ${eduColors.textMuted};
    text-decoration: none;
    &:hover {
      color: ${eduColors.primary};
    }
  }
`;

const FooterNote = styled.p`
  max-width: ${eduLayout.maxWidth}px;
  margin: 1.5rem auto 0;
  font-size: 0.72rem;
  color: ${eduColors.textFaint};
`;

/* ── 모바일 하단탭 ── */

const TabBar = styled.nav`
  display: none;
  ${media.md} {
    display: grid;
  }
  grid-template-columns: repeat(3, 1fr);
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  height: ${eduLayout.bottomTabHeight}px;
  background: ${eduColors.surface};
  border-top: 1px solid ${eduColors.border};
  padding-bottom: env(safe-area-inset-bottom);
`;

const TabLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  font-size: 0.68rem;
  font-weight: ${(p) => (p.$active ? 800 : 600)};
  color: ${(p) => (p.$active ? eduColors.primary : eduColors.textMuted)};
  text-decoration: none;

  span.icon {
    font-size: 1.05rem;
    line-height: 1;
  }
`;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/events") {
    // /events/calendar는 캘린더 탭 소관 — 행사 탭에서 제외
    return pathname === "/events" || (pathname.startsWith("/events/") && pathname !== "/events/calendar");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <TabBar aria-label="하단 메뉴">
      <TabLink href="/events" $active={isActivePath(pathname, "/events")}>
        <span className="icon">🎓</span>행사
      </TabLink>
      <TabLink
        href="/events/calendar"
        $active={pathname === "/events/calendar"}
      >
        <span className="icon">📅</span>캘린더
      </TabLink>
      <TabLink href="/otc" $active={isActivePath(pathname, "/otc")}>
        <span className="icon">🤝</span>OTC
      </TabLink>
    </TabBar>
  );
}

export function PublicShell({
  children,
  showTicker = true,
  fullWidth = false,
}: {
  children: React.ReactNode;
  /** 시세 스트립 표시 여부 (기본 true — 메인·목록. 상세 등에서 끌 수 있음) */
  showTicker?: boolean;
  /** 본문 폭 제한 해제 — 레거시 페이지(자체 섹션 레이아웃)용 opt-in. 기본 false */
  fullWidth?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // Phase 1 placeholder — Phase 2에서 실제 인증 연결
  const onLogin = () => alert("로그인은 준비 중입니다.");

  return (
    <>
      <HeaderBar>
        <HeaderInner>
          <LogoLink href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_choonsimcom.png" alt="" />
            choonsim
          </LogoLink>
          <Nav>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                $active={isActivePath(pathname, item.href)}
              >
                {item.label}
              </NavLink>
            ))}
          </Nav>
          <HeaderRight>
            <LoginBtn type="button" onClick={onLogin}>
              로그인
            </LoginBtn>
            <MenuBtn
              type="button"
              aria-label="메뉴"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? "✕" : "☰"}
            </MenuBtn>
          </HeaderRight>
        </HeaderInner>
        {menuOpen ? (
          <MobileMenu>
            {NAV_ITEMS.map((item) => (
              <MobileMenuLink
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </MobileMenuLink>
            ))}
            <MobileMenuLink href="/sbmb" onClick={() => setMenuOpen(false)}>
              SBMB
            </MobileMenuLink>
            <MobileMenuLink
              href={COMMUNITY_ECOSYSTEM_LINKTREE.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              {COMMUNITY_ECOSYSTEM_LINKTREE.label}
            </MobileMenuLink>
            <MobileLoginBtn type="button" onClick={onLogin}>
              로그인 (준비 중)
            </MobileLoginBtn>
          </MobileMenu>
        ) : null}
      </HeaderBar>

      {showTicker ? <PriceTicker /> : null}

      {fullWidth ? <MainFull>{children}</MainFull> : <Main>{children}</Main>}

      <Footer>
        <FooterInner>
          <FooterCol>
            <h4>교육·행사</h4>
            <Link href="/events">행사 찾기</Link>
            <Link href="/events/calendar">행사 캘린더</Link>
            <Link href="/host">행사 개설 신청</Link>
          </FooterCol>
          <FooterCol>
            <h4>거래·도구</h4>
            <Link href="/otc">OTC 거래</Link>
            <Link href="/scanner">EVM 스캐너</Link>
            <Link href="/contracts">토큰 컨트랙트</Link>
          </FooterCol>
          <FooterCol>
            <h4>생태계</h4>
            <Link href="/sbmb">SBMB</Link>
            <a
              href={COMMUNITY_LINKTREE.choonsim.href}
              target="_blank"
              rel="noreferrer"
            >
              {COMMUNITY_LINKTREE.choonsim.label}
            </a>
            <a
              href={COMMUNITY_ECOSYSTEM_LINKTREE.href}
              target="_blank"
              rel="noreferrer"
            >
              {COMMUNITY_ECOSYSTEM_LINKTREE.label}
            </a>
          </FooterCol>
        </FooterInner>
        <FooterNote>© Choonsim Hub — BMB·SBMB 교육과 안전한 회관 OTC.</FooterNote>
      </Footer>

      <BottomTabBar />
    </>
  );
}
