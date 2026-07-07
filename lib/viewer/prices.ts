import { fetchTickerPrice, fetchUsdtKrw } from "@/lib/otc-orderbook";

export interface ViewerPriceEntry {
  krw: number;
  usd?: number;
  source: string;
}

/** CoinGecko id → 레지스트리 symbol (priceSource: market) */
const COINGECKO_MARKET_IDS: Record<string, string> = {
  ethereum: "ETH",
  binancecoin: "BNB",
  tether: "USDT",
  "usd-coin": "USDC",
  "wrapped-bitcoin": "WBTC",
};

const COINGECKO_SIMPLE_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin,tether,usd-coin,wrapped-bitcoin&vs_currencies=usd";

/** 춘심 OTC 호가·수동 단가 — 운영 확정 전까지 임시 */
// TODO: 어드민 OTC 호가/시그널 API와 연동
const CHOONSIM_MANUAL_KRW: Record<string, number> = {
  SBMB: 5000,
  WBMB: 0,
  LDT: 0,
  PRR: 0,
  MOVL: 0,
  MOVN: 0,
};

export interface ViewerRatesPayload {
  usdKrw: number | null;
  prices: Record<string, ViewerPriceEntry>;
  updatedAt: string;
}

let ratesCache: { expiresAt: number; payload: ViewerRatesPayload } | null = null;
const RATES_TTL_MS = 60_000;

async function fetchCoinGeckoMarketUsd(): Promise<Record<string, number>> {
  try {
    const res = await fetch(COINGECKO_SIMPLE_PRICE_URL, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return {};

    const data = (await res.json()) as Record<
      string,
      { usd?: number } | undefined
    >;

    const prices: Record<string, number> = {};
    for (const [id, symbol] of Object.entries(COINGECKO_MARKET_IDS)) {
      const usd = data[id]?.usd;
      if (typeof usd === "number" && usd > 0) {
        prices[symbol] = usd;
      }
    }
    return prices;
  } catch {
    return {};
  }
}

export async function fetchViewerRates(): Promise<ViewerRatesPayload> {
  const now = Date.now();
  if (ratesCache && now < ratesCache.expiresAt) {
    return ratesCache.payload;
  }

  const [usdtKrw, bmbUsdt, marketUsd] = await Promise.all([
    fetchUsdtKrw(),
    fetchTickerPrice(),
    fetchCoinGeckoMarketUsd(),
  ]);

  const prices: Record<string, ViewerPriceEntry> = {};

  if (bmbUsdt != null && usdtKrw != null) {
    prices.BMB = {
      krw: bmbUsdt * usdtKrw,
      source: "lbank",
    };
  }

  for (const [symbol, krw] of Object.entries(CHOONSIM_MANUAL_KRW)) {
    if (krw > 0) {
      prices[symbol] = { krw, source: "choonsim" };
    }
  }

  if (usdtKrw != null) {
    for (const [symbol, usd] of Object.entries(marketUsd)) {
      prices[symbol] = {
        usd,
        krw: usd * usdtKrw,
        source: "market",
      };
    }
  }

  const payload: ViewerRatesPayload = {
    usdKrw: usdtKrw,
    prices,
    updatedAt: new Date().toISOString(),
  };

  ratesCache = { expiresAt: now + RATES_TTL_MS, payload };
  return payload;
}
