import { NextResponse } from "next/server";
import { fetchCcapi, getCcapiKlinesUrl } from "@/lib/ccapi-fetch";

export const runtime = "nodejs";

type AskLevel = [number, number]; // [price(USDT/BMB), quantity(BMB)]

function getMarginRate(): number {
  const raw = Number(process.env.MARGIN_RATE);
  if (!Number.isFinite(raw) || raw < 0 || raw > 1) return 0.01;
  return raw;
}

async function fetchAsks(): Promise<AskLevel[] | null> {
  try {
    const res = await fetch(
      "https://api.lbkex.com/v2/depth.do?symbol=bmb_usdt&size=200",
      { next: { revalidate: 15 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const unsupported =
      data?.result === "false" ||
      data?.result === false ||
      (data?.error_code != null && data.error_code !== 0);
    if (unsupported) return null;
    const asks = data?.data?.asks;
    if (!Array.isArray(asks)) return null;
    const parsed: AskLevel[] = asks
      .map((a: unknown[]) => [Number(a?.[0]), Number(a?.[1])] as AskLevel)
      .filter(
        ([p, q]) => Number.isFinite(p) && Number.isFinite(q) && p > 0 && q > 0,
      );
    parsed.sort((a, b) => a[0] - b[0]);
    return parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

async function fetchTickerPrice(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.lbkex.com/v2/supplement/ticker/price.do?symbol=bmb_usdt",
      { next: { revalidate: 30 } },
    );
    if (res.ok) {
      const data = await res.json();
      const unsupported =
        data?.result === "false" ||
        data?.result === false ||
        (data?.error_code != null && data.error_code !== 0);
      const price = data?.data?.[0]?.price;
      if (!unsupported && price != null) return parseFloat(price);
    }
  } catch {
    /* fall through to ccapi */
  }
  try {
    const url = getCcapiKlinesUrl("bmb_usdt", "1d", Date.now(), 1);
    const res = await fetchCcapi(url, { next: { revalidate: 30 } });
    if (res.ok) {
      const data = await res.json();
      const c = data?.data?.klines?.[0]?.c;
      if (c != null) return parseFloat(String(c));
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function fetchUsdtKrw(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.bithumb.com/public/ticker/USDT_KRW",
      { next: { revalidate: 30 } },
    );
    if (res.ok) {
      const data = await res.json();
      const cp = data?.data?.closing_price;
      if (cp) return parseFloat(String(cp).replace(/,/g, ""));
    }
  } catch {
    /* try upbit */
  }
  try {
    const res = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
      { next: { revalidate: 30 } },
    );
    if (res.ok) {
      const data = await res.json();
      const tp = data?.[0]?.trade_price;
      if (tp != null) return Number(tp);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** 요청 수량을 채우는 매도호가 가중평균(VWAP). 깊이가 부족하면 마지막 호가로 잔량 채움. */
function vwapForQuantity(asks: AskLevel[], qty: number): number {
  let remaining = qty;
  let cost = 0;
  let filled = 0;
  for (const [price, available] of asks) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, available);
    cost += take * price;
    filled += take;
    remaining -= take;
  }
  if (filled === 0) return asks[0][0];
  if (remaining > 0) {
    const lastPrice = asks[asks.length - 1][0];
    cost += remaining * lastPrice;
    filled += remaining;
  }
  return cost / filled;
}

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
      baseUsdt = vwapForQuantity(asks, quantity);
    } else {
      baseUsdt = await fetchTickerPrice();
    }

    if (baseUsdt == null || usdtKrw == null) {
      return NextResponse.json(
        { ok: false, error: "예상 단가를 계산할 수 없습니다. 잠시 후 다시 시도해 주세요." },
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
