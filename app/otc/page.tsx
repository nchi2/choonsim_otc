"use client";

import { useState } from "react";
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

const TabContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    gap: 1rem;
    margin-bottom: 3rem;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => (props.$active ? "#3b82f6" : "#6b7280")};
  background-color: transparent;
  border: none;
  border-bottom: 3px solid
    ${(props) => (props.$active ? "#3b82f6" : "transparent")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #3b82f6;
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1rem 2rem;
  }
`;

const TabContent = styled.div`
  width: 100%;
`;

const OrderBookSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    margin-bottom: 3rem;
  }
`;

const OrderBookTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const OrderBookPlaceholder = styled.div`
  padding: 3rem 2rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
    font-size: 1rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    max-width: 100%;
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

const SellButton = styled(Button)`
  background-color: #10b981;
  color: white;

  &:hover {
    background-color: #059669;
  }
`;

const BuyButtonLink = styled(Link)`
  width: 100%;
  text-decoration: none;
  display: block;

  @media (min-width: 768px) {
    width: auto;
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

const CardGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const CardPrice = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;

  @media (min-width: 768px) {
    font-size: 1.75rem;
  }
`;

const CardAmount = styled.div`
  font-size: 0.875rem;
  color: #6b7280;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const CardInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #374151;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const CardLabel = styled.span`
  color: #6b7280;
`;

const CardValue = styled.span`
  font-weight: 600;
  color: #111827;
`;

const EmptyState = styled.div`
  padding: 3rem 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
    font-size: 1rem;
  }
`;

// 더미 카드 데이터 (가격순 정렬)
const dummyCards = [
  {
    id: 1,
    price: 850000,
    amount: 5.2,
    branch: "서울 서초",
    allowPartial: false,
  },
  {
    id: 2,
    price: 900000,
    amount: 3.2,
    branch: "광주",
    allowPartial: false,
  },
  {
    id: 3,
    price: 920000,
    amount: 10.5,
    branch: "부산",
    allowPartial: true,
  },
  {
    id: 4,
    price: 950000,
    amount: 7.8,
    branch: "대전",
    allowPartial: false,
  },
  {
    id: 5,
    price: 980000,
    amount: 2.1,
    branch: "서울 서초",
    allowPartial: true,
  },
  {
    id: 6,
    price: 1000000,
    amount: 15.0,
    branch: "광주",
    allowPartial: false,
  },
].sort((a, b) => a.price - b.price); // 가격순 정렬

export default function OTCPage() {
  const [activeTab, setActiveTab] = useState<"orderbook" | "card">("orderbook");

  return (
    <PageContainer>
      <Header />
      <MainContent>
        <Title>OTC 메인</Title>
        <ContentWrapper>
          <TabContainer>
            <TabButton
              $active={activeTab === "orderbook"}
              onClick={() => setActiveTab("orderbook")}
            >
              호가형(소액)
            </TabButton>
            <TabButton
              $active={activeTab === "card"}
              onClick={() => setActiveTab("card")}
            >
              카드형(일괄)
            </TabButton>
          </TabContainer>

          <TabContent>
            {activeTab === "orderbook" && (
              <>
                <OrderBookSection>
                  <OrderBookTitle>호가</OrderBookTitle>
                  <OrderBookPlaceholder>
                    호가 정보가 여기에 표시됩니다.
                  </OrderBookPlaceholder>
                </OrderBookSection>
                <ButtonContainer>
                  <BuyButtonLink href="/otc/buy/apply?mode=free">
                    <BuyButton>구매하기</BuyButton>
                  </BuyButtonLink>
                  <SellButtonLink href="/otc/sell/apply">
                    <SellButton>판매하기</SellButton>
                  </SellButtonLink>
                </ButtonContainer>
              </>
            )}

            {activeTab === "card" && (
              <>
                {dummyCards.length > 0 ? (
                  <CardGrid>
                    {dummyCards.map((card) => (
                      <Card
                        key={card.id}
                        href={`/otc/buy/apply?mode=card&price=${card.price}&amount=${card.amount}`}
                      >
                        <CardHeader>
                          <CardPrice>{card.price.toLocaleString()}원</CardPrice>
                          <CardAmount>{card.amount} Mo</CardAmount>
                        </CardHeader>
                        <CardInfo>
                          <CardInfoRow>
                            <CardLabel>수량</CardLabel>
                            <CardValue>{card.amount} Mo</CardValue>
                          </CardInfoRow>
                          <CardInfoRow>
                            <CardLabel>회관</CardLabel>
                            <CardValue>{card.branch}</CardValue>
                          </CardInfoRow>
                          <CardInfoRow>
                            <CardLabel>소량 구매</CardLabel>
                            <CardValue>
                              {card.allowPartial ? "가능" : "불가능"}
                            </CardValue>
                          </CardInfoRow>
                        </CardInfo>
                      </Card>
                    ))}
                  </CardGrid>
                ) : (
                  <EmptyState>등록된 판매 정보가 없습니다.</EmptyState>
                )}
              </>
            )}
          </TabContent>
        </ContentWrapper>
      </MainContent>
      <Footer />
    </PageContainer>
  );
}
