import { NextResponse } from "next/server";
import { chunsimPriceData } from "@/lib/chunsim-price-data";

interface RatioDataPoint {
  time: number; // timestamp
  btcUsdtPrice: number;
  bmbUsdtPrice: number;
  ratio: number; // BTC/BMB 비율
  date: string; // 포맷된 날짜
  source: "LBANK" | "CHUNSIM"; // 데이터 출처
}

// USDT/KRW 환율 가져오기
async function getUsdtKrwRate(): Promise<number> {
  try {
    // Bithumb에서 시도
    const bithumbResponse = await fetch(
      "https://api.bithumb.com/public/ticker/USDT_KRW",
      {
        next: { revalidate: 3600 }, // 1시간 캐시
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

  // Upbit fallback
  try {
    const upbitResponse = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
      {
        next: { revalidate: 3600 },
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

  // 기본값 (대략적인 환율)
  return 1400;
}

// 특정 날짜의 BTC/USDT 가격 가져오기 (LBANK API에서)
async function getBtcPriceForDate(date: string, btcMap: Map<number, any>): Promise<number | null> {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const targetTimestamp = targetDate.getTime();

  // 정확한 타임스탬프 찾기
  if (btcMap.has(targetTimestamp)) {
    const item = btcMap.get(targetTimestamp);
    return parseFloat(String(item.c));
  }

  // 가장 가까운 타임스탬프 찾기 (범위를 넓혀서 찾기)
  // 먼저 미래 데이터 중 가장 가까운 것 찾기
  let closestTimestamp: number | null = null;
  let minDiff = Infinity;

  for (const timestamp of btcMap.keys()) {
    const diff = timestamp - targetTimestamp;
    // 미래 데이터 중 가장 가까운 것 (30일 이내)
    if (diff >= 0 && diff < 30 * 24 * 60 * 60 * 1000 && diff < minDiff) {
      minDiff = diff;
      closestTimestamp = timestamp;
    }
  }

  // 미래 데이터가 없으면 과거 데이터 중 가장 가까운 것 찾기
  if (closestTimestamp === null) {
    for (const timestamp of btcMap.keys()) {
      const diff = targetTimestamp - timestamp;
      // 과거 데이터 중 가장 가까운 것 (30일 이내)
      if (diff >= 0 && diff < 30 * 24 * 60 * 60 * 1000 && diff < minDiff) {
        minDiff = diff;
        closestTimestamp = timestamp;
      }
    }
  }

  // 그래도 없으면 가장 가까운 것 (범위 제한 없이)
  if (closestTimestamp === null && btcMap.size > 0) {
    for (const timestamp of btcMap.keys()) {
      const diff = Math.abs(timestamp - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestTimestamp = timestamp;
      }
    }
  }

  if (closestTimestamp !== null) {
    const item = btcMap.get(closestTimestamp);
    return parseFloat(String(item.c));
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get("interval") || "1d"; // 1m, 5m, 15m, 30m, 1h, 1d, 1w
    // 기본값을 2000으로 설정 (최대한 많은 데이터, 춘심 데이터 시작일인 2023-09-10까지 커버)
    const size = searchParams.get("size") || "2000";
    // 현재 시간을 밀리초로 (to 파라미터용)
    const to = Date.now();

    // BMB/USDT와 BTC/USDT 데이터를 동시에 가져오기
    const [bmbResponse, btcResponse] = await Promise.all([
      fetch(
        `https://ccapi.rerrkvifj.com/spot-market-center/klines?symbol=bmb_usdt&interval=${interval}&to=${to}&size=${size}`,
        {
          next: { revalidate: 60 }, // 1분 캐시
        }
      ),
      fetch(
        `https://ccapi.rerrkvifj.com/spot-market-center/klines?symbol=btc_usdt&interval=${interval}&to=${to}&size=${size}`,
        {
          next: { revalidate: 60 },
        }
      ),
    ]);

    // 응답 상태 확인
    if (!bmbResponse.ok) {
      const bmbErrorText = await bmbResponse.text();
      console.error("BMB API error:", bmbResponse.status, bmbErrorText);
      throw new Error(`BMB API error: ${bmbResponse.status} - ${bmbErrorText}`);
    }

    if (!btcResponse.ok) {
      const btcErrorText = await btcResponse.text();
      console.error("BTC API error:", btcResponse.status, btcErrorText);
      throw new Error(`BTC API error: ${btcResponse.status} - ${btcErrorText}`);
    }

    const bmbData = await bmbResponse.json();
    const btcData = await btcResponse.json();

    // 응답 데이터 검증 및 상세 로깅
    console.log("BMB Data structure:", {
      hasData: !!bmbData?.data,
      hasKlines: !!bmbData?.data?.klines,
      isArray: Array.isArray(bmbData?.data?.klines),
      dataLength: bmbData?.data?.klines?.length,
      firstItem: bmbData?.data?.klines?.[0],
    });

    console.log("BTC Data structure:", {
      hasData: !!btcData?.data,
      hasKlines: !!btcData?.data?.klines,
      isArray: Array.isArray(btcData?.data?.klines),
      dataLength: btcData?.data?.klines?.length,
      firstItem: btcData?.data?.klines?.[0],
    });

    if (!bmbData?.data?.klines || !Array.isArray(bmbData.data.klines)) {
      throw new Error(
        `BMB API 응답 구조가 예상과 다릅니다. 응답: ${JSON.stringify(bmbData)}`
      );
    }

    if (!btcData?.data?.klines || !Array.isArray(btcData.data.klines)) {
      throw new Error(
        `BTC API 응답 구조가 예상과 다릅니다. 응답: ${JSON.stringify(btcData)}`
      );
    }

    // 빈 데이터 체크
    if (bmbData.data.klines.length === 0) {
      throw new Error("BMB/USDT 데이터가 없습니다.");
    }

    if (btcData.data.klines.length === 0) {
      throw new Error("BTC/USDT 데이터가 없습니다.");
    }

    // 타임스탬프를 키로 하는 맵 생성 (빠른 조회를 위해)
    const bmbMap = new Map<number, any>();
    bmbData.data.klines.forEach((item: any) => {
      if (!item || typeof item !== "object" || !item.t) {
        console.warn("Invalid BMB data item:", item);
        return;
      }
      const timestamp = Number(item.t);
      bmbMap.set(timestamp, item);
    });

    const btcMap = new Map<number, any>();
    btcData.data.klines.forEach((item: any) => {
      if (!item || typeof item !== "object" || !item.t) {
        console.warn("Invalid BTC data item:", item);
        return;
      }
      const timestamp = Number(item.t);
      btcMap.set(timestamp, item);
    });

    // 공통 타임스탬프 찾기 및 비율 계산
    const ratioData: RatioDataPoint[] = [];
    const allTimestamps = new Set([
      ...Array.from(bmbMap.keys()),
      ...Array.from(btcMap.keys()),
    ]);

    // 타임스탬프 정렬
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    sortedTimestamps.forEach((timestamp) => {
      const bmbItem = bmbMap.get(timestamp);
      const btcItem = btcMap.get(timestamp);

      // 두 데이터가 모두 있을 때만 계산
      if (bmbItem && btcItem) {
        try {
          // 새 API 응답 형식: {h, l, o, c, v, a, t}
          const bmbClose = bmbItem.c;
          const btcClose = btcItem.c;

          if (bmbClose === undefined || btcClose === undefined) {
            console.warn("Missing close price:", { bmbItem, btcItem });
            return;
          }

          const bmbPrice = parseFloat(String(bmbClose));
          const btcPrice = parseFloat(String(btcClose));

          // 유효한 숫자인지 확인
          if (isNaN(bmbPrice) || isNaN(btcPrice)) {
            console.warn("Invalid price values:", { bmbPrice, btcPrice });
            return;
          }

          // BTC/BMB 비율 계산 (BTC 가격 / BMB 가격)
          if (bmbPrice > 0) {
            const ratio = btcPrice / bmbPrice;

            // 타임스탬프는 이미 밀리초 단위
            const timestampMs = timestamp;

            ratioData.push({
              time: timestampMs,
              btcUsdtPrice: btcPrice,
              bmbUsdtPrice: bmbPrice,
              ratio,
              date: new Date(timestampMs).toISOString(),
            });
          }
        } catch (error) {
          console.error("Error processing data point:", error, { bmbItem, btcItem });
        }
      }
    });

    // 시간순 정렬 (오래된 것부터)
    ratioData.sort((a, b) => a.time - b.time);

    // LBANK 데이터에 source 추가 및 타임스탬프 맵 생성 (중복 체크용)
    const lbankRatioData: RatioDataPoint[] = ratioData.map((item) => ({
      ...item,
      source: "LBANK" as const,
    }));

    // LBANK 데이터의 타임스탬프를 Set으로 저장 (하루 단위로 정규화)
    const lbankTimestamps = new Set<number>();
    lbankRatioData.forEach((item) => {
      const date = new Date(item.time);
      date.setHours(0, 0, 0, 0);
      lbankTimestamps.add(date.getTime());
    });

    // 춘심 데이터 처리 (LBANK 데이터가 없는 날짜는 춘심 데이터로 보완)
    const usdtKrwRate = await getUsdtKrwRate();
    const chunsimRatioData: RatioDataPoint[] = [];

    for (const chunsimItem of chunsimPriceData) {
      const itemDate = new Date(chunsimItem.date);
      itemDate.setHours(0, 0, 0, 0);
      const itemTimestamp = itemDate.getTime();

      // LBANK 데이터가 없는 날짜만 춘심 데이터 사용 (중복 방지)
      if (!lbankTimestamps.has(itemTimestamp)) {
        // 원화를 USDT로 변환
        const bmbUsdtPrice = chunsimItem.averagePrice / usdtKrwRate;

        // 해당 날짜의 BTC/USDT 가격 가져오기
        let btcPrice = await getBtcPriceForDate(chunsimItem.date, btcMap);

        // BTC 가격을 찾지 못한 경우, LBANK 데이터에서 가장 오래된 BTC 가격 사용
        if (!btcPrice && btcMap.size > 0) {
          const sortedBtcTimestamps = Array.from(btcMap.keys()).sort((a, b) => a - b);
          const oldestBtcItem = btcMap.get(sortedBtcTimestamps[0]);
          if (oldestBtcItem) {
            btcPrice = parseFloat(String(oldestBtcItem.c));
          }
        }

        // BTC 가격이 있으면 데이터 추가
        if (btcPrice && bmbUsdtPrice > 0) {
          chunsimRatioData.push({
            time: itemTimestamp,
            btcUsdtPrice: btcPrice,
            bmbUsdtPrice: bmbUsdtPrice,
            ratio: btcPrice / bmbUsdtPrice,
            date: chunsimItem.date,
            source: "CHUNSIM",
          });
        }
      }
    }

    // 두 데이터 합치기 및 정렬 (LBANK 데이터 우선, 춘심 데이터로 보완)
    const allRatioData = [...lbankRatioData, ...chunsimRatioData].sort(
      (a, b) => a.time - b.time
    );

    if (allRatioData.length === 0) {
      throw new Error("계산된 비율 데이터가 없습니다.");
    }

    console.log(
      `Successfully processed ${allRatioData.length} data points (춘심: ${chunsimRatioData.length}, LBANK: ${lbankRatioData.length})`
    );

    return NextResponse.json({
      data: allRatioData,
      interval,
      size: allRatioData.length,
      latestRatio:
        allRatioData.length > 0
          ? allRatioData[allRatioData.length - 1].ratio
          : null,
      latestBtcPrice:
        allRatioData.length > 0
          ? allRatioData[allRatioData.length - 1].btcUsdtPrice
          : null,
      latestBmbPrice:
        allRatioData.length > 0
          ? allRatioData[allRatioData.length - 1].bmbUsdtPrice
          : null,
    });
  } catch (error) {
    console.error("Error fetching BTC/BMB ratio data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        error: "Failed to fetch BTC/BMB ratio data",
        details: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        data: [],
      },
      { status: 500 }
    );
  }
}

