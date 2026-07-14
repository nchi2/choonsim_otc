import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

async function parseId(
  params: Promise<{ id: string }>,
): Promise<number | null> {
  const { id: raw } = await params;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// 원장 행 삭제 — IN/OUT 오기입 정정용. ORDER(발주)는 삭제 대신 취소(PATCH)로 기록을 남긴다.
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

  const id = await parseId(ctx.params);
  if (id == null) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    const entry = await prisma.paperWalletLedger.findUnique({
      where: { id },
      select: { id: true, type: true },
    });
    if (!entry) {
      return NextResponse.json(
        { ok: false, error: "기록을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    if (entry.type === "ORDER") {
      return NextResponse.json(
        { ok: false, error: "발주 기록은 삭제할 수 없습니다. 취소 처리하세요." },
        { status: 400 },
      );
    }
    await prisma.paperWalletLedger.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/wallet-inventory/:id] delete failed", id, code);
    return NextResponse.json(
      { ok: false, error: "삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}

// ORDER 취소 — status PENDING → CANCELED (행 삭제 아님).
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const id = await parseId(ctx.params);
  if (id == null) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  if (body.status !== "CANCELED") {
    return NextResponse.json(
      { ok: false, error: "지원하는 변경은 발주 취소(status=CANCELED)뿐입니다." },
      { status: 400 },
    );
  }

  try {
    const entry = await prisma.paperWalletLedger.findUnique({
      where: { id },
      select: { id: true, type: true, status: true },
    });
    if (!entry) {
      return NextResponse.json(
        { ok: false, error: "기록을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    if (entry.type !== "ORDER") {
      return NextResponse.json(
        { ok: false, error: "발주(ORDER) 기록만 취소할 수 있습니다." },
        { status: 400 },
      );
    }
    if (entry.status !== "PENDING") {
      return NextResponse.json(
        { ok: false, error: "이미 처리된 발주입니다." },
        { status: 400 },
      );
    }

    await prisma.paperWalletLedger.update({
      where: { id },
      data: { status: "CANCELED" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/wallet-inventory/:id] cancel failed", id, code);
    return NextResponse.json(
      { ok: false, error: "취소에 실패했습니다." },
      { status: 500 },
    );
  }
}
