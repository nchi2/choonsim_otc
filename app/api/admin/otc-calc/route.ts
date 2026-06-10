import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-guard";
import {
  fetchAsks,
  fetchTickerPrice,
  fetchUsdtKrw,
  vwapForQuantity,
} from "@/lib/otc-orderbook";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const quantity = Number(searchParams.get("quantity") ?? "10");

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json(
      { ok: false, error: "수량은 양의 정수여야 합니다." },
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

    let vwap: number;
    let totalUsdt: number;
    let levels: { price: number; size: number; filledQty: number }[] = [];
    let source: "orderbook" | "ticker" = "orderbook";

    if (asks && asks.length) {
      const result = vwapForQuantity(asks, quantity);
      vwap = result.vwap;
      totalUsdt = result.totalUsdt;
      levels = result.levels;
    } else {
      const ticker = await fetchTickerPrice();
      if (ticker == null) {
        return NextResponse.json(
          { ok: false, error: "호가 데이터를 불러올 수 없습니다." },
          { status: 503 },
        );
      }
      vwap = ticker;
      totalUsdt = ticker * quantity;
      source = "ticker";
    }

    if (usdtKrw == null) {
      return NextResponse.json(
        { ok: false, error: "USDT 환율을 불러올 수 없습니다." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      quantity,
      levels,
      vwap,
      totalUsdt,
      usdtKrw,
      totalKrw: Math.round(totalUsdt * usdtKrw),
      vwapKrw: Math.round(vwap * usdtKrw),
      source,
      asOf: new Date().toISOString(),
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/otc-calc] failed", code);
    return NextResponse.json(
      { ok: false, error: "계산에 실패했습니다." },
      { status: 500 },
    );
  }
}
