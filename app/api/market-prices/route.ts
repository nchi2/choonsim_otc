import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Bithumb에서 USDT/KRW 가격 가져오기
    const bithumbResponse = await fetch(
      "https://api.bithumb.com/public/ticker/USDT_KRW",
      {
        next: { revalidate: 30 }, // 30초 캐시
      }
    );
    const bithumbData = await bithumbResponse.json();
    const usdtKrwPrice = parseFloat(
      bithumbData.data.closing_price.replace(/,/g, "")
    );

    // 2. LBANK에서 BMB/USDT 가격 가져오기
    const lbankResponse = await fetch(
      "https://api.lbkex.com/v2/supplement/ticker/price.do?symbol=bmb_usdt",
      {
        next: { revalidate: 30 }, // 30초 캐시
      }
    );
    const lbankData = await lbankResponse.json();
    const bmbUsdtPrice = parseFloat(lbankData.data[0].price);

    // 3. LBANK KRW 가격 계산
    const lbankKrwPrice = usdtKrwPrice * bmbUsdtPrice;

    return NextResponse.json({
      usdtKrwPrice,
      bmbUsdtPrice,
      lbankKrwPrice,
    });
  } catch (error) {
    console.error("Error fetching market prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch market prices" },
      { status: 500 }
    );
  }
}
