import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderKind, OrderStatus, Prisma } from "@/app/generated/prisma/client";
import { getAdminUser, maskContact, maskName } from "@/lib/admin-guard";
import { getCommentBadges } from "@/lib/order-comments";

export const runtime = "nodejs";

const VALID_STATUS = new Set(Object.values(OrderStatus));

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const where: Prisma.OtcOrderWhereInput = { kind: OrderKind.MIRACLE10 };
  if (statusParam && VALID_STATUS.has(statusParam as OrderStatus)) {
    where.status = statusParam as OrderStatus;
  }

  try {
    const [total, orders] = await Promise.all([
      prisma.otcOrder.count({ where }),
      prisma.otcOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          createdAt: true,
          status: true,
          quantity: true,
          visitType: true,
          visitDate: true,
          reservedStart: true,
          visitTimeSlot: true,
          isSbmbMember: true,
          lastEditedBy: true,
          lastEditedByName: true,
          lastEditedAt: true,
          customer: { select: { name: true, contact: true } },
        },
      }),
    ]);

    const badges = await getCommentBadges(
      admin.adminUserId,
      "MIRACLE10",
      orders.map((o) => o.id),
    );

    // 목록에서는 식별정보를 마스킹해 노출 최소화.
    const items = orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      quantity: o.quantity,
      visitType: o.visitType,
      visitDate: o.visitDate,
      reservedStart: o.reservedStart,
      visitTimeSlot: o.visitTimeSlot,
      isSbmbMember: o.isSbmbMember,
      lastEditedBy: o.lastEditedBy,
      lastEditedByName: o.lastEditedByName,
      lastEditedAt: o.lastEditedAt,
      nameMasked: maskName(o.customer.name),
      contactMasked: maskContact(o.customer.contact),
      commentCount: badges.get(o.id)?.count ?? 0,
      unreadCommentCount: badges.get(o.id)?.unread ?? 0,
    }));

    return NextResponse.json({ ok: true, total, limit, offset, items });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/miracle10] list failed", code);
    return NextResponse.json(
      { ok: false, error: "목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
