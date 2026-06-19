/**
 * OTC 계산기용 시장 지표 집계.
 * BMB/BTC 일봉, 현재가/환율, 공포·탐욕, 김치프리미엄을 모아
 * 평균·변동폭·매물대·박스권·볼린저·신호등·분석요청 텍스트까지 한 번에 계산한다.
 *
 * 외부 호출은 병렬(부분 성공 허용)이며, 결과 전체를 모듈 인메모리 캐시(TTL 5분)에 보관한다.
 * 캐시 히트 시 외부 호출은 0이다.
 */

import { fetchCcapi, getCcapiKlinesUrl } from "@/lib/ccapi-fetch";
import { fmtKstDate, fmtKstMinute, fmtKstYearMonth } from "@/lib/kst";
import { fetchTickerPrice, fetchUsdtKrw } from "@/lib/otc-orderbook";

// ─────────────────────────── 상수 (조정 가능) ───────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000;
/** 공식 환율은 자주 안 변하니 별도 1시간 캐시. */
const FX_CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_BUCKETS = 10;
const MIN_BUCKETS = 4;
const MAX_BUCKETS = 20;

/** range 폭이 이 이내(%)면 박스권, 초과면 추세. */
const BOX_THRESHOLD = 8;

/** 신호등 판정 임계값. 운영 중 조정 시 여기만 손대면 된다. */
export const SIGNAL_THRESHOLDS = {
  /** 현재가가 평균과 이 이내면 안정(녹색). 단위 % */
  greenDeviationPct: 2,
  /** 이 초과 괴리면 적색. 단위 % (2~5%는 황색) */
  redDeviationPct: 5,
  /** 오늘 거래량이 7일 평균의 이 배수 미만이면 거래 희박(황색) */
  lowVolumeRatio: 0.5,
  /** 오늘 거래량이 30일 평균의 이 배수 이상이면 거래량 급변(적색) */
  extremeVolumeRatio: 3,
  /** BTC 7일 등락이 이 이하면 시장 급락(적색). 단위 % */
  btcCrashChg7Pct: -10,
  /** 30일 폭이 이 이내면 박스권으로 판정. 단위 % */
  boxWidthPct: BOX_THRESHOLD,
} as const;

// ─────────────────────────── 타입 ───────────────────────────

interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface VolumeBucket {
  lowPrice: number;
  highPrice: number;
  volumePct: number;
}

export interface BoxInfo {
  bound: "박스권" | "추세";
  widthPct: number;
  pricePosition: number;
}

export interface SupportResistance {
  /** 현재가가 속한 매물대 구간의 거래량 비중(%) — 사실값. */
  currentZonePct: number;
  /** 현재가보다 위쪽 구간 중 거래량 최대(사실 위치). */
  nearestResistance: VolumeBucket | null;
  /** 현재가보다 아래쪽 구간 중 거래량 최대(사실 위치). */
  nearestSupport: VolumeBucket | null;
}

export interface BmbSignals {
  avg7: number | null;
  avg30: number | null;
  avg90: number | null;
  range7: { min: number; max: number } | null;
  range30: { min: number; max: number } | null;
  range90: { min: number; max: number } | null;
  /** 오늘(진행 중) 거래량 — 비교·판정에서 제외, 표기용. */
  volToday: number | null;
  /** 전일(완료) 거래량 — 평균과 비교/판정 기준. */
  volPrevDay: number | null;
  volAvg7: number | null;
  volAvg30: number | null;
  volAvg90: number | null;
  /** 매물대(전체 이력 기준). 가격 오름차순. */
  volumeProfile: VolumeBucket[];
  volumeProfileByPct: VolumeBucket[];
  /** 매물대 산출에 쓴 실제 일봉 개수. */
  profileDays: number;
  /** 매물대 데이터 시작일 "YYYY.MM.DD"(KST). */
  profileFrom: string | null;
  /** 매물대 데이터 끝일 "YYYY.MM.DD"(KST). */
  profileTo: string | null;
  /** 현재가가 속한 매물대 구간 인덱스(가격 오름차순). */
  currentBucketIndex: number | null;
  /** 하위호환: boxByPeriod.d30과 동일 */
  box: BoxInfo | null;
  boxByPeriod: {
    d7: BoxInfo | null;
    d30: BoxInfo | null;
    d90: BoxInfo | null;
  };
  supportResistance: SupportResistance | null;
}

export interface BtcSignals {
  price: number | null;
  chg7: number | null;
  chg30: number | null;
  chg90: number | null;
  ma200: number | null;
  ma200Above: boolean | null;
  ma200Position: number | null;
  bollinger20: {
    upper: number;
    mid: number;
    lower: number;
    position: number;
  } | null;
}

export interface MarketEnv {
  fearGreed: { value: number; classification: string } | null;
  /** USDT/KRW 기준 김프(USDT 대비 BTC 괴리). 보통 0% 근처. */
  kimchiPremium: number | null;
  /** 공식 USD/KRW 환율 기준 전통 김프(한국 코인시장 과열도). */
  traditionalKimchi: number | null;
  /** 전통 김프 계산에 사용한 공식 환율(참고 표시용). */
  fxUsdKrw: number | null;
}

export type MarketStatus = "green" | "yellow" | "red";

export interface MarketSignalsResult {
  bmb: BmbSignals | null;
  btc: BtcSignals | null;
  env: MarketEnv;
  lastPrice: number | null;
  lastPriceKrw: number | null;
  usdtKrw: number | null;
  marketStatus: MarketStatus;
  reasons: string[];
  analysisText: string;
  partial: boolean;
  failed: string[];
  asOf: string;
}

// ─────────────────────────── 숫자 헬퍼 ───────────────────────────

/** USDT 2자리 */
const u2 = (n: number): number => Math.round(n * 100) / 100;
/** 원화 정수 */
const krw = (n: number): number => Math.round(n);
/** % 1자리 (-0 → 0 정규화) */
const p1 = (n: number): number => {
  const v = Math.round(n * 10) / 10;
  return v === 0 ? 0 : v;
};
/** 거래량 정수 */
const vInt = (n: number): number => Math.round(n);

const mean = (arr: number[]): number =>
  arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

const lastN = <T>(arr: T[], n: number): T[] =>
  arr.slice(Math.max(0, arr.length - n));

const fmt = (n: number | null, unit = "", digits = 1): string =>
  n == null ? "—" : `${n.toLocaleString("ko-KR", { maximumFractionDigits: digits })}${unit}`;

/** % 1자리 부호 표시: +1.2% / −0.8% / 0.0% */
function fmtPctSigned(n: number | null): string {
  if (n == null) return "—";
  const norm = p1(n);
  const body = norm.toFixed(1);
  if (norm > 0) return `+${body}%`;
  return `${body}%`;
}

// ─────────────────────────── 외부 호출 ───────────────────────────

async function fetchKlines(symbol: string, size: number): Promise<Candle[] | null> {
  try {
    const url = getCcapiKlinesUrl(symbol, "1d", Date.now(), size);
    const res = await fetchCcapi(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.data?.klines;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const candles: Candle[] = raw
      .map((k: { t: unknown; o: unknown; h: unknown; l: unknown; c: unknown; v: unknown }) => ({
        t: Number(k.t),
        o: parseFloat(String(k.o)),
        h: parseFloat(String(k.h)),
        l: parseFloat(String(k.l)),
        c: parseFloat(String(k.c)),
        v: parseFloat(String(k.v)),
      }))
      .filter((c: Candle) => Number.isFinite(c.c) && Number.isFinite(c.t))
      .sort((a: Candle, b: Candle) => a.t - b.t);
    return candles.length ? candles : null;
  } catch {
    return null;
  }
}

async function fetchFearGreed(): Promise<{ value: number; classification: string } | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.data?.[0];
    const value = Number(item?.value);
    const classification = String(item?.value_classification ?? "");
    if (!Number.isFinite(value)) return null;
    return { value: Math.round(value), classification };
  } catch {
    return null;
  }
}

async function fetchUpbitBtcKrw(): Promise<number | null> {
  try {
    const res = await fetch("https://api.upbit.com/v1/ticker?markets=KRW-BTC", {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const tp = data[0]?.trade_price;
    const price = parseFloat(String(tp));
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

async function fetchBinanceBtcUsdt(): Promise<number | null> {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const price = parseFloat(String(data?.price));
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

function computeKimchiPremium(
  upbitBtcKrw: number | null,
  binanceBtcUsdt: number | null,
  usdtKrw: number | null,
): number | null {
  if (
    upbitBtcKrw == null ||
    binanceBtcUsdt == null ||
    usdtKrw == null ||
    !(upbitBtcKrw > 0) ||
    !(binanceBtcUsdt > 0) ||
    !(usdtKrw > 0)
  ) {
    return null;
  }

  const upbitInUsdt = upbitBtcKrw / usdtKrw;
  const rawPct = ((upbitInUsdt - binanceBtcUsdt) / binanceBtcUsdt) * 100;
  const kimchiPremium = p1(rawPct);

  if (process.env.NODE_ENV === "development") {
    console.log("[market-signals/kimchi]", {
      upbitBtcKrw,
      binanceBtcUsdt,
      usdtKrw,
      upbitInUsdt,
      rawPct,
      kimchiPremium,
    });
  }

  return kimchiPremium;
}

// ─────────────────────────── 공식 환율(USD/KRW) ───────────────────────────

/**
 * 공식 USD/KRW 환율. 키 불필요 무료 소스만 사용.
 * 1순위 open.er-api.com, 폴백 frankfurter.dev(ECB 기준).
 */
async function fetchFxUsdKrwUncached(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const rate = parseFloat(String(data?.rates?.KRW));
      if (data?.result === "success" && Number.isFinite(rate) && rate > 0) {
        return rate;
      }
    }
  } catch {
    /* try fallback */
  }
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW",
      { next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const data = await res.json();
      const rate = parseFloat(String(data?.rates?.KRW));
      if (Number.isFinite(rate) && rate > 0) return rate;
    }
  } catch {
    /* ignore */
  }
  return null;
}

let fxCache: { value: number; at: number } | null = null;
let fxInFlight: Promise<number | null> | null = null;

/** 공식 환율 1시간 캐시(다른 지표 5분과 별도 버킷) + in-flight 중복 제거. */
async function getFxUsdKrw(): Promise<number | null> {
  if (fxCache && Date.now() - fxCache.at < FX_CACHE_TTL_MS) {
    return fxCache.value;
  }
  if (fxInFlight) return fxInFlight;

  fxInFlight = (async () => {
    try {
      const value = await fetchFxUsdKrwUncached();
      if (value != null) fxCache = { value, at: Date.now() };
      return value;
    } finally {
      fxInFlight = null;
    }
  })();
  return fxInFlight;
}

/**
 * 전통 김프 = (업비트BTC원화 ÷ 공식USDKRW − 바이낸스BTC) / 바이낸스BTC × 100.
 * 공식 환율을 쓰므로 한국 코인시장 과열도를 본다.
 */
function computeTraditionalKimchi(
  upbitBtcKrw: number | null,
  binanceBtcUsdt: number | null,
  fxUsdKrw: number | null,
): number | null {
  if (
    upbitBtcKrw == null ||
    binanceBtcUsdt == null ||
    fxUsdKrw == null ||
    !(upbitBtcKrw > 0) ||
    !(binanceBtcUsdt > 0) ||
    !(fxUsdKrw > 0)
  ) {
    return null;
  }

  const upbitInUsd = upbitBtcKrw / fxUsdKrw;
  const rawPct = ((upbitInUsd - binanceBtcUsdt) / binanceBtcUsdt) * 100;
  const traditionalKimchi = p1(rawPct);

  if (process.env.NODE_ENV === "development") {
    console.log("[market-signals/traditionalKimchi]", {
      upbitBtcKrw,
      binanceBtcUsdt,
      fxUsdKrw,
      upbitInUsd,
      rawPct,
      traditionalKimchi,
    });
  }

  return traditionalKimchi;
}

// ─────────────────────────── BMB 계산 ───────────────────────────

function computeVolumeProfile(candles: Candle[], buckets: number): {
  byPrice: VolumeBucket[];
  byPct: VolumeBucket[];
} {
  const lows = candles.map((c) => c.l);
  const highs = candles.map((c) => c.h);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const totalVol = candles.reduce((s, c) => s + (Number.isFinite(c.v) ? c.v : 0), 0);

  const bucketVols = new Array<number>(buckets).fill(0);
  const span = max - min;

  for (const c of candles) {
    const ref = c.c; // 일봉 종가 기준으로 구간 배정
    let idx: number;
    if (span <= 0) idx = 0;
    else idx = Math.min(buckets - 1, Math.max(0, Math.floor(((ref - min) / span) * buckets)));
    bucketVols[idx] += Number.isFinite(c.v) ? c.v : 0;
  }

  const step = span > 0 ? span / buckets : 0;
  const byPrice: VolumeBucket[] = bucketVols.map((vol, i) => ({
    lowPrice: u2(min + step * i),
    highPrice: u2(span > 0 ? min + step * (i + 1) : max),
    volumePct: totalVol > 0 ? p1((vol / totalVol) * 100) : 0,
  }));
  const byPct = [...byPrice].sort((a, b) => b.volumePct - a.volumePct);
  return { byPrice, byPct };
}

/** range + 현재가로 박스권/추세 판정. */
function computeBox(
  range: { min: number; max: number } | null,
  ref: number,
): BoxInfo | null {
  if (!range || !(range.min > 0)) return null;
  const widthPct = p1(((range.max - range.min) / range.min) * 100);
  const denom = range.max - range.min;
  const pricePosition =
    denom > 0 ? p1(Math.min(100, Math.max(0, ((ref - range.min) / denom) * 100))) : 0;
  return {
    bound: widthPct <= BOX_THRESHOLD ? "박스권" : "추세",
    widthPct,
    pricePosition,
  };
}

/** 매물대(volumeProfile) + 현재가로 지지/저항 도출. */
function computeSupportResistance(
  profile: VolumeBucket[],
  ref: number,
): SupportResistance | null {
  if (profile.length === 0) return null;

  const inZone = (b: VolumeBucket): boolean =>
    ref >= b.lowPrice && ref <= b.highPrice;

  const currentZone =
    profile.find(inZone) ??
    (ref < profile[0].lowPrice
      ? profile[0]
      : profile[profile.length - 1]); // 범위 밖이면 양끝 구간으로 클램프

  const above = profile.filter((b) => b.lowPrice > ref && b !== currentZone);
  const below = profile.filter((b) => b.highPrice < ref && b !== currentZone);

  const maxByPct = (arr: VolumeBucket[]): VolumeBucket | null =>
    arr.length ? arr.reduce((m, b) => (b.volumePct > m.volumePct ? b : m)) : null;

  return {
    currentZonePct: currentZone.volumePct,
    nearestResistance: maxByPct(above),
    nearestSupport: maxByPct(below),
  };
}

function computeBmb(
  candles: Candle[],
  buckets: number,
  curPrice: number | null,
): BmbSignals {
  const closes = candles.map((c) => c.c);
  const vols = candles.map((c) => c.v);
  const ref = curPrice ?? closes[closes.length - 1];

  const avgClose = (n: number): number | null =>
    closes.length >= n ? u2(mean(lastN(closes, n))) : null;
  const avgVol = (n: number): number | null =>
    vols.length >= n ? vInt(mean(lastN(vols, n))) : null;

  const rangeOf = (n: number): { min: number; max: number } | null => {
    if (candles.length < n) return null;
    const seg = lastN(candles, n);
    return {
      min: u2(Math.min(...seg.map((c) => c.l))),
      max: u2(Math.max(...seg.map((c) => c.h))),
    };
  };

  const range7 = rangeOf(7);
  const range30 = rangeOf(30);
  const range90 = rangeOf(90);

  const boxByPeriod = {
    d7: computeBox(range7, ref),
    d30: computeBox(range30, ref),
    d90: computeBox(range90, ref),
  };

  // 매물대는 받을 수 있는 전체 이력 사용(가격 평균/박스권은 위에서 단기 유지).
  const { byPrice, byPct } =
    candles.length > 0
      ? computeVolumeProfile(candles, buckets)
      : { byPrice: [], byPct: [] };

  const supportResistance = computeSupportResistance(byPrice, ref);

  const currentBucketIndex = (() => {
    if (byPrice.length === 0) return null;
    const idx = byPrice.findIndex(
      (b) => ref >= b.lowPrice && ref <= b.highPrice,
    );
    if (idx >= 0) return idx;
    return ref < byPrice[0].lowPrice ? 0 : byPrice.length - 1;
  })();

  // 거래량: 오늘(진행 중)은 마지막 캔들, 전일(완료)은 그 직전 캔들.
  const volToday = vols.length ? vInt(vols[vols.length - 1]) : null;
  const volPrevDay = vols.length >= 2 ? vInt(vols[vols.length - 2]) : null;

  return {
    avg7: avgClose(7),
    avg30: avgClose(30),
    avg90: avgClose(90),
    range7,
    range30,
    range90,
    volToday,
    volPrevDay,
    volAvg7: avgVol(7),
    volAvg30: avgVol(30),
    volAvg90: avgVol(90),
    volumeProfile: byPrice,
    volumeProfileByPct: byPct,
    profileDays: candles.length,
    profileFrom: candles.length ? fmtKstDate(candles[0].t) : null,
    profileTo: candles.length ? fmtKstDate(candles[candles.length - 1].t) : null,
    currentBucketIndex,
    box: boxByPeriod.d30,
    boxByPeriod,
    supportResistance,
  };
}

// ─────────────────────────── BTC 계산 ───────────────────────────

function computeBtc(candles: Candle[]): BtcSignals {
  const closes = candles.map((c) => c.c);
  const cur = closes[closes.length - 1];

  const chgN = (n: number): number | null => {
    const idx = closes.length - 1 - n;
    if (idx < 0) return null;
    const past = closes[idx];
    if (!(past > 0)) return null;
    return p1(((cur - past) / past) * 100);
  };

  let ma200: number | null = null;
  let ma200Above: boolean | null = null;
  let ma200Position: number | null = null;
  if (closes.length >= 200) {
    const m = mean(lastN(closes, 200));
    ma200 = u2(m);
    ma200Above = cur >= m;
    ma200Position = m > 0 ? p1(((cur - m) / m) * 100) : null;
  }

  let bollinger20: BtcSignals["bollinger20"] = null;
  if (closes.length >= 20) {
    const seg = lastN(closes, 20);
    const mid = mean(seg);
    const variance = mean(seg.map((c) => (c - mid) ** 2));
    const sd = Math.sqrt(variance);
    const upper = mid + 2 * sd;
    const lower = mid - 2 * sd;
    const denom = upper - lower;
    const position =
      denom > 0 ? p1(Math.min(100, Math.max(0, ((cur - lower) / denom) * 100))) : 50;
    bollinger20 = { upper: u2(upper), mid: u2(mid), lower: u2(lower), position };
  }

  return {
    price: Number.isFinite(cur) ? u2(cur) : null,
    chg7: chgN(7),
    chg30: chgN(30),
    chg90: chgN(90),
    ma200,
    ma200Above,
    ma200Position,
    bollinger20,
  };
}

// ─────────────────────────── 신호등 판정 ───────────────────────────

function computeSignal(
  lastPrice: number | null,
  bmb: BmbSignals | null,
  btcChg7: number | null,
): { status: MarketStatus; reasons: string[] } {
  const reasons: string[] = [];

  if (lastPrice == null || !bmb || bmb.avg7 == null || bmb.avg30 == null) {
    reasons.push("시장 데이터 일부가 누락되어 신호등 판정을 보류합니다.");
    return { status: "yellow", reasons };
  }

  const dev7 = (Math.abs(lastPrice - bmb.avg7) / bmb.avg7) * 100;
  const dev30 = (Math.abs(lastPrice - bmb.avg30) / bmb.avg30) * 100;
  const maxDev = Math.max(dev7, dev30);

  // 비교 기준: 전일(완료) 거래량. 오늘(진행 중)은 미완료라 평균과 직접 비교하지 않음.
  const volRatio7 =
    bmb.volPrevDay != null && bmb.volAvg7 != null && bmb.volAvg7 > 0
      ? bmb.volPrevDay / bmb.volAvg7
      : null;
  const volRatio30 =
    bmb.volPrevDay != null && bmb.volAvg30 != null && bmb.volAvg30 > 0
      ? bmb.volPrevDay / bmb.volAvg30
      : null;

  const T = SIGNAL_THRESHOLDS;

  // 적색 조건
  const isRedDev = maxDev > T.redDeviationPct;
  const isRedBtc = btcChg7 != null && btcChg7 <= T.btcCrashChg7Pct;
  const isRedVol = volRatio30 != null && volRatio30 >= T.extremeVolumeRatio;

  if (isRedDev || isRedBtc || isRedVol) {
    if (isRedDev)
      reasons.push(`현재가가 7·30일 평균 대비 ${p1(maxDev)}%로 크게 괴리되어 있습니다.`);
    if (isRedBtc)
      reasons.push(`BTC 7일 등락이 ${fmt(btcChg7, "%")}로 급락했습니다.`);
    if (isRedVol)
      reasons.push(
        `전일 거래량이 30일 평균의 ${Math.round((volRatio30 as number) * 100)}%로 급변했습니다.`,
      );
    return { status: "red", reasons };
  }

  // 황색 조건
  const isYellowDev = maxDev > T.greenDeviationPct;
  const isYellowVol = volRatio7 != null && volRatio7 < T.lowVolumeRatio;

  if (isYellowDev || isYellowVol) {
    if (isYellowDev)
      reasons.push(`현재가가 7·30일 평균 대비 ${p1(maxDev)}% 괴리되어 있습니다.`);
    if (isYellowVol)
      reasons.push(
        `전일 거래량이 7일 평균의 ${Math.round((volRatio7 as number) * 100)}%로 희박합니다.`,
      );
    return { status: "yellow", reasons };
  }

  // 녹색
  reasons.push(`현재가가 7·30일 평균과 ±${T.greenDeviationPct}% 이내로 안정적입니다.`);
  if (volRatio7 != null)
    reasons.push(`전일 거래량이 7일 평균의 ${Math.round(volRatio7 * 100)}% 수준으로 양호합니다.`);
  return { status: "green", reasons };
}

// ─────────────────────────── 분석 요청 텍스트 ───────────────────────────

function buildAnalysisText(r: {
  lastPrice: number | null;
  lastPriceKrw: number | null;
  bmb: BmbSignals | null;
  btc: BtcSignals | null;
  env: MarketEnv;
  asOf: Date;
}): string {
  const { lastPrice, lastPriceKrw, bmb, btc, env, asOf } = r;

  const rangeText = (rg: { min: number; max: number } | null): string =>
    rg ? `${fmt(rg.min, "", 2)}~${fmt(rg.max, "", 2)}` : "—";

  const boxPeriodText = (label: string, box: BoxInfo | null): string =>
    box
      ? `${label} ±${fmt(box.widthPct, "%")}(${box.bound},위치${fmt(box.pricePosition, "%")})`
      : `${label} —`;

  const boxText = bmb?.boxByPeriod
    ? [
        boxPeriodText("7일", bmb.boxByPeriod.d7),
        boxPeriodText("30일", bmb.boxByPeriod.d30),
        boxPeriodText("90일", bmb.boxByPeriod.d90),
      ].join(" / ")
    : "—";

  const zoneText = (b: VolumeBucket | null): string =>
    b ? `${fmt(b.lowPrice, "", 2)}~${fmt(b.highPrice, "", 2)}(${fmt(b.volumePct, "%")})` : "—";

  const profileText = (() => {
    const sr = bmb?.supportResistance;
    if (!sr) return "—";
    const period =
      bmb && bmb.profileFrom && bmb.profileTo
        ? `전체 ${bmb.profileDays}일(${bmb.profileFrom}~${bmb.profileTo}) 기준. `
        : "";
    return [
      `${period}현재가가 속한 구간 거래량 비중 ${fmt(sr.currentZonePct, "%")}.`,
      `위쪽 최대매물대 ${zoneText(sr.nearestResistance)}, 아래쪽 최대매물대 ${zoneText(sr.nearestSupport)}`,
    ].join(" ");
  })();

  const ma200Text = btc
    ? btc.ma200Above == null
      ? "200일선 데이터 부족"
      : `200일선 ${btc.ma200Above ? "위" : "아래"}`
    : "—";
  const bollText = btc?.bollinger20 ? `볼린저 위치 ${fmt(btc.bollinger20.position, "%")}` : "볼린저 데이터 부족";

  const fgText = env.fearGreed
    ? `${env.fearGreed.value} (${env.fearGreed.classification})`
    : "—";
  const kimchiText = fmtPctSigned(env.kimchiPremium);
  const traditionalKimchiText = fmtPctSigned(env.traditionalKimchi);
  const fxText = env.fxUsdKrw != null ? fmt(env.fxUsdKrw, "원", 0) : "—";

  const btcPriceText = (() => {
    if (!btc || btc.price == null) return "—";
    let s = fmt(btc.price, " USDT", 2);
    if (btc.ma200 != null && btc.ma200Position != null) {
      s += ` (200일선 ${fmt(btc.ma200, "", 0)} 대비 ${fmtPctSigned(btc.ma200Position)})`;
    }
    return s;
  })();

  return [
    "[BMB OTC 거래 분석 요청]",
    `※ 아래 수치는 ${fmtKstMinute(asOf)} 기준 실측 데이터임.`,
    "",
    "■ 현재 시세",
    `- 현재가: ${fmt(lastPrice, " USDT", 2)} (${lastPriceKrw != null ? `${fmt(lastPriceKrw, "원", 0)}` : "—"})`,
    "- 호가 평단가: (계산기 입력값 — 자리표시)",
    "- 거래 수량/방향: (계산기 입력값 — 자리표시)",
    "",
    "■ BMB 지표",
    `- 평균 7/30/90일: ${fmt(bmb?.avg7 ?? null, "", 2)} / ${fmt(bmb?.avg30 ?? null, "", 2)} / ${fmt(bmb?.avg90 ?? null, "", 2)} USDT`,
    `- 변동폭 7/30/90일: ${rangeText(bmb?.range7 ?? null)} / ${rangeText(bmb?.range30 ?? null)} / ${rangeText(bmb?.range90 ?? null)} USDT`,
    `- 거래량 오늘(진행중): ${fmt(bmb?.volToday ?? null, "", 0)} BMB (미완료라 평균과 직접 비교 금지)`,
    `- 거래량 전일(완료)/7/30/90일평균: ${fmt(bmb?.volPrevDay ?? null, "", 0)} / ${fmt(bmb?.volAvg7 ?? null, "", 0)} / ${fmt(bmb?.volAvg30 ?? null, "", 0)} / ${fmt(bmb?.volAvg90 ?? null, "", 0)} BMB`,
    `- 박스권: ${boxText}`,
    `- 매물대: ${profileText}`,
    "",
    "■ 시장 환경",
    `- BTC 현재가: ${btcPriceText}`,
    `- BTC 7/30/90일 등락: ${fmt(btc?.chg7 ?? null, "%")} / ${fmt(btc?.chg30 ?? null, "%")} / ${fmt(btc?.chg90 ?? null, "%")}`,
    `- BTC ${ma200Text} / ${bollText}`,
    `- 공포·탐욕: ${fgText}`,
    `- 김치프리미엄(USDT 기준): ${kimchiText}`,
    `- 전통 김치프리미엄(공식환율 ${fxText}): ${traditionalKimchiText}`,
    "",
    "■ 분석 요청",
    "위 데이터와 함께 최근 시장 뉴스·거시 이벤트도 검색해서,",
    "이 거래를 받아도 될지·적정가·적정 수수료(마진)·조작 위험을 분석해줘.",
    `위 수치는 확정된 실측값이니 이를 기준으로 분석하고, 뉴스·거시는 ${fmtKstYearMonth(asOf)} 현재 시점 기준으로만 검색해줘.`,
    "※ 우리는 OTC 중개자다. 위 '손님가'는 우리가 손님에게 제시하는 가격이며, 우리가 직접 그 가격에 시장에서 사고파는 것이 아니다. 구매자 모드=손님에게 파는 가격(비쌀수록 우리 유리), 판매자 모드=손님에게서 사는 가격(쌀수록 우리 유리). 이 관점으로 분석할 것.",
  ].join("\n");
}

// ─────────────────────────── 캐시 + 엔트리포인트 ───────────────────────────

interface CacheEntry {
  data: MarketSignalsResult;
  at: number;
}
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<MarketSignalsResult>>();

function clampBuckets(buckets?: number): number {
  if (!buckets || !Number.isFinite(buckets)) return DEFAULT_BUCKETS;
  return Math.min(MAX_BUCKETS, Math.max(MIN_BUCKETS, Math.round(buckets)));
}

async function computeAll(buckets: number): Promise<MarketSignalsResult> {
  const [
    bmbCandles,
    btcCandles,
    lastPrice,
    usdtKrw,
    fearGreed,
    upbitBtcKrw,
    binanceBtcUsdt,
    fxUsdKrw,
  ] = await Promise.all([
    fetchKlines("bmb_usdt", 2000),
    fetchKlines("btc_usdt", 220),
    fetchTickerPrice().catch(() => null),
    fetchUsdtKrw().catch(() => null),
    fetchFearGreed(),
    fetchUpbitBtcKrw(),
    fetchBinanceBtcUsdt(),
    getFxUsdKrw().catch(() => null),
  ]);

  const failed: string[] = [];
  if (!bmbCandles) failed.push("bmb");
  if (!btcCandles) failed.push("btc");
  if (lastPrice == null) failed.push("lastPrice");
  if (usdtKrw == null) failed.push("usdtKrw");
  if (!fearGreed) failed.push("fearGreed");

  const bmb = bmbCandles ? computeBmb(bmbCandles, buckets, lastPrice) : null;
  const btc = btcCandles ? computeBtc(btcCandles) : null;

  const kimchiPremium = computeKimchiPremium(upbitBtcKrw, binanceBtcUsdt, usdtKrw);
  if (kimchiPremium == null) failed.push("kimchi");

  const traditionalKimchi = computeTraditionalKimchi(
    upbitBtcKrw,
    binanceBtcUsdt,
    fxUsdKrw,
  );
  if (fxUsdKrw == null) failed.push("fxRate");

  const env: MarketEnv = {
    fearGreed,
    kimchiPremium,
    traditionalKimchi,
    fxUsdKrw: fxUsdKrw != null ? krw(fxUsdKrw) : null,
  };
  const lastPriceKrw =
    lastPrice != null && usdtKrw != null ? krw(lastPrice * usdtKrw) : null;

  const { status, reasons } = computeSignal(lastPrice, bmb, btc?.chg7 ?? null);

  const now = new Date();
  const analysisText = buildAnalysisText({
    lastPrice,
    lastPriceKrw,
    bmb,
    btc,
    env,
    asOf: now,
  });

  return {
    bmb,
    btc,
    env,
    lastPrice: lastPrice != null ? u2(lastPrice) : null,
    lastPriceKrw,
    usdtKrw: usdtKrw != null ? krw(usdtKrw) : null,
    marketStatus: status,
    reasons,
    analysisText,
    partial: failed.length > 0,
    failed,
    asOf: now.toISOString(),
  };
}

/**
 * 시장 지표 전체를 반환. 5분 TTL 인메모리 캐시 + in-flight 중복 제거.
 * @param buckets 매물대 구간 수(기본 10, 4~20)
 */
export async function getMarketSignals(buckets?: number): Promise<MarketSignalsResult> {
  const n = clampBuckets(buckets);
  const key = `signals:${n}`;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.data;
  }

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const data = await computeAll(n);
      cache.set(key, { data, at: Date.now() });
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
