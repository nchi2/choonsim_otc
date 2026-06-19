import { OrderStatus, type Prisma } from "@/app/generated/prisma/client";
import {
  getSlotCountsAtTime,
  verifiedAssignedOrderWhere,
} from "@/lib/available-slots";
import { slotEndTime } from "@/lib/kst";
import { prisma } from "@/lib/prisma";

export const CAPACITY_FULL_MESSAGE =
  "이 시간은 정원이 찼습니다. 다른 시간으로 변경 후 확정하세요.";

type Tx = Prisma.TransactionClient;

/** VERIFIED 예약이 슬롯에 배정됐는지 — assignedAdminUserId·officeId·visitDate·reservedStart 기준. */
export async function slotHasVerifiedReservation(slot: {
  adminUserId: number;
  officeId: number;
  date: string;
  startTime: string;
}): Promise<boolean> {
  const count = await prisma.otcOrder.count({
    where: {
      ...verifiedAssignedOrderWhere,
      assignedAdminUserId: slot.adminUserId,
      officeId: slot.officeId,
      visitDate: slot.date,
      reservedStart: slot.startTime,
    },
  });
  return count > 0;
}

export function orderHasSlotReservation(order: {
  officeId: number | null;
  visitDate: string | null;
  reservedStart: string | null;
}): order is {
  officeId: number;
  visitDate: string;
  reservedStart: string;
} {
  return (
    order.officeId != null &&
    order.officeId > 0 &&
    order.visitDate != null &&
    order.visitDate.trim() !== "" &&
    order.reservedStart != null &&
    order.reservedStart.trim() !== ""
  );
}

/** 일정 확정 전 — 본인 자리 확보(없으면 생성) + 정원 검사. */
export async function prepareVerifyAssignment(
  tx: Tx,
  params: {
    orderId: number;
    adminUserId: number;
    officeId: number;
    visitDate: string;
    reservedStart: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { orderId, adminUserId, officeId, visitDate, reservedStart } = params;

  const duplicateOnAdmin = await tx.otcOrder.count({
    where: {
      id: { not: orderId },
      ...verifiedAssignedOrderWhere,
      assignedAdminUserId: adminUserId,
      officeId,
      visitDate,
      reservedStart,
    },
  });
  if (duplicateOnAdmin > 0) {
    return { ok: false, error: CAPACITY_FULL_MESSAGE };
  }

  const existingSlot = await tx.workSlot.findUnique({
    where: {
      adminUserId_officeId_date_startTime: {
        adminUserId,
        officeId,
        date: visitDate,
        startTime: reservedStart,
      },
    },
  });

  if (existingSlot) {
    return { ok: true };
  }

  // 본인 슬롯 없음 → 자동 생성(캐파 +1). 동시 생성은 upsert로 흡수.
  await tx.workSlot.upsert({
    where: {
      adminUserId_officeId_date_startTime: {
        adminUserId,
        officeId,
        date: visitDate,
        startTime: reservedStart,
      },
    },
    create: {
      adminUserId,
      officeId,
      date: visitDate,
      startTime: reservedStart,
    },
    update: {},
  });

  // 동시 확정 경쟁 — 트랜잭션 안에서 remaining 재확인.
  const { remaining } = await getSlotCountsAtTime(
    tx,
    officeId,
    visitDate,
    reservedStart,
  );
  if (remaining < 1) {
    return { ok: false, error: CAPACITY_FULL_MESSAGE };
  }

  return { ok: true };
}

function visitTimeSlotFromStart(reservedStart: string): string | null {
  const end = slotEndTime(reservedStart);
  return end ? `${reservedStart}-${end}` : null;
}

/** 운영자 일정 수정 — PENDING은 필드만, VERIFIED는 자리 반환 후 (재)배정. */
export async function updateOrderSchedule(
  tx: Tx,
  existing: {
    id: number;
    status: OrderStatus;
    officeId: number;
    assignedAdminUserId: number | null;
  },
  schedule: { visitDate: string; reservedStart: string },
  actingAdminUserId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { visitDate, reservedStart } = schedule;
  const visitTimeSlot = visitTimeSlotFromStart(reservedStart);
  if (!visitTimeSlot) {
    return { ok: false, error: "방문 시간이 올바르지 않습니다." };
  }

  if (existing.status === OrderStatus.VERIFIED) {
    const adminUserId = existing.assignedAdminUserId ?? actingAdminUserId;

    if (existing.assignedAdminUserId != null) {
      await tx.otcOrder.update({
        where: { id: existing.id },
        data: { assignedAdminUserId: null },
      });
    }

    const prep = await prepareVerifyAssignment(tx, {
      orderId: existing.id,
      adminUserId,
      officeId: existing.officeId,
      visitDate,
      reservedStart,
    });
    if (!prep.ok) {
      return prep;
    }

    await tx.otcOrder.update({
      where: { id: existing.id },
      data: {
        officeId: existing.officeId,
        visitDate,
        reservedStart,
        visitTimeSlot,
        assignedAdminUserId: adminUserId,
      },
    });
    return { ok: true };
  }

  await tx.otcOrder.update({
    where: { id: existing.id },
    data: {
      officeId: existing.officeId,
      visitDate,
      reservedStart,
      visitTimeSlot,
    },
  });
  return { ok: true };
}
