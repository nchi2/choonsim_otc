import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/app/generated/prisma/client";
import { verifiedAssignedOrderWhere } from "@/lib/available-slots";

export interface ScheduleReservationItem {
  id: number;
  visitDate: string;
  reservedStart: string;
  /** 미확정(접수·연락완료) 건은 배정 운영자가 없다. */
  assignedAdminUserId: number | null;
  customerName: string;
  status: OrderStatus;
  /** true = VERIFIED + 배정 완료(정원 차감 대상). false = 표시 전용 미확정. */
  confirmed: boolean;
  /**
   * 테스트 건 — 캘린더에서 숨기지 않는다(자리를 실제로 점유 중이므로 숨기면
   * 중복 배정 위험). UI 표시 구분용 필드. 공개 정원(taken)에서는 제외됨.
   */
  isTest: boolean;
}

/**
 * 어드민 스케줄 — (사무실, 기간) 캘린더 표시용 예약 목록.
 * 확정(VERIFIED+배정)과 함께 일정이 잡힌 미확정(PENDING·CONTACTED) 건도 반환한다.
 * 정원 차감(taken)은 여전히 verifiedAssignedOrderWhere 기준 — 미확정은 표시만.
 */
export async function getScheduleReservations(
  officeId: number,
  from: string,
  to: string,
): Promise<ScheduleReservationItem[]> {
  const rows = await prisma.otcOrder.findMany({
    where: {
      officeId,
      visitDate: { gte: from, lte: to },
      reservedStart: { not: null },
      OR: [
        verifiedAssignedOrderWhere,
        { status: { in: [OrderStatus.PENDING, OrderStatus.CONTACTED] } },
      ],
    },
    select: {
      id: true,
      visitDate: true,
      reservedStart: true,
      assignedAdminUserId: true,
      status: true,
      isTest: true,
      customer: { select: { name: true } },
    },
    orderBy: [{ visitDate: "asc" }, { reservedStart: "asc" }, { id: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    visitDate: r.visitDate!,
    reservedStart: r.reservedStart!,
    assignedAdminUserId: r.assignedAdminUserId,
    customerName: r.customer.name,
    status: r.status,
    confirmed:
      r.status === OrderStatus.VERIFIED && r.assignedAdminUserId != null,
    isTest: r.isTest,
  }));
}
