import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderKind, OrderStatus, Prisma } from "@prisma/client";
import { isAdminRequest, maskContact, maskName } from "@/lib/admin-guard";

export const runtime = "nodejs";

const VALID_STATUS = new Set(Object.values(OrderStatus));

export async function GET(request: Request) {
  if (!(await isAdminRequest())) {
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
          isSbmbMember: true,
          customer: { select: { name: true, contact: true } },
        },
      }),
    ]);

    // 목록에서는 식별정보를 마스킹해 노출 최소화.
    const items = orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      status: o.status,
      quantity: o.quantity,
      visitType: o.visitType,
      visitDate: o.visitDate,
      isSbmbMember: o.isSbmbMember,
      nameMasked: maskName(o.customer.name),
      contactMasked: maskContact(o.customer.contact),
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
