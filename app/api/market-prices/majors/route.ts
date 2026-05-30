import { NextResponse } from "next/server";
import { fetchBoardMarketData } from "@/lib/market-data";

export const maxDuration = 15;

export async function GET() {
  try {
    const result = await fetchBoardMarketData();
    const items = result.bmb ? [result.bmb, ...result.majors] : result.majors;
    return NextResponse.json({
      items,
      updatedAt: new Date().toISOString(),
      source: result.source,
      ...(result.stale ? { stale: true } : {}),
      ...(Object.keys(result.errors).length > 0
        ? { errors: result.errors }
        : {}),
    });
  } catch {
    return NextResponse.json(
      {
        items: [],
        updatedAt: new Date().toISOString(),
        source: { majors: "none" as const, bmb: "none" as const },
        errors: { _global: "unavailable" },
      },
      { status: 200 },
    );
  }
}
