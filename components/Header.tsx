"use client";

import styled from "styled-components";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  gap: 1rem;
  align-items: center;

  @media (min-width: 768px) {
    gap: 2rem;
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

export default function Header() {
  const pathname = usePathname();
  // 메인 페이지와 /otc 페이지는 투명 배경 + 흰색 폰트 + absolute 위치
  const isTransparentHeader = pathname === "/" || pathname === "/otc";
  const isWhiteText = isTransparentHeader;
  const isAbsolute = isTransparentHeader; // 메인과 /otc만 absolute

  return (
    <HeaderContainer
      $hasBackground={isTransparentHeader}
      $isAbsolute={isAbsolute}
    >
      <HeaderContent>
        <LogoLink href="/">
          <Logo $isWhite={isWhiteText}>Choonsim</Logo>
        </LogoLink>
        <Nav>
          <NavLink href="/" $isWhite={isWhiteText}>
            메인
          </NavLink>
          <NavLink href="/otc" $isWhite={isWhiteText}>
            OTC
          </NavLink>
          <NavLink href="/hwallets" $isWhite={isWhiteText}>
            고액권|SBMB
          </NavLink>
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
}
