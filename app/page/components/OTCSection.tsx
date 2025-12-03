"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as S from "../styles";

interface OTCSectionProps {
  showTradeButton?: boolean;
}

export default function OTCSection({
  showTradeButton = true,
}: OTCSectionProps) {
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

  // 2모의 기적 가격 계산 (현재가 * 2.05, 만원 단위 올림)
  const miraclePrice = priceData.lbankKrwPrice
    ? Math.ceil((priceData.lbankKrwPrice * 2.05) / 10000) * 10000
    : null;

  return (
    <S.OTCHeroSection>
      <S.OTCHeroContent>
        <S.OTCHeroTitle>춘심 오프라인 OTC – 안전한 BMB 거래</S.OTCHeroTitle>
        <S.OTCHeroDescription>
          회관을 통한 오프라인 OTC 서비스를 통해 안전하고 쉽게 비트모빅 거래를
          경험하세요.
        </S.OTCHeroDescription>

        <S.OTCHeroPriceGrid>
          <S.OTCHeroPriceCard>
            <S.OTCHeroPriceLabel>BMB/USDT</S.OTCHeroPriceLabel>
            <S.OTCHeroPriceValue>
              {priceData.bmbUsdtPrice ? priceData.bmbUsdtPrice.toFixed(3) : "—"}
              <S.OTCHeroSubLabel>USDT</S.OTCHeroSubLabel>
            </S.OTCHeroPriceValue>
          </S.OTCHeroPriceCard>

          <S.OTCHeroPriceCard>
            <S.OTCHeroPriceLabel>USDT/KRW</S.OTCHeroPriceLabel>
            <S.OTCHeroPriceValue>
              {priceData.usdtKrwPrice
                ? priceData.usdtKrwPrice.toLocaleString()
                : "—"}
              <S.OTCHeroSubLabel>원</S.OTCHeroSubLabel>
            </S.OTCHeroPriceValue>
          </S.OTCHeroPriceCard>

          <S.OTCHeroPriceCard $highlight>
            <S.OTCHeroPriceLabel>BMB/KRW (LBANK)</S.OTCHeroPriceLabel>
            <S.OTCHeroPriceValue>
              {priceData.lbankKrwPrice
                ? Math.round(priceData.lbankKrwPrice).toLocaleString()
                : "—"}
              <S.OTCHeroSubLabel>원</S.OTCHeroSubLabel>
            </S.OTCHeroPriceValue>
          </S.OTCHeroPriceCard>
        </S.OTCHeroPriceGrid>

        <S.OTCHeroMiracleCardWrapper>
          <S.OTCHeroMiracleCard>
            <S.OTCHeroMiracleLabelWrapper>
              <S.OTCHeroPriceLabel>2모의 기적 참여</S.OTCHeroPriceLabel>
              <S.OTCHeroMiracleSubLabel>
                (2.05모 바로 구매)
              </S.OTCHeroMiracleSubLabel>
            </S.OTCHeroMiracleLabelWrapper>
            <S.OTCHeroPriceValue>
              {miraclePrice ? miraclePrice.toLocaleString() : "—"}
              <S.OTCHeroSubLabel>원</S.OTCHeroSubLabel>
            </S.OTCHeroPriceValue>
          </S.OTCHeroMiracleCard>
          <S.OTCHeroMiracleNote>
            * 참여 방법 : 서초회관 춘심팀 오프라인 참여 가능
          </S.OTCHeroMiracleNote>
        </S.OTCHeroMiracleCardWrapper>

        {showTradeButton && (
          <S.OTCHeroButtonContainer>
            <S.OTCHeroButton href="/otc">
              OTC 거래 페이지로 이동
            </S.OTCHeroButton>
          </S.OTCHeroButtonContainer>
        )}
      </S.OTCHeroContent>
    </S.OTCHeroSection>
  );
}
