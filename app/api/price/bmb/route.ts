import { NextResponse } from "next/server";
import { fetchCcapi, getCcapiKlinesUrl } from "@/lib/ccapi-fetch";

async function resolveBmbUsdtPrice(): Promise<number | null> {
  try {
    const lbankResponse = await fetch(
      "https://api.lbkex.com/v2/supplement/ticker/price.do?symbol=bmb_usdt",
      {
        next: { revalidate: 30 },
      }
    );

    if (lbankResponse.ok) {
      const lbankData = await lbankResponse.json();
      const lbankUnsupported =
        lbankData?.result === "false" ||
        lbankData?.result === false ||
        (lbankData?.error_code != null && lbankData.error_code !== 0);

      if (
        !lbankUnsupported &&
        lbankData?.data?.[0]?.price != null
      ) {
        return parseFloat(lbankData.data[0].price);
      }
    }
  } catch (e) {
    console.error("LBANK BMB 가격 오류:", e);
  }

  try {
    const to = Date.now();
    const ccapiUrl = getCcapiKlinesUrl("bmb_usdt", "1d", to, 1);
    const ccapiResponse = await fetchCcapi(ccapiUrl, {
      next: { revalidate: 30 },
    });
    if (ccapiResponse.ok) {
      const ccapiData = await ccapiResponse.json();
      const c = ccapiData?.data?.klines?.[0]?.c;
      if (c != null) return parseFloat(String(c));
    }
  } catch (e) {
    console.error("ccapi BMB 가격 오류:", e);
  }

  return null;
}

export async function GET() {
  try {
    const bmbUsdtPrice = await resolveBmbUsdtPrice();

    if (bmbUsdtPrice != null) {
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
    }

    throw new Error("BMB/USDT 가격을 가져올 수 없습니다.");
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
