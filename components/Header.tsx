"use client";

import styled, { css } from "styled-components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMMUNITY_SECTION_ANCHOR_ID } from "@/lib/community-linktree";

const HeaderContainer = styled.header<{
  $hasBackground: boolean;
  $isAbsolute: boolean;
}>`
  position: ${(props) => (props.$isAbsolute ? "absolute" : "relative")};
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  padding: 1rem 1.5rem;
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
  background-color: transparent;
`;

const LogoLink = styled(Link)`
  text-decoration: none;
`;

const Logo = styled.div<{ $isWhite: boolean }>`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${(props) => (props.$isWhite ? "#ffffff" : "#111827")};
  cursor: pointer;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  align-items: center;
  justify-content: flex-end;
  max-width: calc(100% - 7rem);

  @media (min-width: 768px) {
    gap: 1rem 1.25rem;
    max-width: none;
  }
`;

const NavLink = styled(Link)<{ $isWhite: boolean }>`
  color: ${(props) => (props.$isWhite ? "#ffffff" : "#111827")};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: bold;
  transition: color 0.2s;

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
        <LogoLink href="/">
          <Logo $isWhite={isWhiteText}>Choonsim Hub</Logo>
        </LogoLink>
        <Nav>
          <NavLink href="/" $isWhite={isWhiteText}>
            메인
          </NavLink>
          <NavLink href="/otc" $isWhite={isWhiteText}>
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
            href={`/#${COMMUNITY_SECTION_ANCHOR_ID}`}
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
