import { NextResponse } from "next/server";

export async function GET() {
  try {
    let usdtKrwPrice: number | null = null;
    let bithumbError: string | null = null;

    // 1. Bithumb에서 USDT/KRW 가격 가져오기 (1차 시도)
    try {
      const bithumbResponse = await fetch(
        "https://api.bithumb.com/public/ticker/USDT_KRW",
        {
          next: { revalidate: 30 }, // 30초 캐시
        }
      );

      if (!bithumbResponse.ok) {
        throw new Error(`Bithumb API error: ${bithumbResponse.status}`);
      }

      const bithumbData = await bithumbResponse.json();

      // 응답 데이터 검증
      if (bithumbData && bithumbData.data && bithumbData.data.closing_price) {
        usdtKrwPrice = parseFloat(
          bithumbData.data.closing_price.replace(/,/g, "")
        );
      } else if (bithumbData.status === 999) {
        // 빗썸 점검 중
        bithumbError = "빗썸 거래소 점검 중";
      } else {
        bithumbError = "Bithumb API 응답 구조가 예상과 다릅니다.";
      }
    } catch (error) {
      console.error("Bithumb API 오류:", error);
      bithumbError =
        error instanceof Error ? error.message : "Bithumb API 오류";
    }

    // 2. Bithumb 실패 시 Upbit에서 USDT/KRW 가격 가져오기 (2차 시도)
    if (usdtKrwPrice === null) {
      try {
        const upbitResponse = await fetch(
          "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
          {
            next: { revalidate: 30 },
          }
        );

        if (upbitResponse.ok) {
          const upbitData = await upbitResponse.json();
          if (upbitData && upbitData[0] && upbitData[0].trade_price) {
            usdtKrwPrice = upbitData[0].trade_price;
            console.log("Upbit에서 USDT/KRW 가격 가져옴:", usdtKrwPrice);
          }
        }
      } catch (error) {
        console.error("Upbit API 오류:", error);
      }
    }

    // 3. LBANK에서 BMB/USDT 가격 가져오기
    let bmbUsdtPrice: number | null = null;
    let lbankError: string | null = null;

    try {
      const lbankResponse = await fetch(
        "https://api.lbkex.com/v2/supplement/ticker/price.do?symbol=bmb_usdt",
        {
          next: { revalidate: 30 }, // 30초 캐시
        }
      );

      if (!lbankResponse.ok) {
        throw new Error(`LBANK API error: ${lbankResponse.status}`);
      }

      const lbankData = await lbankResponse.json();

      // 응답 데이터 검증
      if (
        lbankData &&
        lbankData.data &&
        lbankData.data[0] &&
        lbankData.data[0].price
      ) {
        bmbUsdtPrice = parseFloat(lbankData.data[0].price);
      } else {
        lbankError = "LBANK API 응답 구조가 예상과 다릅니다.";
      }
    } catch (error) {
      console.error("LBANK API 오류:", error);
      lbankError = error instanceof Error ? error.message : "LBANK API 오류";
    }

    // 4. LBANK KRW 가격 계산 (USDT/KRW 가격이 있으면 계산, 없으면 null)
    let lbankKrwPrice: number | null = null;
    if (usdtKrwPrice !== null && bmbUsdtPrice !== null) {
      lbankKrwPrice = usdtKrwPrice * bmbUsdtPrice;
    }

    // 5. 응답 반환 (에러가 있어도 가능한 데이터는 반환)
    return NextResponse.json({
      usdtKrwPrice,
      bmbUsdtPrice,
      lbankKrwPrice,
      // 에러 정보 포함 (프론트엔드에서 경고 표시용)
      errors: {
        bithumb: bithumbError,
        lbank: lbankError,
      },
      // USDT/KRW 가격을 가져올 수 없었는지 여부
      hasUsdtKrwPrice: usdtKrwPrice !== null,
    });
  } catch (error) {
    console.error("Error fetching market prices:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch market prices",
        details: error instanceof Error ? error.message : "Unknown error",
        usdtKrwPrice: null,
        bmbUsdtPrice: null,
        lbankKrwPrice: null,
        hasUsdtKrwPrice: false,
      },
      { status: 500 }
    );
  }
}
