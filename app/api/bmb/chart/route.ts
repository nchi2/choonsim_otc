import { NextResponse } from "next/server";
import { fetchCcapi, getCcapiKlinesUrl } from "@/lib/ccapi-fetch";

interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const LBANK_PERIOD_TO_CCAPI: Record<string, string> = {
  "1min": "1m",
  "5min": "5m",
  "15min": "15m",
  "30min": "30m",
  "1hour": "1h",
  "1day": "1d",
  "1week": "1w",
};

/** 내부 period → LBANK kline `type` (문서: minute1, day1, week1 …) */
const LBANK_PERIOD_TO_TYPE: Record<string, string> = {
  "1min": "minute1",
  "5min": "minute5",
  "15min": "minute15",
  "30min": "minute30",
  "1hour": "hour1",
  "1day": "day1",
  "1week": "week1",
};

/** LBANK kline `type`별 봉 길이(초) — time = now - size * barSeconds */
const LBANK_BAR_SECONDS: Record<string, number> = {
  minute1: 60,
  minute5: 300,
  minute15: 900,
  minute30: 1800,
  hour1: 3600,
  day1: 86_400,
  week1: 604_800,
};

function clampLbankSize(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 100;
  return Math.min(n, 2000);
}

/** LBANK time: 조회 시작 시각(초). size개 봉이 현재에 가깝게 나오도록 과거로 offset. */
function getLbankKlineTimeSeconds(lbankType: string, barCount: number): number {
  const barSec = LBANK_BAR_SECONDS[lbankType] ?? LBANK_BAR_SECONDS.day1;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec - barCount * barSec;
}

function parseLbankKlineRows(
  rows: unknown[][],
  convertToKrw: (usdtPrice: number) => number,
): ChartDataPoint[] {
  return rows
    .map((item) => {
      const [timestamp, open, high, low, close, volume] = item;
      return {
        time: Number(timestamp),
        open: convertToKrw(parseFloat(String(open))),
        high: convertToKrw(parseFloat(String(high))),
        low: convertToKrw(parseFloat(String(low))),
        close: convertToKrw(parseFloat(String(close))),
        volume: parseFloat(String(volume)),
      };
    })
    .filter(
      (p) =>
        Number.isFinite(p.time) &&
        Number.isFinite(p.open) &&
        Number.isFinite(p.close),
    )
    .reverse();
}

async function fetchUsdtKrwPrice(): Promise<number | null> {
  try {
    const bithumbResponse = await fetch(
      "https://api.bithumb.com/public/ticker/USDT_KRW",
      {
        next: { revalidate: 60 },
      }
    );

    if (bithumbResponse.ok) {
      const bithumbData = await bithumbResponse.json();
      if (bithumbData?.data?.closing_price) {
        return parseFloat(bithumbData.data.closing_price.replace(/,/g, ""));
      }
    }
  } catch (error) {
    console.error("Bithumb API 오류:", error);
  }

  try {
    const upbitResponse = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
      {
        next: { revalidate: 60 },
      }
    );

    if (upbitResponse.ok) {
      const upbitData = await upbitResponse.json();
      if (upbitData?.[0]?.trade_price) {
        return upbitData[0].trade_price;
      }
    }
  } catch (error) {
    console.error("Upbit API 오류:", error);
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "1day";
    const sizeParam = searchParams.get("size") || "100";
    const barCount = clampLbankSize(sizeParam);
    const lbankType = LBANK_PERIOD_TO_TYPE[period];

    const usdtKrwPrice = await fetchUsdtKrwPrice();
    const convertToKrw = (usdtPrice: number) =>
      usdtKrwPrice != null ? usdtPrice * usdtKrwPrice : usdtPrice;

    let chartData: ChartDataPoint[] = [];
    let usedSource: "lbank" | "ccapi" = "ccapi";

    let lbankRows: unknown[][] | null = null;

    if (lbankType) {
      const timeSec = getLbankKlineTimeSeconds(lbankType, barCount);
      const lbankUrl =
        `https://api.lbkex.com/v2/supplement/kline.do?` +
        new URLSearchParams({
          symbol: "bmb_usdt",
          type: lbankType,
          size: String(barCount),
          time: String(timeSec),
        }).toString();

      const lbankResponse = await fetch(lbankUrl, {
        next: { revalidate: 60 },
      });

      const lbankData = lbankResponse.ok ? await lbankResponse.json() : null;
      const ok =
        lbankData &&
        lbankData.result !== "false" &&
        lbankData.result !== false &&
        (lbankData.error_code == null || lbankData.error_code === 0) &&
        Array.isArray(lbankData.data) &&
        lbankData.data.length > 0;

      if (ok) {
        lbankRows = lbankData.data as unknown[][];
        console.log(
          `[bmb/chart] LBANK kline ok period=${period} type=${lbankType} size=${barCount} time=${timeSec} bars=${lbankRows.length}`,
        );
      } else {
        console.warn(
          `[bmb/chart] LBANK kline miss period=${period} type=${lbankType} http=${lbankResponse.status} msg=${lbankData?.msg ?? "n/a"}`,
        );
      }
    } else {
      console.warn(`[bmb/chart] unknown period=${period}, skipping LBANK`);
    }

    if (lbankRows) {
      chartData = parseLbankKlineRows(lbankRows, convertToKrw);
      usedSource = "lbank";
    } else {
      const interval = LBANK_PERIOD_TO_CCAPI[period] ?? "1d";
      const to = Date.now();
      const ccapiUrl = getCcapiKlinesUrl(
        "bmb_usdt",
        interval,
        to,
        barCount,
      );
      const ccapiResponse = await fetchCcapi(ccapiUrl, {
        next: { revalidate: 60 },
      });

      if (!ccapiResponse.ok) {
        throw new Error(`ccapi 차트 오류: ${ccapiResponse.status}`);
      }

      const ccapiJson = await ccapiResponse.json();
      const klines = ccapiJson?.data?.klines;
      if (!Array.isArray(klines) || klines.length === 0) {
        throw new Error("ccapi에 캔들 데이터가 없습니다.");
      }

      chartData = klines
        .map((item: { t: number; o: string; h: string; l: string; c: string; v: string }) => ({
          time: Number(item.t),
          open: convertToKrw(parseFloat(String(item.o))),
          high: convertToKrw(parseFloat(String(item.h))),
          low: convertToKrw(parseFloat(String(item.l))),
          close: convertToKrw(parseFloat(String(item.c))),
          volume: parseFloat(String(item.v)),
        }))
        .sort((a: ChartDataPoint, b: ChartDataPoint) => a.time - b.time);

      usedSource = "ccapi";
      console.log(
        `[bmb/chart] ccapi fallback period=${period} bars=${chartData.length}`,
      );
    }

    return NextResponse.json({
      data: chartData,
      period,
      usdtKrwPrice,
      source: usedSource,
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch chart data",
        details: error instanceof Error ? error.message : "Unknown error",
        data: [],
      },
      { status: 500 }
    );
  }
}
