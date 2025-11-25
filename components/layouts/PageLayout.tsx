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
  width: 100%;
  padding: 0;

  @media (min-width: 768px) {
    padding: 0;
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
