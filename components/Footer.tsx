"use client";

import styled from "styled-components";

const FooterContainer = styled.footer`
  width: 100%;
  background-color: #e5e7eb;
  border-top: 2px solid #d1d5db;
  padding: 1rem;
  margin-top: auto;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  background-color: #e5e7eb;
`;

const Copyright = styled.p`
  color: #4b5563;
  font-size: 0.75rem;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <FooterContent>
        <Copyright>© {currentYear} Choonsim. All rights reserved.</Copyright>
      </FooterContent>
    </FooterContainer>
  );
}
