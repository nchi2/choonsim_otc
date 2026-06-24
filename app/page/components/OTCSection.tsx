"use client";

import { useState, useEffect, type ReactNode } from "react";
import styled from "styled-components";
import * as S from "../styles";

const LBANK_BMB_USDT_URL = "https://www.lbank.com/trade/bmb_usdt";

const CompactOTCHeroSection = styled(S.OTCHeroSection)`
  min-height: 0;
  padding: 5rem 1rem 2.25rem;

  @media (max-width: 768px) {
    padding: 4.5rem 1rem 1.75rem;
  }
`;

// Plain wrapper — actionSlot은 히어로 콘텐츠 폭(시세 카드 그리드)과 동일.
const OtcActionArea = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
`;

const DEFAULT_TITLE = "Choonsim Hub";
const DEFAULT_SUBTITLE: ReactNode =
  "오프라인 OTC, SBMB, 모빅 생태계 소식을 한번에 확인하세요.";

interface OTCSectionProps {
  showTradeButton?: boolean;
  showPriceCards?: boolean;
  title?: string;
  subtitle?: ReactNode;
  actionSlot?: ReactNode;
  compact?: boolean;
}

export default function OTCSection({
  showTradeButton = true,
  showPriceCards = true,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  actionSlot,
  compact = false,
}: OTCSectionProps) {
  const HeroWrapper = compact ? CompactOTCHeroSection : S.OTCHeroSection;
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
    if (!showPriceCards) {
      setIsLoading(false);
      return;
    }

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
  }, [showPriceCards]);

  /* 2모의 기적 — 이벤트 종료로 비활성화 (복구 시 아래 주석 해제)
  const miraclePrice = priceData.lbankKrwPrice
    ? Math.ceil((priceData.lbankKrwPrice * 2.05 * 1.015) / 10000) * 10000
    : null;
  */

  return (
    <HeroWrapper>
      <S.OTCHeroContent>
        <S.OTCHeroTitle>{title}</S.OTCHeroTitle>

        <S.OTCHeroDescription>{subtitle}</S.OTCHeroDescription>

        {showPriceCards && (
          <>
            <S.OTCHeroPriceGrid>
              <S.OTCHeroPriceCard>
                <S.OTCHeroPriceLabel>BMB/USDT</S.OTCHeroPriceLabel>
                <S.OTCHeroPriceValue>
                  {priceData.bmbUsdtPrice != null
                    ? priceData.bmbUsdtPrice.toFixed(3)
                    : isLoading
                      ? "…"
                      : "—"}
                  <S.OTCHeroSubLabel>USDT</S.OTCHeroSubLabel>
                </S.OTCHeroPriceValue>
              </S.OTCHeroPriceCard>

              <S.OTCHeroPriceCard>
                <S.OTCHeroPriceLabel>USDT/KRW</S.OTCHeroPriceLabel>
                <S.OTCHeroPriceValue>
                  {priceData.usdtKrwPrice != null
                    ? priceData.usdtKrwPrice.toLocaleString()
                    : isLoading
                      ? "…"
                      : "—"}
                  <S.OTCHeroSubLabel>원</S.OTCHeroSubLabel>
                </S.OTCHeroPriceValue>
              </S.OTCHeroPriceCard>

              <S.OTCHeroPriceCard $highlight>
                <S.OTCHeroPriceLabel>BMB/KRW (LBANK)</S.OTCHeroPriceLabel>
                <S.OTCHeroPriceValue>
                  {priceData.lbankKrwPrice != null
                    ? Math.round(priceData.lbankKrwPrice).toLocaleString()
                    : isLoading
                      ? "…"
                      : "—"}
                  <S.OTCHeroSubLabel>원</S.OTCHeroSubLabel>
                </S.OTCHeroPriceValue>
              </S.OTCHeroPriceCard>
            </S.OTCHeroPriceGrid>

            {error ? <S.OTCHeroPriceError>{error}</S.OTCHeroPriceError> : null}

            <S.OTCHeroLbankLinkBelowPrices>
              <S.OTCHeroLbankLink
                href={LBANK_BMB_USDT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                LBANK에서 실시간 시세 확인 (BMB/USDT)
              </S.OTCHeroLbankLink>
            </S.OTCHeroLbankLinkBelowPrices>
          </>
        )}

        {actionSlot ? <OtcActionArea>{actionSlot}</OtcActionArea> : null}

        {/* 2모의 기적 — 종료된 이벤트
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
        */}

        {showTradeButton && (
          <S.OTCHeroButtonContainer>
            <S.OTCHeroBuyButton
              href="/otc?otcreq=buy"
              aria-label="BMB 구매 신청"
            >
              BMB 구매
            </S.OTCHeroBuyButton>
            <S.OTCHeroSellButton
              href="/otc?otcreq=sell"
              aria-label="BMB 판매 신청"
            >
              BMB 판매
            </S.OTCHeroSellButton>
            <S.OTCHeroMiraclePromoLink
              href="/otc?apply=1"
              aria-label="10모의 기적 All-in-One 신청"
            >
              10모의 기적 All-in-One 신청
            </S.OTCHeroMiraclePromoLink>
          </S.OTCHeroButtonContainer>
        )}
      </S.OTCHeroContent>
    </HeroWrapper>
  );
}
