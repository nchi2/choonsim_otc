import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

const MAX_BODY_LEN = 2000;

async function parseId(
  params: Promise<{ id: string }>,
): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** 본인 코멘트만 수정/삭제 가능. */
async function findOwnComment(id: number, adminUserId: number) {
  const comment = await prisma.orderComment.findUnique({
    where: { id },
    select: { id: true, authorId: true },
  });
  if (!comment) return { error: "코멘트를 찾을 수 없습니다.", status: 404 };
  if (comment.authorId !== adminUserId) {
    return { error: "본인 코멘트만 수정/삭제할 수 있습니다.", status: 403 };
  }
  return { comment };
}

export async function PATCH(
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

  const id = await parseId(ctx.params);
  if (id == null) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  let json: Record<string, unknown>;
  try {
    json = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const body = typeof json.body === "string" ? json.body.trim() : "";
  if (!body || body.length > MAX_BODY_LEN) {
    return NextResponse.json(
      { ok: false, error: `내용은 1~${MAX_BODY_LEN}자여야 합니다.` },
      { status: 400 },
    );
  }

  try {
    const own = await findOwnComment(id, admin.adminUserId);
    if ("error" in own) {
      return NextResponse.json(
        { ok: false, error: own.error },
        { status: own.status },
      );
    }

    await prisma.orderComment.update({
      where: { id },
      data: { body, editedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/comments/:id] patch failed", id, code);
    return NextResponse.json(
      { ok: false, error: "수정에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

  const id = await parseId(ctx.params);
  if (id == null) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    const own = await findOwnComment(id, admin.adminUserId);
    if ("error" in own) {
      return NextResponse.json(
        { ok: false, error: own.error },
        { status: own.status },
      );
    }

    await prisma.orderComment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/comments/:id] delete failed", id, code);
    return NextResponse.json(
      { ok: false, error: "삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
