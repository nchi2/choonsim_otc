import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderKind, OrderStatus } from "@/app/generated/prisma/client";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const base = { kind: OrderKind.MIRACLE10 };
    const [total, pending, contacted, verified, completed, canceled] =
      await Promise.all([
        prisma.otcOrder.count({ where: base }),
        prisma.otcOrder.count({
          where: { ...base, status: OrderStatus.PENDING },
        }),
        prisma.otcOrder.count({
          where: { ...base, status: OrderStatus.CONTACTED },
        }),
        prisma.otcOrder.count({
          where: { ...base, status: OrderStatus.VERIFIED },
        }),
        prisma.otcOrder.count({
          where: { ...base, status: OrderStatus.COMPLETED },
        }),
        prisma.otcOrder.count({
          where: { ...base, status: OrderStatus.CANCELED },
        }),
      ]);

    const active = total - completed - canceled;

    return NextResponse.json({
      ok: true,
      stats: { total, pending, contacted, verified, completed, canceled, active },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/stats] failed", code);
    return NextResponse.json(
      { ok: false, error: "집계를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
