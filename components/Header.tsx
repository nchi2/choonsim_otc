"use client";

import styled, { css } from "styled-components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ECOSYSTEM_SECTION_ANCHOR_ID } from "@/lib/ecosystem-links";

const HeaderContainer = styled.header<{
  $hasBackground: boolean;
  $isAbsolute: boolean;
}>`
  position: ${(props) => (props.$isAbsolute ? "absolute" : "relative")};
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  /* 모바일: 네비 4개가 한 줄에 들어가도록 좌우 패딩 축소 */
  padding: 0.75rem 0.875rem;
  background-color: ${(props) =>
    props.$hasBackground ? "transparent" : "#ffffff"};
  border: none;
  box-shadow: ${(props) =>
    props.$hasBackground ? "none" : "0 1px 3px rgba(0, 0, 0, 0.1)"};
  z-index: 10;

  @media (min-width: 768px) {
    padding: 1.25rem 2.5rem;
  }
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background-color: transparent;
`;

const LogoLink = styled(Link)`
  text-decoration: none;
  min-width: 0;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;

  @media (min-width: 768px) {
    gap: 8px;
  }
`;

const LogoMark = styled.img`
  width: 28px;
  height: 28px;
  display: block;
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const Logo = styled.div<{ $isWhite: boolean }>`
  font-size: 1.0625rem;
  font-weight: bold;
  white-space: nowrap;
  color: ${(props) => (props.$isWhite ? "#ffffff" : "#111827")};
  cursor: pointer;

  /* 아주 좁은 화면(<=360px)에서 네비가 넘치면 텍스트 숨기고 로고만 */
  @media (max-width: 360px) {
    display: none;
  }

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

/* 항상 노출되는 인라인 네비 — 모바일에서도 한 줄 유지(메뉴 4개). */
const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  flex-shrink: 0;
  gap: 0.55rem;

  @media (min-width: 768px) {
    gap: 1rem 1.25rem;
  }
`;

const NavLink = styled(Link)<{ $isWhite: boolean; $active?: boolean }>`
  color: ${(props) => (props.$isWhite ? "#ffffff" : "#111827")};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: bold;
  white-space: nowrap;
  transition: color 0.2s;

  ${(props) =>
    props.$active &&
    css`
      box-shadow: 0 2px 0 0 #8fd8c7;
      padding-bottom: 4px;
    `}

  &:hover {
    color: ${(props) => (props.$isWhite ? "#ffffff" : "#111827")};
    opacity: ${(props) => (props.$isWhite ? 0.8 : 0.6)};
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const SbmbNavLink = styled(Link)<{ $isWhite: boolean; $active: boolean }>`
  color: ${(props) => (props.$isWhite ? "#ffffff" : "#111827")};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: ${(props) => (props.$active ? 700 : 600)};
  white-space: nowrap;
  transition: color 0.2s;

  ${(props) =>
    props.$active &&
    css`
      box-shadow: 0 2px 0 0 #8fd8c7;
      padding-bottom: 4px;
    `}

  &:hover {
    opacity: ${(props) => (props.$isWhite ? 0.85 : 0.7)};
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export default function Header() {
  const pathname = usePathname();
  const isTransparentHeader =
    pathname === "/" || pathname === "/otc" || pathname === "/sbmb";
  const isWhiteText = isTransparentHeader;
  const isAbsolute = isTransparentHeader;

  return (
    <HeaderContainer
      $hasBackground={isTransparentHeader}
      $isAbsolute={isAbsolute}
    >
      <HeaderContent>
        <LogoLink href="/" aria-label="메인으로 이동">
          <LogoRow>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <LogoMark
              src={
                isWhiteText
                  ? "/logo_choonsimcom_white.png"
                  : "/logo_choonsimcom.png"
              }
              alt=""
              aria-hidden="true"
            />
            <Logo $isWhite={isWhiteText}>Choonsim Hub</Logo>
          </LogoRow>
        </LogoLink>
        <Nav>
          <NavLink href="/" $isWhite={isWhiteText} $active={pathname === "/"}>
            메인
          </NavLink>
          <NavLink
            href="/otc"
            $isWhite={isWhiteText}
            $active={pathname === "/otc"}
          >
            OTC
          </NavLink>
          <SbmbNavLink
            href="/sbmb"
            $isWhite={isWhiteText}
            $active={pathname === "/sbmb"}
          >
            SBMB
          </SbmbNavLink>
          <NavLink
            href={`/#${ECOSYSTEM_SECTION_ANCHOR_ID}`}
            $isWhite={isWhiteText}
            scroll
          >
            커뮤니티
          </NavLink>
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
}
