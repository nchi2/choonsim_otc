import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-guard";
import {
  fetchAsks,
  fetchBids,
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
  const direction = searchParams.get("direction") === "sell" ? "sell" : "buy";

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
    const [book, usdtKrw, lastPrice] = await Promise.all([
      direction === "sell" ? fetchBids() : fetchAsks(),
      fetchUsdtKrw(),
      fetchTickerPrice(),
    ]);

    let vwap: number;
    let totalUsdt: number;
    let levels: { price: number; size: number; filledQty: number }[] = [];
    let source: "orderbook" | "ticker" = "orderbook";

    if (book && book.length) {
      const result = vwapForQuantity(book, quantity);
      vwap = result.vwap;
      totalUsdt = result.totalUsdt;
      levels = result.levels;
    } else {
      if (lastPrice == null) {
        return NextResponse.json(
          { ok: false, error: "호가 데이터를 불러올 수 없습니다." },
          { status: 503 },
        );
      }
      vwap = lastPrice;
      totalUsdt = lastPrice * quantity;
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
      direction,
      levels,
      vwap,
      totalUsdt,
      usdtKrw,
      totalKrw: Math.round(totalUsdt * usdtKrw),
      vwapKrw: Math.round(vwap * usdtKrw),
      lastPrice,
      lastPriceKrw: lastPrice != null ? Math.round(lastPrice * usdtKrw) : null,
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
