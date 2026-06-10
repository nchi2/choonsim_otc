import { NextResponse } from "next/server";
import {
  fetchAsks,
  fetchTickerPrice,
  fetchUsdtKrw,
  getMarginRate,
  vwapForQuantity,
} from "@/lib/otc-orderbook";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quantity = Number(searchParams.get("quantity"));

  if (!Number.isInteger(quantity) || quantity <= 0 || quantity % 10 !== 0) {
    return NextResponse.json(
      { ok: false, error: "수량은 10 단위의 양수여야 합니다." },
      { status: 400 },
    );
  }
  if (quantity > 100000) {
    return NextResponse.json(
      { ok: false, error: "수량이 너무 큽니다." },
      { status: 400 },
    );
  }

  try {
    const [asks, usdtKrw] = await Promise.all([fetchAsks(), fetchUsdtKrw()]);

    let baseUsdt: number | null = null;
    if (asks && asks.length) {
      baseUsdt = vwapForQuantity(asks, quantity).vwap;
    } else {
      baseUsdt = await fetchTickerPrice();
    }

    if (baseUsdt == null || usdtKrw == null) {
      return NextResponse.json(
        {
          ok: false,
          error: "예상 단가를 계산할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        },
        { status: 503 },
      );
    }

    // 운영 마진 반영(마진율 자체는 응답에 노출하지 않음).
    const perMoUsdt = baseUsdt * (1 + getMarginRate());
    const perMoKrw = Math.round(perMoUsdt * usdtKrw);
    const totalKrw = perMoKrw * quantity;

    return NextResponse.json({
      ok: true,
      quantity,
      pricePerMoKrw: perMoKrw,
      totalKrw,
      asOf: new Date().toISOString(),
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[miracle10/estimate] failed", code);
    return NextResponse.json(
      { ok: false, error: "예상 단가 계산에 실패했습니다." },
      { status: 500 },
    );
  }
}
