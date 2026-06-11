import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-guard";
import { getMarketSignals } from "@/lib/market-signals";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bucketsRaw = searchParams.get("buckets");
  const buckets = bucketsRaw != null ? Number(bucketsRaw) : undefined;

  try {
    const signals = await getMarketSignals(buckets);
    return NextResponse.json({ ok: true, ...signals });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/market-signals] failed", code);
    return NextResponse.json(
      { ok: false, error: "시장 지표 계산에 실패했습니다." },
      { status: 500 },
    );
  }
}
