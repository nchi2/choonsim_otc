"use client";

// 시세 스트립 — 헤더 아래 얇은 띠. 기존 공개 API /api/market-prices 재사용(30초 폴링,
// 탭 숨김 중 중단). BMB/KRW(LBANK 원화 환산)·BMB/USDT·USDT/KRW + [OTC 거래하기 →] 상주 CTA.
// 모바일: USDT/KRW 축약(숨김).

import { useEffect, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { eduColors, media } from "./tokens";

interface Prices {
  bmbUsdtPrice: number | null;
  usdtKrwPrice: number | null;
  lbankKrwPrice: number | null;
}

const Strip = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.45rem 1rem;
  background: ${eduColors.text};
  color: ${eduColors.white};
  font-size: 0.78rem;
  overflow: hidden;
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1120px;
  margin: 0 auto;
  width: 100%;
`;

const Item = styled.span<{ $hideMobile?: boolean }>`
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.72);

  strong {
    color: ${eduColors.white};
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  ${(p) => (p.$hideMobile ? `${media.sm} { display: none; }` : "")}
`;

const OtcCta = styled(Link)`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  background: ${eduColors.primary};
  color: ${eduColors.white};
  font-weight: 700;
  font-size: 0.75rem;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: ${eduColors.primaryHover};
  }
`;

function fmtKrw(v: number | null): string {
  return v != null ? `${Math.round(v).toLocaleString("ko-KR")}원` : "—";
}

export function PriceTicker() {
  const [prices, setPrices] = useState<Prices>({
    bmbUsdtPrice: null,
    usdtKrwPrice: null,
    lbankKrwPrice: null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/market-prices");
        const data = await res.json();
        if (cancelled || data?.error) return;
        setPrices({
          bmbUsdtPrice: data.bmbUsdtPrice ?? null,
          usdtKrwPrice: data.usdtKrwPrice ?? null,
          lbankKrwPrice: data.lbankKrwPrice ?? null,
        });
      } catch {
        /* 시세 실패는 조용히 — 스트립은 placeholder 유지 */
      }
    };
    load();
    const t = setInterval(load, 30_000);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <Strip>
      <Inner>
        <Item>
          BMB <strong>{fmtKrw(prices.lbankKrwPrice)}</strong>
        </Item>
        <Item>
          BMB/USDT{" "}
          <strong>
            {prices.bmbUsdtPrice != null ? prices.bmbUsdtPrice.toFixed(3) : "—"}
          </strong>
        </Item>
        <Item $hideMobile>
          USDT <strong>{fmtKrw(prices.usdtKrwPrice)}</strong>
        </Item>
        <OtcCta href="/otc">OTC 거래하기 →</OtcCta>
      </Inner>
    </Strip>
  );
}
