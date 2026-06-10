/**
 * LBANK BMB/USDT 매도호가 + USDT/KRW 환율 조회 및 VWAP 계산.
 * miracle10 estimate와 어드민 OTC 계산기가 공유한다.
 */

import { fetchCcapi, getCcapiKlinesUrl } from "@/lib/ccapi-fetch";

export type AskLevel = [number, number]; // [price(USDT/BMB), quantity(BMB)]

export interface OrderbookLevel {
  price: number;
  size: number;
  filledQty: number;
}

export interface VwapResult {
  vwap: number;
  totalUsdt: number;
  levels: OrderbookLevel[];
}

export async function fetchAsks(): Promise<AskLevel[] | null> {
  try {
    const res = await fetch(
      "https://api.lbkex.com/v2/depth.do?symbol=bmb_usdt&size=200",
      { next: { revalidate: 15 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const unsupported =
      data?.result === "false" ||
      data?.result === false ||
      (data?.error_code != null && data.error_code !== 0);
    if (unsupported) return null;
    const asks = data?.data?.asks;
    if (!Array.isArray(asks)) return null;
    const parsed: AskLevel[] = asks
      .map((a: unknown[]) => [Number(a?.[0]), Number(a?.[1])] as AskLevel)
      .filter(
        ([p, q]) => Number.isFinite(p) && Number.isFinite(q) && p > 0 && q > 0,
      );
    parsed.sort((a, b) => a[0] - b[0]);
    return parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export async function fetchTickerPrice(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.lbkex.com/v2/supplement/ticker/price.do?symbol=bmb_usdt",
      { next: { revalidate: 30 } },
    );
    if (res.ok) {
      const data = await res.json();
      const unsupported =
        data?.result === "false" ||
        data?.result === false ||
        (data?.error_code != null && data.error_code !== 0);
      const price = data?.data?.[0]?.price;
      if (!unsupported && price != null) return parseFloat(price);
    }
  } catch {
    /* fall through */
  }
  try {
    const url = getCcapiKlinesUrl("bmb_usdt", "1d", Date.now(), 1);
    const res = await fetchCcapi(url, { next: { revalidate: 30 } });
    if (res.ok) {
      const data = await res.json();
      const c = data?.data?.klines?.[0]?.c;
      if (c != null) return parseFloat(String(c));
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function fetchUsdtKrw(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.bithumb.com/public/ticker/USDT_KRW",
      { next: { revalidate: 30 } },
    );
    if (res.ok) {
      const data = await res.json();
      const cp = data?.data?.closing_price;
      if (cp) return parseFloat(String(cp).replace(/,/g, ""));
    }
  } catch {
    /* try upbit */
  }
  try {
    const res = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
      { next: { revalidate: 30 } },
    );
    if (res.ok) {
      const data = await res.json();
      const tp = data?.[0]?.trade_price;
      if (tp != null) return Number(tp);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** 요청 수량을 채우는 매도호가 가중평균(VWAP) + 호가별 체결수량. 깊이 부족 시 마지막 호가로 잔량 채움. */
export function vwapForQuantity(asks: AskLevel[], qty: number): VwapResult {
  let remaining = qty;
  let cost = 0;
  let filled = 0;
  const levels: OrderbookLevel[] = [];

  for (const [price, available] of asks) {
    if (remaining <= 0) {
      levels.push({ price, size: available, filledQty: 0 });
      continue;
    }
    const take = Math.min(remaining, available);
    cost += take * price;
    filled += take;
    remaining -= take;
    levels.push({ price, size: available, filledQty: take });
  }

  if (remaining > 0 && asks.length > 0) {
    const lastPrice = asks[asks.length - 1][0];
    cost += remaining * lastPrice;
    filled += remaining;
    const last = levels[levels.length - 1];
    if (last) last.filledQty += remaining;
    remaining = 0;
  }

  const vwap = filled > 0 ? cost / filled : asks[0]?.[0] ?? 0;
  return { vwap, totalUsdt: cost, levels };
}

export function getMarginRate(): number {
  const raw = Number(process.env.MARGIN_RATE);
  if (!Number.isFinite(raw) || raw < 0 || raw > 1) return 0.01;
  return raw;
}
