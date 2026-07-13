import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

// 원장 행 삭제 — 오기입 정정용. 재고는 합산이므로 삭제 즉시 반영된다.
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser())) {
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
    await prisma.paperWalletLedger.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    if (code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "기록을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    console.error("[admin/wallet-inventory/:id] delete failed", id, code);
    return NextResponse.json(
      { ok: false, error: "삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
