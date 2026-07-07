import { fetchTickerPrice, fetchUsdtKrw } from "@/lib/otc-orderbook";

export interface ViewerPriceEntry {
  krw: number | null;
  usd?: number | null;
  source: string;
  note?: string;
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

const VALUE_UNAVAILABLE_SYMBOLS = ["SBMB", "LDT", "PRR", "MOVL"] as const;

function unavailablePrice(note?: string): ViewerPriceEntry {
  return {
    krw: null,
    usd: null,
    source: "unavailable",
    ...(note ? { note } : {}),
  };
}

function pendingPrice(note: string): ViewerPriceEntry {
  return {
    krw: null,
    usd: null,
    source: "pending",
    note,
  };
}

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
      usd: bmbUsdt,
      source: "lbank",
    };
    // WBMB는 현재 BMB 래핑 자산으로 같은 시세를 사용한다.
    prices.WBMB = {
      krw: bmbUsdt * usdtKrw,
      usd: bmbUsdt,
      source: "bmb-parity",
    };
  }

  for (const symbol of VALUE_UNAVAILABLE_SYMBOLS) {
    prices[symbol] = unavailablePrice();
  }

  // TODO: Uniswap V4 BSC MOVN-USDT 실시간 가격 연동
  // 현재 부족한 정보:
  // 1) positions/v4/bnb/631138 링크가 직접 poolId(bytes32)를 제공하지 않음
  // 2) BSC용 v4 PositionManager / PoolManager 주소와 poolKeys(poolId[:25]) 조회 경로 확인 필요
  // 3) 또는 Uniswap v4 / Bitquery subgraph에서 해당 포지션이 참조하는 poolId를 먼저 역매핑해야 함
  prices.MOVN = pendingPrice(
    "Uniswap V4 BSC poolId/PoolKey 확인 필요",
  );

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
