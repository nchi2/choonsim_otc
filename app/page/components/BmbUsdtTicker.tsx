"use client";

import styled from "styled-components";

const BMB_LOGO_SRC = "/logo/Logo_BMB.png";

const PRICE_DECIMALS: Record<string, number> = {
  BMB: 3,
  BTC: 2,
  ETH: 2,
  XRP: 4,
  BNB: 2,
  SOL: 2,
  TRX: 4,
  DOGE: 5,
  USDC: 4,
};

const CHANGE_DECIMALS: Record<string, number> = {
  USDC: 4,
};

const STABLE_NEUTRAL_SYMBOLS: ReadonlySet<string> = new Set(["USDC"]);
const STABLE_NEUTRAL_THRESHOLD = 0.05;

/** 심볼별 소수 자리로 가격 포맷(시세 보드 공통). */
export function formatPrice(symbol: string, price: number): string {
  const decimals = PRICE_DECIMALS[symbol] ?? 4;
  return price.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 24h 변동% 포맷(부호 포함). */
export function formatChange(symbol: string, pct: number): string {
  const sign = pct > 0 ? "+" : "";
  const decimals = CHANGE_DECIMALS[symbol] ?? 2;
  return `${sign}${pct.toFixed(decimals)}%`;
}

/** 변동 색: 상승 초록 / 하락 빨강 / 스테이블 미세변동 회색. */
export function changeColor(symbol: string, pct: number): string {
  if (
    STABLE_NEUTRAL_SYMBOLS.has(symbol) &&
    Math.abs(pct) < STABLE_NEUTRAL_THRESHOLD
  ) {
    return "#374151";
  }
  if (pct > 0) return "#10b981";
  if (pct < 0) return "#dc2626";
  return "#374151";
}

const BmbUsdtRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  @media (min-width: 768px) {
    flex-direction: row;
    gap: 12px;
  }
`;

const BmbCell = styled.div`
  flex: 2;
  min-width: 0;
  background: linear-gradient(135deg, #f3f0ff 0%, #ede9fe 100%);
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 14px;

  @media (min-width: 768px) {
    padding: 12px 18px;
    flex-wrap: nowrap;
    gap: 14px;
  }
`;

const UsdtCell = styled.div`
  flex: 1;
  min-width: 0;
  background: #fafaff;
  border: 1px solid #f0eef9;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;

  @media (min-width: 768px) {
    padding: 12px 14px;
    gap: 12px;
  }
`;

const UsdtLogoFrame = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex: 0 0 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #26a17b;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    font-size: 20px;
  }
`;

const UsdtIdentity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
`;

const UsdtSymbolText = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
  color: #1f2937;
  letter-spacing: -0.01em;
  line-height: 1.15;
`;

const UsdtSubLabel = styled.span`
  font-size: 0.7rem;
  color: #9ca3af;
  line-height: 1.15;
`;

const UsdtValueGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 0;
`;

const UsdtKrwLabel = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: -0.01em;
  line-height: 1.15;
`;

const UsdtKrwValue = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
`;

const BmbLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  @media (min-width: 768px) {
    gap: 14px;
  }
`;

const BmbLogoFrame = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex: 0 0 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  border: 1px solid rgba(99, 102, 241, 0.18);

  > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
    display: block;
  }

  @media (min-width: 768px) {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
  }
`;

const BmbIdentity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const BmbSymbolText = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
  color: #312e81;
  letter-spacing: -0.01em;
  line-height: 1.15;
`;

const BmbSubLabel = styled.span`
  font-size: 0.7rem;
  color: #6366f1;
  line-height: 1.15;
`;

const BmbPriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  min-width: 0;
`;

const BmbPrice = styled.span`
  font-size: 1rem;
  font-weight: 800;
  color: #1e1b4b;
  font-variant-numeric: tabular-nums;
  word-break: keep-all;
  line-height: 1.15;

  @media (min-width: 768px) {
    font-size: 1.05rem;
  }
`;

const BmbChange = styled.span<{ $color: string }>`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${(p) => p.$color};
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
`;

const BmbRight = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;

  @media (min-width: 768px) {
    flex-wrap: nowrap;
    gap: 18px;
  }
`;

const KrwItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 0;
`;

const KrwLabel = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  color: #6366f1;
  letter-spacing: -0.01em;
  line-height: 1.15;
`;

const KrwValue = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e1b4b;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
`;

function BmbLogo() {
  return (
    <BmbLogoFrame aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BMB_LOGO_SRC} alt="" loading="lazy" decoding="async" />
    </BmbLogoFrame>
  );
}

export interface BmbUsdtTickerProps {
  /** BMB 현재가(USDT). */
  usdtPrice: number;
  /** BMB 24h 변동%. null이면 변동 표시 숨김. */
  change?: number | null;
  /** BMB 원화 환산가(원). null이면 숨김. */
  krw?: number | null;
  /** USDT/KRW 환율(원). null이면 USDT 카드 숨김. */
  usdtKrw?: number | null;
  className?: string;
}

/**
 * 시세 보드의 BMB 카드 + USDT 카드(순수 표시). 데이터 페치 없음 — 호출부가 값 주입.
 * /otc(MajorPriceBoard)와 어드민 계산기에서 동일 스타일로 재사용.
 */
export default function BmbUsdtTicker({
  usdtPrice,
  change = null,
  krw = null,
  usdtKrw = null,
  className,
}: BmbUsdtTickerProps) {
  return (
    <BmbUsdtRow className={className}>
      <BmbCell>
        <BmbLeft>
          <BmbLogo />
          <BmbIdentity>
            <BmbSymbolText>BMB</BmbSymbolText>
            <BmbSubLabel>Mobick · LBANK</BmbSubLabel>
          </BmbIdentity>
          <BmbPriceBlock>
            <BmbPrice>${formatPrice("BMB", usdtPrice)}</BmbPrice>
            {change != null && (
              <BmbChange $color={changeColor("BMB", change)}>
                {formatChange("BMB", change)}
              </BmbChange>
            )}
          </BmbPriceBlock>
        </BmbLeft>

        {krw != null && (
          <BmbRight>
            <KrwItem>
              <KrwLabel>BMB / KRW</KrwLabel>
              <KrwValue>{Math.round(krw).toLocaleString()}원</KrwValue>
            </KrwItem>
          </BmbRight>
        )}
      </BmbCell>

      {usdtKrw != null && (
        <UsdtCell>
          <UsdtLogoFrame aria-hidden="true">₮</UsdtLogoFrame>
          <UsdtIdentity>
            <UsdtSymbolText>USDT</UsdtSymbolText>
            <UsdtSubLabel>Tether</UsdtSubLabel>
          </UsdtIdentity>
          <UsdtValueGroup>
            <UsdtKrwLabel>USDT / KRW</UsdtKrwLabel>
            <UsdtKrwValue>{Math.round(usdtKrw).toLocaleString()}원</UsdtKrwValue>
          </UsdtValueGroup>
        </UsdtCell>
      )}
    </BmbUsdtRow>
  );
}
