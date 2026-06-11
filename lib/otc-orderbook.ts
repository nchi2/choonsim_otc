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

function parseSide(arr: unknown): AskLevel[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((a: unknown[]) => [Number(a?.[0]), Number(a?.[1])] as AskLevel)
    .filter(
      ([p, q]) => Number.isFinite(p) && Number.isFinite(q) && p > 0 && q > 0,
    );
}

/**
 * LBANK depth.do는 asks(매도호가)와 bids(매수호가)를 한 번에 반환한다.
 * asks: 오름차순(낮은 가격 먼저), bids: 내림차순(높은 가격 먼저)으로 정렬해 돌려준다.
 */
export async function fetchDepth(): Promise<{
  asks: AskLevel[];
  bids: AskLevel[];
} | null> {
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
    const asks = parseSide(data?.data?.asks).sort((a, b) => a[0] - b[0]);
    const bids = parseSide(data?.data?.bids).sort((a, b) => b[0] - a[0]);
    return { asks, bids };
  } catch {
    return null;
  }
}

export async function fetchAsks(): Promise<AskLevel[] | null> {
  const depth = await fetchDepth();
  if (!depth || !depth.asks.length) return null;
  return depth.asks;
}

export async function fetchBids(): Promise<AskLevel[] | null> {
  const depth = await fetchDepth();
  if (!depth || !depth.bids.length) return null;
  return depth.bids;
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

/**
 * 요청 수량을 채우는 호가 가중평균(호가 평단가) + 호가별 체결수량.
 * 깊이 부족 시 마지막 체결 호가 가격으로 잔량을 가정해 채움(시각화·VWAP 산식 동일).
 */
export function vwapForQuantity(asks: AskLevel[], qty: number): VwapResult {
  let remaining = qty;
  let cost = 0;
  let filled = 0;
  const levels: OrderbookLevel[] = [];
  let lastTouchedIdx = -1;

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
    if (take > 0) lastTouchedIdx = levels.length - 1;
  }

  if (remaining > 0 && asks.length > 0) {
    const lastPrice = asks[asks.length - 1][0];
    cost += remaining * lastPrice;
    filled += remaining;
    // 잔량은 호가창 최심가가 아니라 마지막으로 실제 체결한 호가에 귀속.
    const target =
      lastTouchedIdx >= 0 ? levels[lastTouchedIdx] : levels[levels.length - 1];
    if (target) target.filledQty += remaining;
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
