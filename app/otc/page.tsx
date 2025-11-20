"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { STATUS_LABELS } from "@/lib/constants";

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

// 호가 아이템 스타일 추가
const OrderBookList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OrderBookItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }

  @media (min-width: 768px) {
    padding: 1.25rem 1.5rem;
  }
`;

const OrderBookItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const OrderBookItemPrice = styled.div`
  font-size: 1.25rem;
  font-weight: bold;
  color: #3b82f6;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const OrderBookItemDetails = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;

  @media (min-width: 768px) {
    font-size: 1rem;
    gap: 1.5rem;
  }
`;

const OrderBookItemDetail = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

interface SellerRequest {
  id: number;
  name: string;
  phone: string;
  amount: number;
  price: string; // Decimal은 string으로 반환됨
  allowPartial: boolean;
  branch: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function OTCPage() {
  const [activeTab, setActiveTab] = useState<"orderbook" | "card">("orderbook");

  // 호가창 데이터
  const [listedRequests, setListedRequests] = useState<SellerRequest[]>([]);
  const [listedLoading, setListedLoading] = useState(true);
  const [listedError, setListedError] = useState<string | null>(null);

  // 카드형 데이터
  const [cardRequests, setCardRequests] = useState<SellerRequest[]>([]);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);

  // 동일 가격대 물량 합산 함수 (간소화 - 회관 정보 제거)
  const aggregateRequestsByPrice = (requests: SellerRequest[]) => {
    const priceMap = new Map<
      number,
      {
        price: string;
        totalAmount: number;
        ids: number[];
      }
    >();

    requests.forEach((request) => {
      const priceNum = parseFloat(request.price);

      if (priceMap.has(priceNum)) {
        const existing = priceMap.get(priceNum)!;
        existing.totalAmount += request.amount;
        existing.ids.push(request.id);
      } else {
        priceMap.set(priceNum, {
          price: request.price,
          totalAmount: request.amount,
          ids: [request.id],
        });
      }
    });

    // Map을 배열로 변환하고 가격순 정렬
    return Array.from(priceMap.entries())
      .map(([price, data]) => ({
        price: data.price,
        priceNum: price,
        totalAmount: data.totalAmount,
        ids: data.ids,
        count: data.ids.length, // 해당 가격대의 신청 건수
      }))
      .sort((a, b) => a.priceNum - b.priceNum);
  };

  // 호가창 데이터 불러오기
  useEffect(() => {
    const fetchListedRequests = async () => {
      try {
        setListedLoading(true);
        setListedError(null);

        const response = await fetch("/api/otc/listed-requests");

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "호가 정보를 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        setListedRequests(data);
      } catch (err) {
        console.error("Error fetching listed requests:", err);
        setListedError(
          err instanceof Error
            ? err.message
            : "호가 정보를 불러오는데 실패했습니다."
        );
      } finally {
        setListedLoading(false);
      }
    };

    if (activeTab === "orderbook") {
      fetchListedRequests();
    }
  }, [activeTab]);

  // 카드형 데이터 불러오기
  useEffect(() => {
    const fetchCardRequests = async () => {
      try {
        setCardLoading(true);
        setCardError(null);

        const response = await fetch("/api/otc/card-requests");

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error || "카드형 정보를 불러오는데 실패했습니다."
          );
        }

        const data = await response.json();
        setCardRequests(data);
      } catch (err) {
        console.error("Error fetching card requests:", err);
        setCardError(
          err instanceof Error
            ? err.message
            : "카드형 정보를 불러오는데 실패했습니다."
        );
      } finally {
        setCardLoading(false);
      }
    };

    if (activeTab === "card") {
      fetchCardRequests();
    }
  }, [activeTab]);

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString("ko-KR");
  };

  const formatTotalPrice = (price: string, amount: number) => {
    return (parseFloat(price) * amount).toLocaleString("ko-KR");
  };

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
                  {listedLoading && (
                    <OrderBookPlaceholder>
                      호가 정보를 불러오는 중...
                    </OrderBookPlaceholder>
                  )}
                  {listedError && (
                    <OrderBookPlaceholder style={{ color: "#dc2626" }}>
                      {listedError}
                    </OrderBookPlaceholder>
                  )}
                  {!listedLoading && !listedError && (
                    <>
                      {listedRequests.length > 0 ? (
                        <OrderBookList>
                          {aggregateRequestsByPrice(listedRequests).map(
                            (aggregated, index) => (
                              <OrderBookItem
                                key={`${aggregated.priceNum}-${index}`}
                              >
                                <OrderBookItemInfo>
                                  <OrderBookItemPrice>
                                    {formatPrice(aggregated.price)}원
                                  </OrderBookItemPrice>
                                  <OrderBookItemDetails>
                                    <OrderBookItemDetail>
                                      총 물량:{" "}
                                      <strong>
                                        {aggregated.totalAmount} Mo
                                      </strong>
                                      {aggregated.count > 1 && (
                                        <span
                                          style={{
                                            fontSize: "0.75rem",
                                            color: "#6b7280",
                                            marginLeft: "0.5rem",
                                          }}
                                        >
                                          ({aggregated.count}건 합산)
                                        </span>
                                      )}
                                    </OrderBookItemDetail>
                                  </OrderBookItemDetails>
                                </OrderBookItemInfo>
                              </OrderBookItem>
                            )
                          )}
                        </OrderBookList>
                      ) : (
                        <OrderBookPlaceholder>
                          등록된 호가가 없습니다.
                        </OrderBookPlaceholder>
                      )}
                    </>
                  )}
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
                {cardLoading && (
                  <EmptyState>카드형 정보를 불러오는 중...</EmptyState>
                )}
                {cardError && (
                  <EmptyState style={{ color: "#dc2626" }}>
                    {cardError}
                  </EmptyState>
                )}
                {!cardLoading && !cardError && (
                  <>
                    {cardRequests.length > 0 ? (
                      <CardGrid>
                        {cardRequests.map((card) => {
                          const priceNum = parseFloat(card.price);
                          const amountNum = card.amount;

                          return (
                            <Card
                              key={card.id}
                              href={`/otc/buy/apply?mode=card&price=${priceNum}&amount=${amountNum}`}
                            >
                              <CardHeader>
                                <CardPrice>
                                  {formatPrice(card.price)}원
                                </CardPrice>
                                <CardAmount>{card.amount} Mo</CardAmount>
                              </CardHeader>
                              <CardInfo>
                                <CardInfoRow>
                                  <CardLabel>총 금액</CardLabel>
                                  <CardValue>
                                    {formatTotalPrice(card.price, card.amount)}
                                    원
                                  </CardValue>
                                </CardInfoRow>
                                <CardInfoRow>
                                  <CardLabel>회관</CardLabel>
                                  <CardValue>{card.branch}</CardValue>
                                </CardInfoRow>
                                <CardInfoRow>
                                  <CardLabel>상태</CardLabel>
                                  <CardValue>
                                    {STATUS_LABELS[
                                      card.status as keyof typeof STATUS_LABELS
                                    ] || card.status}
                                  </CardValue>
                                </CardInfoRow>
                              </CardInfo>
                            </Card>
                          );
                        })}
                      </CardGrid>
                    ) : (
                      <EmptyState>등록된 판매 정보가 없습니다.</EmptyState>
                    )}
                  </>
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
