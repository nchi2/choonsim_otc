"use client";

import styled from "styled-components";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem 1rem;
  background-color: #ffffff;
  margin: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    margin: 2rem;
    padding: 4rem 2rem;
  }
`;

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <PageContainer>
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </PageContainer>
  );
}
