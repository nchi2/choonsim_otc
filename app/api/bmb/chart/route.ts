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
    const size = searchParams.get("size") || "100";

    const usdtKrwPrice = await fetchUsdtKrwPrice();
    const convertToKrw = (usdtPrice: number) =>
      usdtKrwPrice != null ? usdtPrice * usdtKrwPrice : usdtPrice;

    let chartData: ChartDataPoint[] = [];
    let usedSource: "lbank" | "ccapi" = "lbank";

    const lbankResponse = await fetch(
      `https://api.lbkex.com/v2/supplement/kline.do?symbol=bmb_usdt&type=${period}&size=${size}`,
      {
        next: { revalidate: 60 },
      }
    );

    const lbankData = lbankResponse.ok ? await lbankResponse.json() : null;
    const lbankRows =
      lbankData &&
      Array.isArray(lbankData.data) &&
      lbankData.data.length > 0 &&
      lbankData.result !== "false" &&
      lbankData.result !== false
        ? lbankData.data
        : null;

    if (lbankRows) {
      chartData = lbankRows
        .map((item: unknown[]) => {
          const [timestamp, open, high, low, close, volume] = item as [
            number,
            string,
            string,
            string,
            string,
            string,
          ];
          return {
            time: timestamp,
            open: convertToKrw(parseFloat(open)),
            high: convertToKrw(parseFloat(high)),
            low: convertToKrw(parseFloat(low)),
            close: convertToKrw(parseFloat(close)),
            volume: parseFloat(volume),
          };
        })
        .reverse();
      usedSource = "lbank";
    } else {
      const interval = LBANK_PERIOD_TO_CCAPI[period] ?? "1d";
      const to = Date.now();
      const ccapiUrl = getCcapiKlinesUrl(
        "bmb_usdt",
        interval,
        to,
        Number.parseInt(size, 10) || 100
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
