import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/app/generated/prisma/client";
import {
  editorFieldsFromSession,
  getAdminUser,
} from "@/lib/admin-guard";
import { isKstYmd } from "@/lib/kst";
import { canAdminEditSchedule, type Miracle10Status } from "@/lib/miracle10-status";
import { isAllowedSlotTime, isBusinessDayKst } from "@/lib/work-schedule";
import {
  CAPACITY_FULL_MESSAGE,
  orderHasSlotReservation,
  prepareVerifyAssignment,
  updateOrderSchedule,
} from "@/lib/work-slot-reservation";

export const runtime = "nodejs";

const VALID_STATUS = new Set(Object.values(OrderStatus));

type TxResult =
  | { kind: "not_found" }
  | { kind: "capacity_full"; error: string }
  | { kind: "bad"; error: string }
  | { kind: "ok"; order: { id: number; status: OrderStatus } };

async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function asTrimmed(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function parseOfficeId(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}


function parseScheduleInput(body: {
  visitDate?: unknown;
  reservedStart?: unknown;
}):
  | { ok: true; visitDate: string; reservedStart: string }
  | { ok: false; error: string }
  | null {
  const hasDate = body.visitDate !== undefined;
  const hasTime = body.reservedStart !== undefined;
  if (!hasDate && !hasTime) return null;
  if (!hasDate || !hasTime) {
    return {
      ok: false,
      error: "visitDate와 reservedStart를 함께 보내주세요.",
    };
  }

  const visitDate = asTrimmed(body.visitDate);
  const reservedStart = asTrimmed(body.reservedStart);
  if (!visitDate || !isKstYmd(visitDate) || !isBusinessDayKst(visitDate)) {
    return { ok: false, error: "방문 희망일이 올바르지 않습니다." };
  }
  if (!reservedStart || !isAllowedSlotTime(reservedStart)) {
    return { ok: false, error: "방문 시간을 선택해 주세요." };
  }
  return { ok: true, visitDate, reservedStart };
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

  let body: {
    status?: unknown;
    visitDate?: unknown;
    reservedStart?: unknown;
    officeId?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const hasStatus = body.status !== undefined;
  const scheduleInput = parseScheduleInput(body);

  if (scheduleInput && !scheduleInput.ok) {
    return NextResponse.json({ ok: false, error: scheduleInput.error }, { status: 400 });
  }

  let newStatus: OrderStatus | null = null;
  if (hasStatus) {
    const status = typeof body.status === "string" ? body.status : "";
    if (!VALID_STATUS.has(status as OrderStatus)) {
      return NextResponse.json({ ok: false, error: "유효하지 않은 상태값입니다." }, { status: 400 });
    }
    newStatus = status as OrderStatus;
  }

  if (!newStatus && !scheduleInput) {
    return NextResponse.json({ ok: false, error: "변경할 항목이 없습니다." }, { status: 400 });
  }

  const editor = editorFieldsFromSession(admin);

  try {
    const result = await prisma.$transaction(
      async (tx): Promise<TxResult> => {
        const existing = await tx.otcOrder.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            customerId: true,
            visitType: true,
            officeId: true,
            visitDate: true,
            reservedStart: true,
            assignedAdminUserId: true,
          },
        });

        if (!existing) {
          return { kind: "not_found" };
        }

        if (scheduleInput?.ok) {
          if (!canAdminEditSchedule(existing.status as Miracle10Status)) {
            return {
              kind: "bad",
              error: "완료·취소된 신청은 일정을 수정할 수 없습니다.",
            };
          }

          let resolvedOfficeId = existing.officeId;
          if (body.officeId !== undefined) {
            const parsed = parseOfficeId(body.officeId);
            if (parsed == null) {
              return {
                kind: "bad",
                error: "사무실이 올바르지 않습니다.",
              };
            }
            resolvedOfficeId = parsed;
          }

          if (resolvedOfficeId == null) {
            return {
              kind: "bad",
              error: "사무실을 선택해 주세요.",
            };
          }

          const office = await tx.office.findUnique({
            where: { id: resolvedOfficeId },
            select: { id: true },
          });
          if (!office) {
            return { kind: "bad", error: "사무실을 찾을 수 없습니다." };
          }

          const scheduleResult = await updateOrderSchedule(
            tx,
            {
              id: existing.id,
              status: existing.status,
              officeId: resolvedOfficeId,
              assignedAdminUserId: existing.assignedAdminUserId,
            },
            {
              visitDate: scheduleInput.visitDate,
              reservedStart: scheduleInput.reservedStart,
            },
            admin.adminUserId,
          );
          if (!scheduleResult.ok) {
            return { kind: "capacity_full", error: scheduleResult.error };
          }

          await tx.otcOrder.update({
            where: { id },
            data: editor,
          });
        }

        if (!newStatus) {
          const order = await tx.otcOrder.findUnique({
            where: { id },
            select: { id: true, status: true },
          });
          return { kind: "ok", order: order! };
        }

        const current = await tx.otcOrder.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            customerId: true,
            officeId: true,
            visitDate: true,
            reservedStart: true,
            assignedAdminUserId: true,
          },
        });
        if (!current) {
          return { kind: "not_found" };
        }

        const slotReservation = orderHasSlotReservation(current);

        if (newStatus === OrderStatus.VERIFIED) {
          const assignAdminId =
            current.assignedAdminUserId ?? admin.adminUserId;

          if (slotReservation) {
            const prep = await prepareVerifyAssignment(tx, {
              orderId: id,
              adminUserId: assignAdminId,
              officeId: current.officeId!,
              visitDate: current.visitDate!,
              reservedStart: current.reservedStart!,
            });
            if (!prep.ok) {
              return { kind: "capacity_full", error: prep.error };
            }
          }

          const order = await tx.otcOrder.update({
            where: { id },
            data: {
              status: newStatus,
              ...(slotReservation
                ? { assignedAdminUserId: assignAdminId }
                : {}),
              ...editor,
            },
            select: { id: true, status: true, customerId: true },
          });

          await tx.customer.update({
            where: { id: current.customerId },
            data: { verifiedAt: new Date() },
          });

          return { kind: "ok", order };
        }

        const leavingVerified = current.status === OrderStatus.VERIFIED;

        const order = await tx.otcOrder.update({
          where: { id },
          data: {
            status: newStatus,
            ...(leavingVerified ? { assignedAdminUserId: null } : {}),
            ...editor,
          },
          select: { id: true, status: true, customerId: true },
        });

        return { kind: "ok", order };
      },
      { isolationLevel: "Serializable" },
    );

    if (result.kind === "not_found") {
      return NextResponse.json(
        { ok: false, error: "신청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    if (result.kind === "bad") {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    if (result.kind === "capacity_full") {
      return NextResponse.json(
        { ok: false, error: result.error ?? CAPACITY_FULL_MESSAGE },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      id: result.order.id,
      status: result.order.status,
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/miracle10/:id] patch failed", id, code);
    if (code === "P2025") {
      return NextResponse.json({ ok: false, error: "신청을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "변경에 실패했습니다." }, { status: 500 });
  }
}
