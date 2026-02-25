import { NextResponse } from "next/server";

export async function GET() {
  try {
    // LBANK에서 BMB/USDT 가격 가져오기
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
      const bmbUsdtPrice = parseFloat(lbankData.data[0].price);

      // USDT/KRW 가격 가져오기 (BMB/KRW 계산용)
      let usdtKrwPrice: number | null = null;
      
      // Bithumb에서 시도
      try {
        const bithumbResponse = await fetch(
          "https://api.bithumb.com/public/ticker/USDT_KRW",
          {
            next: { revalidate: 30 },
          }
        );

        if (bithumbResponse.ok) {
          const bithumbData = await bithumbResponse.json();
          if (bithumbData && bithumbData.data && bithumbData.data.closing_price) {
            usdtKrwPrice = parseFloat(
              bithumbData.data.closing_price.replace(/,/g, "")
            );
          }
        }
      } catch (error) {
        console.error("Bithumb API 오류:", error);
      }

      // Bithumb 실패 시 Upbit에서 시도
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
            }
          }
        } catch (error) {
          console.error("Upbit API 오류:", error);
        }
      }

      // BMB/KRW 가격 계산
      const bmbKrwPrice = usdtKrwPrice ? usdtKrwPrice * bmbUsdtPrice : null;

      return NextResponse.json(
        {
          price: bmbKrwPrice, // BMB/KRW 가격 (원)
          usdtPrice: bmbUsdtPrice, // BMB/USDT 가격
          usdtKrwPrice: usdtKrwPrice, // USDT/KRW 가격 (원)
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } else {
      throw new Error("LBANK API 응답 구조가 예상과 다릅니다.");
    }
  } catch (error) {
    console.error("Error fetching BMB price:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json(
      {
        error: "BMB 가격 정보를 불러올 수 없습니다.",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        price: null,
        usdtPrice: null,
        usdtKrwPrice: null,
      },
      { status: 500 }
    );
  }
}
