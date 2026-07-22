import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOtcManager } from "@/lib/admin-scope-guard";
import { requireEducationManager } from "@/lib/education-admin-guard";
import {
  isCommentTargetType,
  markCommentsRead,
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
  if (targetType === "EDUCATION_EVENT") {
    return (
      (await prisma.educationEvent.findUnique({
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

// 읽음 처리는 lib/order-comments.ts markCommentsRead 공유 (상세 GET과 동일 규칙)

/** targetType별 스코프 게이트(Step 28) — 교육 코멘트는 manageEducation, OTC/10모는 manageOtc. */
async function requireScopeForTarget(targetType: CommentTargetType) {
  return targetType === "EDUCATION_EVENT"
    ? requireEducationManager()
    : requireOtcManager();
}

/** 코멘트 목록. markRead=1이면 조회 시점까지 읽음 처리(상세 열람). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = parseTarget(
    searchParams.get("targetType"),
    searchParams.get("targetId"),
  );
  if (!target) return bad("targetType/targetId가 올바르지 않습니다.");

  // Step 28: 스코프 없는 종류의 코멘트는 직접 조회도 차단(401/403)
  const gate = await requireScopeForTarget(target.targetType);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }
  const admin = gate.admin;

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
      await markCommentsRead(admin.adminUserId, target.targetType, target.targetId);
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
  let json: Record<string, unknown>;
  try {
    json = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const target = parseTarget(json.targetType, json.targetId);
  if (!target) return bad("targetType/targetId가 올바르지 않습니다.");

  // Step 28: 스코프 없는 종류에는 코멘트 작성도 차단
  const gate = await requireScopeForTarget(target.targetType);
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }
  const admin = gate.admin;

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

    await markCommentsRead(admin.adminUserId, target.targetType, target.targetId);

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
