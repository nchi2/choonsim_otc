import { prisma } from "@/lib/prisma";
import { verifiedAssignedOrderWhere } from "@/lib/available-slots";

export interface ScheduleReservationItem {
  id: number;
  visitDate: string;
  reservedStart: string;
  assignedAdminUserId: number;
  customerName: string;
}

/** 어드민 스케줄 — (사무실, 기간) 확정 배정 예약 목록. */
export async function getScheduleReservations(
  officeId: number,
  from: string,
  to: string,
): Promise<ScheduleReservationItem[]> {
  const rows = await prisma.otcOrder.findMany({
    where: {
      ...verifiedAssignedOrderWhere,
      officeId,
      visitDate: { gte: from, lte: to },
    },
    select: {
      id: true,
      visitDate: true,
      reservedStart: true,
      assignedAdminUserId: true,
      customer: { select: { name: true } },
    },
    orderBy: [{ visitDate: "asc" }, { reservedStart: "asc" }, { id: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    visitDate: r.visitDate!,
    reservedStart: r.reservedStart!,
    assignedAdminUserId: r.assignedAdminUserId!,
    customerName: r.customer.name,
  }));
}
