"use client";

import styled from "styled-components";
import Link from "next/link";

const HeaderContainer = styled.header`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  padding: 1rem 1.5rem;
  background-color: transparent;
  border: none;
  box-shadow: none;
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
  text-decoration: none; /* 밑줄 제거 */
`;

const Logo = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: #ffffff; /* white로 변경 */
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

const NavLink = styled(Link)`
  color: #ffffff; /* white로 변경 */
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: bold; /* bold 추가 */
  transition: color 0.2s;

  &:hover {
    color: #ffffff; /* hover 시에도 white 유지 */
    opacity: 0.8; /* hover 효과를 위해 opacity 사용 */
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export default function Header() {
  return (
    <HeaderContainer>
      <HeaderContent>
        <LogoLink href="/">
          <Logo>Choonsim</Logo>
        </LogoLink>
        <Nav>
          <NavLink href="/">메인</NavLink>
          <NavLink href="/otc">OTC</NavLink>
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
}
