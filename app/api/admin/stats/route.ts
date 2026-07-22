import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-guard";
import { getAdminScopes } from "@/lib/admin-scope-guard";
import { computeAdminStats } from "@/lib/admin-stats";
import { allowedCommentTypesForScopes } from "@/lib/order-comments";

export const runtime = "nodejs";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    // Step 28: 벨 배지(commentUnread)는 운영자 스코프 종류만 집계(스코프 누수 방지)
    const scopes = await getAdminScopes(admin.adminUserId);
    const stats = await computeAdminStats(
      admin.adminUserId,
      allowedCommentTypesForScopes(scopes),
    );
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
