"use client";

import { useState, useEffect } from "react";
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
    margin: 2rem;
    padding: 4rem 2rem;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 3rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 4rem;
  }
`;

const OTCSection = styled.section`
  width: 100%;
  max-width: 800px;
  background-color: #f9fafb;
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
    margin-bottom: 3rem;
  }
`;

const OTCTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2.5rem;
  }
`;

const PriceInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-around;
    gap: 2rem;
  }
`;

const PriceCard = styled.div`
  flex: 1;
  padding: 1.5rem;
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const PriceLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const PriceValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const PriceSubValue = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 2rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 3rem;
  }
`;

const ErrorText = styled.div`
  text-align: center;
  color: #ef4444;
  font-size: 0.875rem;
  padding: 2rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 3rem;
  }
`;

const OTCButton = styled(Link)`
  display: block;
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1.25rem 2.5rem;
  }
`;

export default function Home() {
  const [priceData, setPriceData] = useState<{
    usdtKrwPrice: number | null;
    bmbUsdtPrice: number | null;
    lbankKrwPrice: number | null;
  }>({
    usdtKrwPrice: null,
    bmbUsdtPrice: null,
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
          usdtKrwPrice: data.usdtKrwPrice,
          bmbUsdtPrice: data.bmbUsdtPrice,
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
    // 30초마다 업데이트
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageContainer>
      <Header />
      <MainContent>
        <Title>Choonsim 메인</Title>

        <OTCSection>
          <OTCTitle>모빅 거래 정보</OTCTitle>

          {isLoading && <LoadingText>가격 정보를 불러오는 중...</LoadingText>}

          {error && <ErrorText>{error}</ErrorText>}

          {!isLoading && !error && priceData.lbankKrwPrice !== null && (
            <>
              <PriceInfoContainer>
                <PriceCard>
                  <PriceLabel>USDT/KRW</PriceLabel>
                  <PriceValue>
                    {priceData.usdtKrwPrice
                      ? priceData.usdtKrwPrice.toLocaleString()
                      : "N/A"}
                  </PriceValue>
                  <PriceSubValue>원</PriceSubValue>
                </PriceCard>

                <PriceCard>
                  <PriceLabel>BMB/USDT</PriceLabel>
                  <PriceValue>
                    {priceData.bmbUsdtPrice
                      ? priceData.bmbUsdtPrice.toFixed(4)
                      : "N/A"}
                  </PriceValue>
                  <PriceSubValue>USDT</PriceSubValue>
                </PriceCard>

                <PriceCard>
                  <PriceLabel>BMB/KRW (LBANK)</PriceLabel>
                  <PriceValue>
                    {priceData.lbankKrwPrice
                      ? Math.round(priceData.lbankKrwPrice).toLocaleString()
                      : "N/A"}
                  </PriceValue>
                  <PriceSubValue>원</PriceSubValue>
                </PriceCard>
              </PriceInfoContainer>

              <OTCButton href="/otc">OTC 거래하기</OTCButton>
            </>
          )}
        </OTCSection>
      </MainContent>
      <Footer />
    </PageContainer>
  );
}
