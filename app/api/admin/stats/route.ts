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
    const [
      total,
      pending,
      contacted,
      verified,
      completed,
      canceled,
      otcGrouped,
      ledger,
    ] = await Promise.all([
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
      prisma.otcRequest.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.paperWalletLedger.groupBy({
        by: ["type"],
        _sum: { count: true },
      }),
    ]);

    const active = total - completed - canceled;

    const otcCount = (status: string) =>
      otcGrouped.find((g) => g.status === status)?._count._all ?? 0;
    const otcTotal = otcGrouped.reduce((sum, g) => sum + g._count._all, 0);

    const walletIn = ledger.find((g) => g.type === "IN")?._sum.count ?? 0;
    const walletOut = ledger.find((g) => g.type === "OUT")?._sum.count ?? 0;

    return NextResponse.json({
      ok: true,
      stats: {
        // 10모 (flat — AdminShell 배지 등 기존 소비처 호환)
        total,
        pending,
        contacted,
        verified,
        completed,
        canceled,
        active,
        // BMB 구매·판매(OtcRequest) 상태별
        otc: {
          total: otcTotal,
          pending: otcCount("PENDING"),
          contacted: otcCount("CONTACTED"),
          agreed: otcCount("AGREED"),
          completed: otcCount("COMPLETED"),
          canceled: otcCount("CANCELED"),
        },
        // 종이지갑 재고
        walletStock: walletIn - walletOut,
        walletIn,
        walletOut,
      },
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
