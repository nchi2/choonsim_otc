"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import BmbUsdtTicker, {
  formatPrice,
  formatChange,
  changeColor,
} from "./BmbUsdtTicker";

interface MajorItem {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
}

interface MajorsResponse {
  items: MajorItem[];
  updatedAt: string;
  errors?: Record<string, string>;
  source?: { majors: string; bmb: string };
  stale?: boolean;
}

interface MarketPricesResponse {
  usdtKrwPrice: number | null;
  bmbUsdtPrice: number | null;
  lbankKrwPrice: number | null;
}

const REFRESH_MS = 120_000; // CPU 절감: 60s→120s (Step 11 — 메이저 시세 신선도 덜 중요)
const FALLBACK_ERROR_MESSAGE = "시세를 일시적으로 불러올 수 없습니다.";

async function safeJson<T>(res: Response): Promise<T | null> {
  let body: string;
  try {
    body = await res.text();
  } catch {
    return null;
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

const BoardCard = styled.section`
  width: 100%;
  background: #ffffff;
  border: 1px solid #e8e2f4;
  border-radius: 12px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 1px 2px rgba(149, 128, 180, 0.05);
`;

const BoardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

const BoardTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
`;

const BoardSubtitle = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Cell = styled.div`
  background: #fafaff;
  border: 1px solid #f0eef9;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const SymbolRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const IconFrame = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex: 0 0 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  overflow: hidden;

  > img {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: block;
  }
`;

const IconInitial = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: -0.02em;
`;

const Symbol = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
  flex: 0 0 auto;
`;

const CoinName = styled.span`
  font-size: 0.7rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

const Price = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  font-variant-numeric: tabular-nums;
  word-break: keep-all;
`;

const Change = styled.span<{ $color: string }>`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${(p) => p.$color};
  font-variant-numeric: tabular-nums;
`;

const Status = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
  padding: 12px 0;
`;

const StatusError = styled(Status)`
  color: #dc2626;
`;

const PartialErrorRow = styled.div`
  font-size: 0.72rem;
  color: #9ca3af;
  line-height: 1.4;
`;

function CoinIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <IconFrame aria-hidden="true">
        <IconInitial>{symbol.slice(0, 1)}</IconInitial>
      </IconFrame>
    );
  }
  return (
    <IconFrame aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/coin-icons/${symbol.toLowerCase()}.svg`}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </IconFrame>
  );
}

export default function MajorPriceBoard() {
  const [majors, setMajors] = useState<MajorsResponse | null>(null);
  const [marketPrices, setMarketPrices] =
    useState<MarketPricesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      let anyOk = false;
      try {
        const [majorsRes, mpRes] = await Promise.allSettled([
          fetch("/api/market-prices/majors", { signal: controller.signal }),
          fetch("/api/market-prices", { signal: controller.signal }),
        ]);

        if (majorsRes.status === "fulfilled" && majorsRes.value.ok) {
          const json = await safeJson<MajorsResponse>(majorsRes.value);
          if (json && !cancelled) {
            setMajors(json);
            anyOk = true;
          }
        }

        if (mpRes.status === "fulfilled" && mpRes.value.ok) {
          const json = await safeJson<MarketPricesResponse>(mpRes.value);
          if (json && !cancelled) {
            setMarketPrices(json);
            anyOk = true;
          }
        }

        if (!cancelled) setError(anyOk ? null : FALLBACK_ERROR_MESSAGE);
      } catch {
        if (controller.signal.aborted) return;
        if (!cancelled) setError(FALLBACK_ERROR_MESSAGE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const bmbFromMajors = useMemo(
    () => majors?.items.find((it) => it.symbol === "BMB") ?? null,
    [majors],
  );
  const otherMajors = useMemo(
    () => (majors?.items ?? []).filter((it) => it.symbol !== "BMB"),
    [majors],
  );

  const bmbRow = useMemo(() => {
    const usdtPrice =
      marketPrices?.bmbUsdtPrice ?? bmbFromMajors?.price ?? null;
    const change = bmbFromMajors?.changePercent24h ?? null;
    const krw = marketPrices?.lbankKrwPrice ?? null;
    const usdtKrw = marketPrices?.usdtKrwPrice ?? null;
    if (usdtPrice == null) return null;
    return { usdtPrice, change, krw, usdtKrw };
  }, [marketPrices, bmbFromMajors]);

  const missingSymbols = useMemo(() => {
    if (!majors?.errors) return [] as string[];
    return Object.keys(majors.errors).filter((k) => !k.startsWith("_"));
  }, [majors]);

  const hasAnyData = bmbRow != null || otherMajors.length > 0;

  return (
    <BoardCard aria-label="시세 보드">
      <BoardHeader>
        <BoardTitle>시세 보드</BoardTitle>
        <BoardSubtitle>USDT 기준 · 24h 변동</BoardSubtitle>
      </BoardHeader>

      {bmbRow && (
        <BmbUsdtTicker
          usdtPrice={bmbRow.usdtPrice}
          change={bmbRow.change}
          krw={bmbRow.krw}
          usdtKrw={bmbRow.usdtKrw}
        />
      )}

      {loading && !hasAnyData && (
        <Status>시세를 불러오는 중...</Status>
      )}

      {!loading && !hasAnyData && error && (
        <StatusError>{error}</StatusError>
      )}

      {!loading && !hasAnyData && !error && (
        <Status>표시할 시세가 없습니다.</Status>
      )}

      {otherMajors.length > 0 && (
        <Grid>
          {otherMajors.map((it) => (
            <Cell key={it.symbol}>
              <SymbolRow>
                <CoinIcon symbol={it.symbol} />
                <Symbol>{it.symbol}</Symbol>
                <CoinName>{it.name}</CoinName>
              </SymbolRow>
              <Price>${formatPrice(it.symbol, it.price)}</Price>
              <Change $color={changeColor(it.symbol, it.changePercent24h)}>
                {formatChange(it.symbol, it.changePercent24h)}
              </Change>
            </Cell>
          ))}
        </Grid>
      )}

      {hasAnyData && missingSymbols.length > 0 && (
        <PartialErrorRow>
          일부 코인 시세를 일시적으로 불러오지 못했습니다 ({missingSymbols.join(", ")})
        </PartialErrorRow>
      )}
    </BoardCard>
  );
}
