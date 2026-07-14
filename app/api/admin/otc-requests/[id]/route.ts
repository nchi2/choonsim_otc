import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { editorFieldsFromSession, getAdminUser } from "@/lib/admin-guard";
import { isOtcRequestStatus } from "@/lib/otc-request-status";
import {
  getCommentsForTarget,
  markCommentsRead,
} from "@/lib/order-comments";

export const runtime = "nodejs";

async function parseId(
  params: Promise<{ id: string }>,
): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
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
    // 코멘트를 상세 응답에 병합 (HTTP 2→1) + 상세 열람 = 읽음 처리
    const [request, commentData] = await Promise.all([
      prisma.otcRequest.findUnique({
        where: { id },
        include: { office: { select: { id: true, name: true } } },
      }),
      getCommentsForTarget(admin.adminUserId, "OTC_REQUEST", id),
    ]);
    if (!request) {
      return NextResponse.json(
        { ok: false, error: "신청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    await markCommentsRead(admin.adminUserId, "OTC_REQUEST", id);
    return NextResponse.json({
      ok: true,
      request,
      comments: commentData.comments,
      unreadCount: commentData.unreadCount,
      myAdminUserId: admin.adminUserId,
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/otc-requests/:id] detail failed", id, code);
    return NextResponse.json(
      { ok: false, error: "상세를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

// 수정 가능한 텍스트 필드 — 요청에 없으면 미변경, null이면 비우기.
const TEXT_FIELDS = [
  { key: "buyerBankName", max: 50 },
  { key: "buyerAccountNo", max: 50 },
  { key: "buyerAccountHolder", max: 50 },
  { key: "adminMemo", max: 2000 },
] as const;

type TextFieldKey = (typeof TEXT_FIELDS)[number]["key"];

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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const data: Partial<Record<TextFieldKey, string | null>> & {
    status?: string;
    isTest?: boolean;
  } = {};

  // 테스트 데이터 건별 토글
  if ("isTest" in body) {
    if (typeof body.isTest !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "isTest 값이 올바르지 않습니다." },
        { status: 400 },
      );
    }
    data.isTest = body.isTest;
  }

  if (body.status !== undefined) {
    if (!isOtcRequestStatus(body.status)) {
      return NextResponse.json(
        { ok: false, error: "유효하지 않은 상태값입니다." },
        { status: 400 },
      );
    }
    data.status = body.status;
  }

  for (const { key, max } of TEXT_FIELDS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === null) {
      data[key] = null;
    } else if (typeof v !== "string" || v.trim().length > max) {
      return NextResponse.json(
        { ok: false, error: `${key} 값이 올바르지 않습니다.` },
        { status: 400 },
      );
    } else {
      data[key] = v.trim() || null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "변경할 항목이 없습니다." },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.otcRequest.update({
      where: { id },
      data: { ...data, ...editorFieldsFromSession(admin) },
      select: { id: true, status: true },
    });
    return NextResponse.json({
      ok: true,
      id: updated.id,
      status: updated.status,
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/otc-requests/:id] patch failed", id, code);
    if (code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "신청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "변경에 실패했습니다." },
      { status: 500 },
    );
  }
}
