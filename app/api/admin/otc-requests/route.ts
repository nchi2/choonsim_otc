import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { requireOtcManager } from "@/lib/admin-scope-guard";
import { getCommentBadges } from "@/lib/order-comments";
import {
  OTC_REQUEST_STATUSES,
  isOtcRequestStatus,
} from "@/lib/otc-request-status";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requireOtcManager();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }
  const admin = gate.admin;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 300);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const includeTest = searchParams.get("includeTest") === "1";

  // 테스트 데이터 기본 제외 — ?includeTest=1 일 때만 포함
  const baseWhere: Prisma.OtcRequestWhereInput = includeTest
    ? {}
    : { isTest: false };
  const where: Prisma.OtcRequestWhereInput = { ...baseWhere };
  if (statusParam && isOtcRequestStatus(statusParam)) {
    where.status = statusParam;
  }

  try {
    const [total, grouped, items] = await Promise.all([
      prisma.otcRequest.count({ where }),
      prisma.otcRequest.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.otcRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          createdAt: true,
          side: true,
          name: true,
          contact: true,
          quantity: true,
          desiredPrice: true,
          status: true,
          visitDate: true,
          reservedStart: true,
          isTest: true,
          lastEditedByName: true,
          lastEditedAt: true,
          office: { select: { name: true } },
        },
      }),
    ]);

    const countOf = (s: string) =>
      grouped.find((g) => g.status === s)?._count._all ?? 0;
    const counts = Object.fromEntries([
      ...OTC_REQUEST_STATUSES.map((s) => [s, countOf(s)]),
      ["total", grouped.reduce((sum, g) => sum + g._count._all, 0)],
    ]) as Record<string, number>;

    const badges = await getCommentBadges(
      admin.adminUserId,
      "OTC_REQUEST",
      items.map((it) => it.id),
    );

    return NextResponse.json({
      ok: true,
      total,
      counts,
      limit,
      offset,
      items: items.map((it) => ({
        id: it.id,
        createdAt: it.createdAt.toISOString(),
        side: it.side,
        name: it.name,
        contact: it.contact,
        quantity: it.quantity,
        desiredPrice: it.desiredPrice,
        status: it.status,
        visitDate: it.visitDate,
        reservedStart: it.reservedStart,
        isTest: it.isTest,
        lastEditedByName: it.lastEditedByName,
        lastEditedAt: it.lastEditedAt ? it.lastEditedAt.toISOString() : null,
        officeName: it.office?.name ?? null,
        commentCount: badges.get(it.id)?.count ?? 0,
        unreadCommentCount: badges.get(it.id)?.unread ?? 0,
      })),
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/otc-requests] list failed", code);
    return NextResponse.json(
      { ok: false, error: "목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
