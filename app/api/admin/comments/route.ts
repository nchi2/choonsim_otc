import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import {
  isCommentTargetType,
  type CommentTargetType,
} from "@/lib/order-comments";

export const runtime = "nodejs";

const MAX_BODY_LEN = 2000;

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function parseTarget(
  targetTypeRaw: unknown,
  targetIdRaw: unknown,
): { targetType: CommentTargetType; targetId: number } | null {
  if (!isCommentTargetType(targetTypeRaw)) return null;
  const targetId =
    typeof targetIdRaw === "number" ? targetIdRaw : Number(targetIdRaw);
  if (!Number.isInteger(targetId) || targetId <= 0) return null;
  return { targetType: targetTypeRaw, targetId };
}

async function targetExists(
  targetType: CommentTargetType,
  targetId: number,
): Promise<boolean> {
  if (targetType === "MIRACLE10") {
    return (
      (await prisma.otcOrder.findUnique({
        where: { id: targetId },
        select: { id: true },
      })) != null
    );
  }
  return (
    (await prisma.otcRequest.findUnique({
      where: { id: targetId },
      select: { id: true },
    })) != null
  );
}

async function markRead(
  adminUserId: number,
  targetType: CommentTargetType,
  targetId: number,
): Promise<void> {
  const now = new Date();
  await prisma.commentReadState.upsert({
    where: {
      adminUserId_targetType_targetId: { adminUserId, targetType, targetId },
    },
    update: { lastReadAt: now },
    create: { adminUserId, targetType, targetId, lastReadAt: now },
  });
}

/** 코멘트 목록. markRead=1이면 조회 시점까지 읽음 처리(상세 열람). */
export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const target = parseTarget(
    searchParams.get("targetType"),
    searchParams.get("targetId"),
  );
  if (!target) return bad("targetType/targetId가 올바르지 않습니다.");

  try {
    const comments = await prisma.orderComment.findMany({
      where: { targetType: target.targetType, targetId: target.targetId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        editedAt: true,
        authorId: true,
        authorName: true,
        body: true,
      },
    });

    if (searchParams.get("markRead") === "1") {
      await markRead(admin.adminUserId, target.targetType, target.targetId);
    }

    return NextResponse.json({
      ok: true,
      comments,
      myAdminUserId: admin.adminUserId,
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/comments] list failed", code);
    return NextResponse.json(
      { ok: false, error: "코멘트를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

/** 코멘트 작성. 작성과 함께 해당 건 읽음 처리. */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let json: Record<string, unknown>;
  try {
    json = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const target = parseTarget(json.targetType, json.targetId);
  if (!target) return bad("targetType/targetId가 올바르지 않습니다.");

  const body = typeof json.body === "string" ? json.body.trim() : "";
  if (!body || body.length > MAX_BODY_LEN) {
    return bad(`내용은 1~${MAX_BODY_LEN}자여야 합니다.`);
  }

  try {
    if (!(await targetExists(target.targetType, target.targetId))) {
      return bad("신청을 찾을 수 없습니다.", 404);
    }

    const comment = await prisma.orderComment.create({
      data: {
        targetType: target.targetType,
        targetId: target.targetId,
        authorId: admin.adminUserId,
        authorName: admin.displayName || admin.username,
        body,
      },
      select: { id: true },
    });

    await markRead(admin.adminUserId, target.targetType, target.targetId);

    return NextResponse.json({ ok: true, id: comment.id });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/comments] create failed", code);
    return NextResponse.json(
      { ok: false, error: "코멘트 작성에 실패했습니다." },
      { status: 500 },
    );
  }
}
