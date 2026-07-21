import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Step 16: 네비·대시보드 분기용 스코프 노출. 조회 실패 시 전원 true(가용성 우선 — 게이트 기본값과 일관).
  let manageOtc = true;
  let manageEducation = true;
  try {
    const row = await prisma.adminUser.findUnique({
      where: { id: user.adminUserId },
      select: { manageOtc: true, manageEducation: true },
    });
    if (row) {
      manageOtc = row.manageOtc;
      manageEducation = row.manageEducation;
    }
  } catch (err) {
    console.error("[admin/auth/me] scope lookup failed", err);
  }

  return NextResponse.json({
    ok: true,
    adminUserId: user.adminUserId,
    username: user.username,
    displayName: user.displayName,
    manageOtc,
    manageEducation,
  });
}
