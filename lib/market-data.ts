import { fetchCcapi, getCcapiKlinesUrl } from "@/lib/ccapi-fetch";

export interface MajorItem {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
}

export type MajorsSource = "binance" | "okx" | "ccapi" | "stale" | "none";
export type BmbSource = "lbank" | "ccapi" | "stale" | "none";

export interface FetchAllResult {
  majors: MajorItem[];
  bmb: MajorItem | null;
  source: { majors: MajorsSource; bmb: BmbSource };
  errors: Record<string, string>;
  stale: boolean;
}

interface SymbolMeta {
  symbol: string;
  name: string;
  binance: string;
  okx: string;
  ccapi: string;
}

const MAJORS: readonly SymbolMeta[] = [
  { symbol: "BTC",  name: "Bitcoin",   binance: "BTCUSDT",  okx: "BTC-USDT",  ccapi: "btc_usdt"  },
  { symbol: "ETH",  name: "Ethereum",  binance: "ETHUSDT",  okx: "ETH-USDT",  ccapi: "eth_usdt"  },
  { symbol: "XRP",  name: "XRP",       binance: "XRPUSDT",  okx: "XRP-USDT",  ccapi: "xrp_usdt"  },
  { symbol: "BNB",  name: "BNB",       binance: "BNBUSDT",  okx: "BNB-USDT",  ccapi: "bnb_usdt"  },
  { symbol: "SOL",  name: "Solana",    binance: "SOLUSDT",  okx: "SOL-USDT",  ccapi: "sol_usdt"  },
  { symbol: "TRX",  name: "TRON",      binance: "TRXUSDT",  okx: "TRX-USDT",  ccapi: "trx_usdt"  },
  { symbol: "DOGE", name: "Dogecoin",  binance: "DOGEUSDT", okx: "DOGE-USDT", ccapi: "doge_usdt" },
  { symbol: "USDC", name: "USD Coin",  binance: "USDCUSDT", okx: "USDC-USDT", ccapi: "usdc_usdt" },
] as const;

const BMB_META = {
  symbol: "BMB",
  name: "Mobick",
  ccapi: "bmb_usdt",
} as const;

const REQUEST_TIMEOUT_MS = 4500;
const HOURLY_KLINE_COUNT = 25;
const MAX_RESPONSE_BYTES = 1_500_000;
const STALE_TTL_MS = 5 * 60_000;
const FETCH_REVALIDATE_SECONDS = 60;

let lastGood:
  | { majors: MajorItem[]; bmb: MajorItem | null; at: number }
  | null = null;

function classifyStatus(status: number): string {
  if (status === 429) return "rate_limited";
  if (status >= 500) return "unavailable";
  if (status >= 400) return "unavailable";
  return `http_${status}`;
}

async function safeReadJson(res: Response): Promise<unknown | null> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json") && !ct.includes("text/json")) {
    return null;
  }
  const buf = await res.arrayBuffer();
  if (buf.byteLength === 0 || buf.byteLength > MAX_RESPONSE_BYTES) {
    return null;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return null;
  }
}

async function timedFetch(
  url: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function timedCcapi(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetchCcapi(url, { signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface BatchResult {
  ok: boolean;
  items: MajorItem[];
  reason?: string;
}

/** BMB 주 소스 = LBANK 24h ticker (latest + 24h 변화율 1콜).
 *  /api/market-prices와 같은 거래소(LBANK) 호가라 메인·/otc BMB 값이 소스 일치(12A).
 *  ccapi는 폴백 전용. 외부 호출: 기존 ccapi 1콜 → LBANK 1콜(동수, 실패 시에만 ccapi 추가). */
async function fetchBmbFromLbank(): Promise<MajorItem | null> {
  const res = await timedFetch(
    "https://api.lbkex.com/v2/ticker/24hr.do?symbol=bmb_usdt",
    { next: { revalidate: 30 } }, // market-prices의 LBANK 캐시 주기와 동일
  );
  if (!res || !res.ok) return null;
  const json = (await safeReadJson(res)) as {
    result?: unknown;
    error_code?: unknown;
    data?: Array<{
      ticker?: { latest?: unknown; change?: unknown };
    }>;
  } | null;
  if (
    !json ||
    json.result === "false" ||
    json.result === false ||
    (json.error_code != null && json.error_code !== 0)
  ) {
    return null;
  }
  const ticker = json.data?.[0]?.ticker;
  const price = parseFloat(String(ticker?.latest ?? ""));
  const change = parseFloat(String(ticker?.change ?? ""));
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    symbol: BMB_META.symbol,
    name: BMB_META.name,
    price,
    changePercent24h: Number.isFinite(change) ? change : 0,
  };
}

async function fetchFromBinance(): Promise<BatchResult> {
  const symbolsParam = encodeURIComponent(
    JSON.stringify(MAJORS.map((m) => m.binance)),
  );
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`;
  const res = await timedFetch(url, {
    next: { revalidate: FETCH_REVALIDATE_SECONDS },
  });
  if (!res) return { ok: false, items: [], reason: "timeout" };
  if (!res.ok) return { ok: false, items: [], reason: classifyStatus(res.status) };
  const json = await safeReadJson(res);
  if (!Array.isArray(json)) return { ok: false, items: [], reason: "non_json" };

  const map = new Map<string, MajorItem>();
  for (const row of json) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as { symbol?: unknown; lastPrice?: unknown; priceChangePercent?: unknown };
    if (typeof r.symbol !== "string") continue;
    const meta = MAJORS.find((m) => m.binance === r.symbol);
    if (!meta) continue;
    const price = parseFloat(String(r.lastPrice));
    const change = parseFloat(String(r.priceChangePercent));
    if (!Number.isFinite(price) || !Number.isFinite(change)) continue;
    map.set(meta.symbol, {
      symbol: meta.symbol,
      name: meta.name,
      price,
      changePercent24h: change,
    });
  }
  if (map.size === 0) return { ok: false, items: [], reason: "no_data" };
  const items: MajorItem[] = [];
  for (const m of MAJORS) {
    const it = map.get(m.symbol);
    if (it) items.push(it);
  }
  return { ok: true, items };
}

async function fetchFromOkx(): Promise<BatchResult> {
  const settled = await Promise.allSettled(
    MAJORS.map(async (meta) => {
      const url = `https://www.okx.com/api/v5/market/ticker?instId=${meta.okx}`;
      const res = await timedFetch(url, {
        next: { revalidate: FETCH_REVALIDATE_SECONDS },
      });
      if (!res || !res.ok) return null;
      const json = await safeReadJson(res);
      if (!json || typeof json !== "object") return null;
      const data = (json as { data?: unknown }).data;
      if (!Array.isArray(data) || data.length === 0) return null;
      const row = data[0] as { last?: unknown; open24h?: unknown };
      const price = parseFloat(String(row.last));
      const open24h = parseFloat(String(row.open24h));
      if (!Number.isFinite(price) || !Number.isFinite(open24h) || open24h <= 0) {
        return null;
      }
      const changePercent24h = ((price - open24h) / open24h) * 100;
      return {
        symbol: meta.symbol,
        name: meta.name,
        price,
        changePercent24h,
      } satisfies MajorItem;
    }),
  );
  const items: MajorItem[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value != null) items.push(r.value);
  }
  if (items.length === 0) return { ok: false, items, reason: "all_failed" };
  return { ok: true, items };
}

async function fetchFromCcapi(
  metas: readonly { symbol: string; name: string; ccapi: string }[],
): Promise<BatchResult> {
  const settled = await Promise.allSettled(
    metas.map(async (meta) => {
      const url = getCcapiKlinesUrl(
        meta.ccapi,
        "1h",
        Date.now(),
        HOURLY_KLINE_COUNT,
      );
      const res = await timedCcapi(url);
      if (!res || !res.ok) return null;
      const json = await safeReadJson(res);
      const klines = (
        json as { data?: { klines?: Array<{ o?: unknown; c?: unknown }> } } | null
      )?.data?.klines;
      if (!Array.isArray(klines) || klines.length < 2) return null;
      const open24h = parseFloat(String(klines[0]?.o ?? ""));
      const price = parseFloat(String(klines[klines.length - 1]?.c ?? ""));
      if (!Number.isFinite(open24h) || !Number.isFinite(price) || open24h <= 0) {
        return null;
      }
      const changePercent24h = ((price - open24h) / open24h) * 100;
      return {
        symbol: meta.symbol,
        name: meta.name,
        price,
        changePercent24h,
      } satisfies MajorItem;
    }),
  );
  const items: MajorItem[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value != null) items.push(r.value);
  }
  if (items.length === 0) return { ok: false, items, reason: "all_failed" };
  return { ok: true, items };
}

export async function fetchBoardMarketData(): Promise<FetchAllResult> {
  const errors: Record<string, string> = {};
  let majorsSource: MajorsSource = "none";
  let majors: MajorItem[] = [];

  const binance = await fetchFromBinance();
  if (binance.ok && binance.items.length === MAJORS.length) {
    majors = binance.items;
    majorsSource = "binance";
  } else {
    if (binance.reason) errors._binance = binance.reason;
    const okx = await fetchFromOkx();
    if (okx.ok && okx.items.length === MAJORS.length) {
      majors = okx.items;
      majorsSource = "okx";
    } else {
      if (okx.reason) errors._okx = okx.reason;
      const cc = await fetchFromCcapi(MAJORS);
      if (cc.ok) {
        majors = cc.items;
        majorsSource = "ccapi";
      } else if (cc.reason) {
        errors._ccapi = cc.reason;
      }
    }
  }

  const got = new Set(majors.map((m) => m.symbol));
  for (const m of MAJORS) {
    if (!got.has(m.symbol)) errors[m.symbol] = "unavailable";
  }

  // BMB: LBANK 주 소스(12A — market-prices와 소스 통일) → 실패 시에만 ccapi 폴백
  let bmb: MajorItem | null = await fetchBmbFromLbank();
  let bmbSource: BmbSource = bmb ? "lbank" : "none";
  if (!bmb) {
    const bmbBatch = await fetchFromCcapi([BMB_META]);
    bmb = bmbBatch.ok && bmbBatch.items.length > 0 ? bmbBatch.items[0] : null;
    if (bmb) bmbSource = "ccapi";
    else errors.BMB = bmbBatch.reason ?? "unavailable";
  }

  let stale = false;
  if (
    majors.length === 0 &&
    lastGood &&
    Date.now() - lastGood.at < STALE_TTL_MS &&
    lastGood.majors.length > 0
  ) {
    majors = lastGood.majors;
    majorsSource = "stale";
    stale = true;
  }
  if (
    bmb == null &&
    lastGood?.bmb &&
    Date.now() - lastGood.at < STALE_TTL_MS
  ) {
    bmb = lastGood.bmb;
    bmbSource = "stale";
    stale = true;
  }

  if (majors.length > 0 || bmb != null) {
    lastGood = {
      majors: majors.length > 0 ? majors : lastGood?.majors ?? [],
      bmb: bmb ?? lastGood?.bmb ?? null,
      at: Date.now(),
    };
  }

  return {
    majors,
    bmb,
    source: { majors: majorsSource, bmb: bmbSource },
    errors,
    stale,
  };
}
