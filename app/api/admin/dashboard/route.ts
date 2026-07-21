import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import { computeAdminStats } from "@/lib/admin-stats";
import { verifiedAssignedOrderWhere } from "@/lib/available-slots";
import { todayKst } from "@/lib/kst";

export const runtime = "nodejs";

/**
 * 대시보드 단일 엔드포인트 — 기존 3회 호출(stats + offices + 사무실별 reservations)을
 * 한 번으로 합친다. 기존 3개 API는 다른 화면이 쓰므로 유지.
 * 오늘 내 일정은 사무실별 N회 조회 대신 단일 쿼리(office join).
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const [stats, offices, todayOrders] = await Promise.all([
      computeAdminStats(admin.adminUserId),
      prisma.office.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          address: true,
          isActive: true,
          educationActive: true,
          sortOrder: true,
        },
      }),
      prisma.otcOrder.findMany({
        where: {
          ...verifiedAssignedOrderWhere,
          assignedAdminUserId: admin.adminUserId,
          visitDate: todayKst(),
        },
        orderBy: { reservedStart: "asc" },
        select: {
          id: true,
          reservedStart: true,
          isTest: true,
          customer: { select: { name: true } },
          office: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      offices,
      todayMySchedule: todayOrders.map((o) => ({
        orderId: o.id,
        time: o.reservedStart!,
        name: o.customer.name,
        officeName: o.office?.name ?? null,
        isTest: o.isTest,
      })),
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/dashboard] failed", code);
    return NextResponse.json(
      { ok: false, error: "대시보드 데이터를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
