import { fetchCcapi, getCcapiKlinesUrl } from "@/lib/ccapi-fetch";

/**
 * /otc 시세 보드(메이저 8 + BMB 24h%) 전용 통합 페치 모듈.
 *
 * - 메이저 8종(BTC/ETH/XRP/BNB/SOL/TRX/DOGE/USDC):
 *   바이낸스(`/api/v3/ticker/24hr` 일괄) → OKX(8병렬) → ccapi(klines 1h×25) 폴백.
 *   바이낸스 batch가 1차이므로 평소엔 외부 호출 1회만 발생.
 * - BMB:
 *   바이낸스/OKX 미상장. ccapi `klines` 1h×25 1회.
 *   (LBANK ticker는 24h 변동률을 주지 않아 ccapi가 24h% 산출에 적합.
 *    BMB의 표시 가격은 클라이언트가 별도로 `/api/market-prices`(LBANK 1차)에서 받아 덮어쓴다.)
 * - 안전 파싱:
 *   외부 응답의 status / Content-Type / 본문 길이를 직접 검증 후 JSON.parse 시도.
 *   비정상이면 본문을 전혀 객체에 담지 않고 짧은 reason 코드만 남긴다.
 *   외부 노출 reason: `rate_limited`, `timeout`, `unavailable`, `non_json`, `no_data`, `all_failed`.
 * - stale 폴백:
 *   모든 외부 소스가 실패해도 5분 내 마지막 성공값을 반환해 화면을 유지한다.
 *
 * ※ 메인이 사용하는 `/api/market-prices` 라우트와 `lib/ccapi-fetch.ts` 시그니처는
 *    의도적으로 손대지 않는다. 본 모듈은 /otc 보드 라우트 한 곳에서만 사용된다.
 */

export interface MajorItem {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
}

export type MajorsSource = "binance" | "okx" | "ccapi" | "stale" | "none";
export type BmbSource = "ccapi" | "stale" | "none";

export interface FetchAllResult {
  /** 시세 보드 메이저 8종(실패한 심볼은 빠짐). */
  majors: MajorItem[];
  /** BMB 강조 행용. null이면 사용 불가. */
  bmb: MajorItem | null;
  /** 진단용 — 메이저/BMB 각각이 어디서 왔는지. */
  source: { majors: MajorsSource; bmb: BmbSource };
  /** 외부 노출 가능한 짧은 reason 코드만. */
  errors: Record<string, string>;
  /** 마지막 성공값(stale)을 사용한 경우 true. */
  stale: boolean;
}

interface SymbolMeta {
  symbol: string;
  name: string;
  binance: string;
  okx: string;
  ccapi: string;
}

/** 소스별 심볼 매핑은 한 곳에서 관리. */
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

/** 단일 외부 호출 타임아웃. */
const REQUEST_TIMEOUT_MS = 4500;
/** 1h × 25 봉 — 첫 open vs 마지막 close = 24h 변동률 산출. */
const HOURLY_KLINE_COUNT = 25;
/** 외부 응답 본문 컷오프. 시세 응답이 1.5MB를 넘으면 비정상으로 본다. */
const MAX_RESPONSE_BYTES = 1_500_000;
/** 마지막 성공값 stale 노출 가능 시간(5분). */
const STALE_TTL_MS = 5 * 60_000;
/** 서버 fetch 캐시 — 동일 URL은 60초 동안 재사용. */
const FETCH_REVALIDATE_SECONDS = 60;

let lastGood:
  | { majors: MajorItem[]; bmb: MajorItem | null; at: number }
  | null = null;

/* -------------------------------------------------------------------------- */
/*                              Safe fetch helpers                            */
/* -------------------------------------------------------------------------- */

function classifyStatus(status: number): string {
  if (status === 429) return "rate_limited";
  if (status >= 500) return "unavailable";
  if (status >= 400) return "unavailable";
  return `http_${status}`;
}

/** Content-Type / 본문 크기를 검증한 뒤 JSON 파싱. 어느 단계든 실패하면 null. */
async function safeReadJson(res: Response): Promise<unknown | null> {
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();
  if (!ct.includes("json")) return null;
  let body: string;
  try {
    body = await res.text();
  } catch {
    return null;
  }
  if (body.length > MAX_RESPONSE_BYTES) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

interface TimedFetchInit {
  next?: { revalidate?: number };
}

async function timedFetch(
  url: string,
  init: TimedFetchInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: init.next,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function timedCcapi(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchCcapi(url, {
      signal: controller.signal,
      next: { revalidate: FETCH_REVALIDATE_SECONDS },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/*                         Source-specific fetchers                           */
/* -------------------------------------------------------------------------- */

interface BatchResult {
  ok: boolean;
  items: MajorItem[];
  reason?: string;
}

/** 바이낸스 일괄 ticker (`?symbols=[...]`). 1회 호출로 8 심볼. */
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
  /** MAJORS 순서 유지 — UI 카드 위치가 갱신마다 흔들리지 않게. */
  const items: MajorItem[] = [];
  for (const m of MAJORS) {
    const it = map.get(m.symbol);
    if (it) items.push(it);
  }
  return { ok: true, items };
}

/** OKX 폴백 — instId 단위 8병렬. */
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

/** ccapi 폴백 — klines 1h×25 병렬. BMB는 본 함수가 사실상 유일한 소스. */
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

/* -------------------------------------------------------------------------- */
/*                                 Public API                                 */
/* -------------------------------------------------------------------------- */

export async function fetchBoardMarketData(): Promise<FetchAllResult> {
  const errors: Record<string, string> = {};
  let majorsSource: MajorsSource = "none";
  let majors: MajorItem[] = [];

  /** 1차: 바이낸스 batch — 한 번의 호출로 8 심볼. */
  const binance = await fetchFromBinance();
  if (binance.ok && binance.items.length === MAJORS.length) {
    majors = binance.items;
    majorsSource = "binance";
  } else {
    if (binance.reason) errors._binance = binance.reason;
    /** 2차: OKX 8병렬. */
    const okx = await fetchFromOkx();
    if (okx.ok && okx.items.length === MAJORS.length) {
      majors = okx.items;
      majorsSource = "okx";
    } else {
      if (okx.reason) errors._okx = okx.reason;
      /** 3차: ccapi 8병렬. */
      const cc = await fetchFromCcapi(MAJORS);
      if (cc.ok) {
        majors = cc.items;
        majorsSource = "ccapi";
      } else if (cc.reason) {
        errors._ccapi = cc.reason;
      }
    }
  }

  /** 부분 실패 — 모든 소스를 거쳐도 빠진 심볼만 errors에 남김. */
  const got = new Set(majors.map((m) => m.symbol));
  for (const m of MAJORS) {
    if (!got.has(m.symbol)) errors[m.symbol] = "unavailable";
  }

  /** BMB — ccapi only. */
  const bmbBatch = await fetchFromCcapi([BMB_META]);
  let bmb: MajorItem | null =
    bmbBatch.ok && bmbBatch.items.length > 0 ? bmbBatch.items[0] : null;
  let bmbSource: BmbSource = bmb ? "ccapi" : "none";
  if (!bmb) errors.BMB = bmbBatch.reason ?? "unavailable";

  /** stale 폴백 — 모든 소스 죽어도 마지막 성공값(5분 내)으로 화면 유지. */
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

  /** 새 성공값이 있으면 lastGood 갱신 (부분 성공도 의미 있음). */
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
