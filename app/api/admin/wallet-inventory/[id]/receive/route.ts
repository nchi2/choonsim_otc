import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import { todayKst } from "@/lib/kst";
import { computeWalletTotals } from "@/lib/wallet-inventory";

export const runtime = "nodejs";

// 발주 입고 확정 — ORDER(PENDING) → IN 원장 생성 + RECEIVED + linkedLedgerId. 한 트랜잭션.
// 실수량이 발주량과 다를 수 있어 body.count로 덮어쓰기 허용.
export async function POST(
  request: Request,
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

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  let overrideCount: number | null = null;
  if (body.count !== undefined && body.count !== null && body.count !== "") {
    const n = typeof body.count === "number" ? body.count : Number(body.count);
    if (!Number.isInteger(n) || n <= 0 || n > 100_000) {
      return NextResponse.json(
        { ok: false, error: "장수는 1 이상 정수여야 합니다." },
        { status: 400 },
      );
    }
    overrideCount = n;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.paperWalletLedger.findUnique({
        where: { id },
        select: { id: true, type: true, status: true, count: true },
      });
      if (!order) {
        return { error: "기록을 찾을 수 없습니다.", status: 404 } as const;
      }
      if (order.type !== "ORDER") {
        return {
          error: "발주(ORDER) 기록만 입고 확정할 수 있습니다.",
          status: 400,
        } as const;
      }
      if (order.status !== "PENDING") {
        return { error: "이미 처리된 발주입니다.", status: 400 } as const;
      }

      const count = overrideCount ?? order.count;

      const inEntry = await tx.paperWalletLedger.create({
        data: {
          type: "IN",
          count,
          entryDate: todayKst(),
          memo: `발주 #${order.id} 입고${
            count !== order.count ? ` (발주 ${order.count}장 → 실수령 ${count}장)` : ""
          }`,
          adminUserId: admin.adminUserId,
          adminName: admin.displayName || admin.username,
        },
        select: { id: true },
      });

      await tx.paperWalletLedger.update({
        where: { id: order.id },
        data: { status: "RECEIVED", linkedLedgerId: inEntry.id },
      });

      return { inLedgerId: inEntry.id, count } as const;
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
      inLedgerId: result.inLedgerId,
      count: result.count,
      totals,
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/wallet-inventory/:id/receive] failed", id, code);
    return NextResponse.json(
      { ok: false, error: "입고 확정에 실패했습니다." },
      { status: 500 },
    );
  }
}
