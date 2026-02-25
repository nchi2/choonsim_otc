import { NextResponse } from "next/server";

interface ChartDataPoint {
  time: number; // timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "1day"; // 1min, 5min, 15min, 30min, 1hour, 1day, 1week
    const size = searchParams.get("size") || "100"; // 데이터 개수

    // LBank Kline API 호출
    const lbankResponse = await fetch(
      `https://api.lbkex.com/v2/supplement/kline.do?symbol=bmb_usdt&type=${period}&size=${size}`,
      {
        next: { revalidate: 60 }, // 1분 캐시
      }
    );

    if (!lbankResponse.ok) {
      throw new Error(`LBANK API error: ${lbankResponse.status}`);
    }

    const lbankData = await lbankResponse.json();

    // 응답 데이터 검증 및 변환
    if (lbankData && lbankData.data && Array.isArray(lbankData.data)) {
      // USDT/KRW 가격 가져오기 (BMB/KRW 계산용)
      let usdtKrwPrice: number | null = null;

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
            usdtKrwPrice = parseFloat(
              bithumbData.data.closing_price.replace(/,/g, "")
            );
          }
        }
      } catch (error) {
        console.error("Bithumb API 오류:", error);
      }

      // Upbit fallback
      if (usdtKrwPrice === null) {
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
              usdtKrwPrice = upbitData[0].trade_price;
            }
          }
        } catch (error) {
          console.error("Upbit API 오류:", error);
        }
      }

      // LBank 데이터를 차트 형식으로 변환
      const chartData: ChartDataPoint[] = lbankData.data
        .map((item: any) => {
          // LBank 응답 형식: [timestamp, open, high, low, close, volume]
          const [timestamp, open, high, low, close, volume] = item;

          // USDT 가격을 KRW로 변환
          const convertToKrw = (usdtPrice: number) => {
            return usdtKrwPrice ? usdtPrice * usdtKrwPrice : usdtPrice;
          };

          return {
            time: timestamp,
            open: convertToKrw(parseFloat(open)),
            high: convertToKrw(parseFloat(high)),
            low: convertToKrw(parseFloat(low)),
            close: convertToKrw(parseFloat(close)),
            volume: parseFloat(volume),
          };
        })
        .reverse(); // 시간순 정렬 (오래된 것부터)

      return NextResponse.json({
        data: chartData,
        period,
        usdtKrwPrice,
      });
    } else {
      throw new Error("LBANK API 응답 구조가 예상과 다릅니다.");
    }
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
