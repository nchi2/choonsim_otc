import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-guard";
import { computeAdminStats } from "@/lib/admin-stats";

export const runtime = "nodejs";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const stats = await computeAdminStats(admin.adminUserId);
    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/stats] failed", code);
    return NextResponse.json(
      { ok: false, error: "집계를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
