import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/app/generated/prisma/client";
import {
  editorFieldsFromSession,
  getAdminUser,
} from "@/lib/admin-guard";

export const runtime = "nodejs";

const VALID_STATUS = new Set(Object.values(OrderStatus));

async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const id = await parseId(ctx.params);
  if (id == null) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    const order = await prisma.otcOrder.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, contact: true, verifiedAt: true, createdAt: true },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ ok: false, error: "신청을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, order });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/miracle10/:id] detail failed", id, code);
    return NextResponse.json({ ok: false, error: "상세를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const id = await parseId(ctx.params);
  if (id == null) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  let body: { status?: unknown };
  try {
    body = (await request.json()) as { status?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (!VALID_STATUS.has(status as OrderStatus)) {
    return NextResponse.json({ ok: false, error: "유효하지 않은 상태값입니다." }, { status: 400 });
  }

  try {
    const order = await prisma.otcOrder.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        ...editorFieldsFromSession(admin),
      },
      select: { id: true, status: true, customerId: true },
    });

    // 면대면 인증 완료(VERIFIED) 시 고객 인증 시각 기록.
    if (status === OrderStatus.VERIFIED) {
      await prisma.customer.update({
        where: { id: order.customerId },
        data: { verifiedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, id: order.id, status: order.status });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/miracle10/:id] patch failed", id, code);
    if (code === "P2025") {
      return NextResponse.json({ ok: false, error: "신청을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "상태 변경에 실패했습니다." }, { status: 500 });
  }
}
