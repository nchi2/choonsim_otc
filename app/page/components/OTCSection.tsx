"use client";

import { useState, useEffect } from "react";
import * as S from "../styles";

export default function OTCSection() {
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
    <S.OTCSection>
      <S.OTCTitle>모빅 거래 정보</S.OTCTitle>

      {isLoading && <S.LoadingText>가격 정보를 불러오는 중...</S.LoadingText>}

      {error && <S.ErrorText>{error}</S.ErrorText>}

      {!isLoading && !error && priceData.lbankKrwPrice !== null && (
        <>
          <S.PriceInfoContainer>
            <S.PriceCard>
              <S.PriceLabel>USDT/KRW</S.PriceLabel>
              <S.PriceValue>
                {priceData.usdtKrwPrice
                  ? priceData.usdtKrwPrice.toLocaleString()
                  : "N/A"}
              </S.PriceValue>
              <S.PriceSubValue>원</S.PriceSubValue>
            </S.PriceCard>

            <S.PriceCard>
              <S.PriceLabel>BMB/USDT</S.PriceLabel>
              <S.PriceValue>
                {priceData.bmbUsdtPrice
                  ? priceData.bmbUsdtPrice.toFixed(1)
                  : "N/A"}
              </S.PriceValue>
              <S.PriceSubValue>USDT</S.PriceSubValue>
            </S.PriceCard>

            <S.PriceCard>
              <S.PriceLabel>BMB/KRW (LBANK)</S.PriceLabel>
              <S.PriceValue>
                {priceData.lbankKrwPrice
                  ? Math.round(priceData.lbankKrwPrice).toLocaleString()
                  : "N/A"}
              </S.PriceValue>
              <S.PriceSubValue>원</S.PriceSubValue>
            </S.PriceCard>
          </S.PriceInfoContainer>

          <S.OTCButton href="/otc">OTC 거래하기</S.OTCButton>
        </>
      )}
    </S.OTCSection>
  );
}
