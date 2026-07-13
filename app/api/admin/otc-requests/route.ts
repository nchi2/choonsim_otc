import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import { getCommentBadges } from "@/lib/order-comments";

export const runtime = "nodejs";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.otcRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
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
        lastEditedByName: true,
        lastEditedAt: true,
        office: { select: { name: true } },
      },
    });

    const badges = await getCommentBadges(
      admin.adminUserId,
      "OTC_REQUEST",
      items.map((it) => it.id),
    );

    return NextResponse.json({
      ok: true,
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
