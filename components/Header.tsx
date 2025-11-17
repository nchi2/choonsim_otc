"use client";

import styled from "styled-components";
import Link from "next/link";

const HeaderContainer = styled.header`
  width: 100%;
  background-color: #ffffff;
  border-bottom: 2px solid #e5e7eb;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (min-width: 768px) {
    padding: 1rem 2rem;
  }
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
`;

const Logo = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: #111827;
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
  color: #374151;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;

  &:hover {
    color: #111827;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export default function Header() {
  return (
    <HeaderContainer>
      <HeaderContent>
        <Link href="/">
          <Logo>Choonsim</Logo>
        </Link>
        <Nav>
          <NavLink href="/">메인</NavLink>
          <NavLink href="/otc">OTC</NavLink>
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
}
