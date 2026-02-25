"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import PageLayout from "@/components/layouts/PageLayout";

const PageContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (min-width: 768px) {
    padding: 3rem 2rem;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const TitleCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
  text-align: center;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const PageDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const PriceCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
  border: 2px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const PriceLabel = styled.div`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 1rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const CurrentPriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const CurrentPriceLabel = styled.div`
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
`;

const CurrentPriceValue = styled.div`
  font-size: 1.25rem;
  color: #111827;
  font-weight: 600;
`;

const MarketPriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #eff6ff;
  border-radius: 12px;
  border: 2px solid #3b82f6;
`;

const MarketPriceLabel = styled.div`
  font-size: 1.125rem;
  color: #1e40af;
  font-weight: 600;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const MarketPriceValue = styled.div`
  font-size: 2rem;
  color: #1e40af;
  font-weight: 700;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: #ef4444;
  font-size: 1rem;
`;

export default function MarketBuyPage() {
  const [priceData, setPriceData] = useState<{
    lbankKrwPrice: number | null;
  }>({
    lbankKrwPrice: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/market-prices");
        const data = await response.json();

        if (data.error) {
          setError("가격 정보를 불러올 수 없습니다.");
          return;
        }

        setPriceData({
          lbankKrwPrice: data.lbankKrwPrice,
        });
      } catch (error) {
        console.error("Error fetching prices:", error);
        setError("가격 정보를 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentPrice = priceData.lbankKrwPrice
    ? Math.round(priceData.lbankKrwPrice)
    : null;
  const buyPrice = priceData.lbankKrwPrice
    ? Math.round(priceData.lbankKrwPrice * 1.03)
    : null;

  return (
    <PageLayout>
      <PageContainer>
        <MainContent>
          <TitleCard>
            <PageTitle>시장가 구매</PageTitle>
            <PageDescription>
              LBANK 현재가 기준 +3% 가격으로 구매 신청할 수 있습니다.
            </PageDescription>
          </TitleCard>

          <PriceCard>
            {isLoading && <LoadingMessage>가격 정보를 불러오는 중...</LoadingMessage>}
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {!isLoading && !error && currentPrice !== null && buyPrice !== null && (
              <>
                <PriceLabel>가격 정보</PriceLabel>
                <CurrentPriceRow>
                  <CurrentPriceLabel>LBANK 현재가</CurrentPriceLabel>
                  <CurrentPriceValue>
                    {currentPrice.toLocaleString()}원
                  </CurrentPriceValue>
                </CurrentPriceRow>
                <MarketPriceRow>
                  <MarketPriceLabel>시장가 구매 가격</MarketPriceLabel>
                  <MarketPriceValue>{buyPrice.toLocaleString()}원</MarketPriceValue>
                </MarketPriceRow>
              </>
            )}
          </PriceCard>
        </MainContent>
      </PageContainer>
    </PageLayout>
  );
}

