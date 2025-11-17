"use client";

import styled from "styled-components";
import Link from "next/link";
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
    padding: 4rem 2rem;
    margin: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 3rem;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  background-color: #f9fafb;
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    max-width: 500px;
    padding: 2rem;
  }
`;

const Button = styled.button`
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1.25rem 2.5rem;
    width: auto;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const BuyButton = styled(Button)`
  background-color: #3b82f6;
  color: white;

  &:hover {
    background-color: #2563eb;
  }
`;

const SellButtonLink = styled(Link)`
  width: 100%;
  text-decoration: none;
  display: block;

  @media (min-width: 768px) {
    width: auto;
  }
`;

const SellButton = styled(Button)`
  background-color: #10b981;
  color: white;
  width: 100%;
  display: block;

  &:hover {
    background-color: #059669;
  }

  @media (min-width: 768px) {
    width: auto;
  }
`;

export default function OTCPage() {
  const handleBuyClick = () => {
    alert("구매 기능은 준비 중입니다.");
  };

  return (
    <PageContainer>
      <Header />
      <MainContent>
        <Title>OTC 메인</Title>
        <ContentWrapper>
          <ButtonContainer>
            <BuyButton onClick={handleBuyClick}>구매하기</BuyButton>
            <SellButtonLink href="/otc/sell/apply">
              <SellButton>판매하기</SellButton>
            </SellButtonLink>
          </ButtonContainer>
        </ContentWrapper>
      </MainContent>
      <Footer />
    </PageContainer>
  );
}
