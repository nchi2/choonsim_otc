import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import { computeWalletTotals } from "@/lib/wallet-inventory";

export const runtime = "nodejs";

// 수령 취소 — 발주(RECEIVED) → PENDING + 연결 IN 원장 삭제 + linkedLedgerId=null. 한 트랜잭션.
// ★ 연결 IN을 삭제하면 stock이 그만큼 줄어든다. 그 지갑이 이미 OUT으로 불출됐다면
//   삭제 후 stock이 음수가 될 수 있으므로, 삭제 후 stock < 0이면 거부한다(먼저 불출 정정 필요).
export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.paperWalletLedger.findUnique({
        where: { id },
        select: { id: true, type: true, status: true, linkedLedgerId: true },
      });
      if (!order) {
        return { error: "기록을 찾을 수 없습니다.", status: 404 } as const;
      }
      if (order.type !== "ORDER") {
        return {
          error: "발주(ORDER) 기록만 수령 취소할 수 있습니다.",
          status: 400,
        } as const;
      }
      if (order.status !== "RECEIVED") {
        return {
          error: "입고 확정된(RECEIVED) 발주만 수령 취소할 수 있습니다.",
          status: 400,
        } as const;
      }

      // 연결 IN 원장 조회 (없으면 IN 삭제 없이 상태만 되돌림)
      let linkedInCount = 0;
      if (order.linkedLedgerId != null) {
        const linked = await tx.paperWalletLedger.findUnique({
          where: { id: order.linkedLedgerId },
          select: { id: true, type: true, count: true },
        });
        if (linked && linked.type === "IN") {
          linkedInCount = linked.count;

          // ★ 음수 재고 가드 — 이 IN을 지우면 stock이 음수가 되는지 검사
          const grouped = await tx.paperWalletLedger.groupBy({
            by: ["type"],
            where: { type: { in: ["IN", "OUT"] } },
            _sum: { count: true },
          });
          const inTotal =
            grouped.find((g) => g.type === "IN")?._sum.count ?? 0;
          const outTotal =
            grouped.find((g) => g.type === "OUT")?._sum.count ?? 0;
          const stockAfter = inTotal - outTotal - linkedInCount;
          if (stockAfter < 0) {
            return {
              error: `수령 취소 시 재고가 ${stockAfter}장(음수)이 됩니다. 이 입고분 중 ${-stockAfter}장이 이미 불출된 것으로 보입니다. 먼저 관련 불출(OUT)을 정정하세요.`,
              status: 409,
            } as const;
          }

          await tx.paperWalletLedger.delete({ where: { id: linked.id } });
        }
      }

      await tx.paperWalletLedger.update({
        where: { id: order.id },
        data: { status: "PENDING", linkedLedgerId: null },
      });

      return { deletedInCount: linkedInCount } as const;
    });

    if ("error" in result) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status },
      );
    }

    const totals = await computeWalletTotals();
    return NextResponse.json({
      ok: true,
      deletedInCount: result.deletedInCount,
      totals,
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/wallet-inventory/:id/unreceive] failed", id, code);
    return NextResponse.json(
      { ok: false, error: "수령 취소에 실패했습니다." },
      { status: 500 },
    );
  }
}
