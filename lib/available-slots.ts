import { prisma } from "@/lib/prisma";
import { OrderStatus, type Prisma } from "@/app/generated/prisma/client";

type DbClient = Prisma.TransactionClient | typeof prisma;

/** VERIFIED이면서 운영자 자리에 배정된 건만 정원 차감. */
export const verifiedAssignedOrderWhere = {
  status: OrderStatus.VERIFIED,
  reservedStart: { not: null },
  assignedAdminUserId: { not: null },
} as const;

/** 특정 (사무실, 날짜, 시작시각) 캐파·차감·남은자리. */
export async function getSlotCountsAtTime(
  db: DbClient,
  officeId: number,
  date: string,
  startTime: string,
): Promise<{ capacity: number; taken: number; remaining: number }> {
  const [capacity, taken] = await Promise.all([
    db.workSlot.count({ where: { officeId, date, startTime } }),
    db.otcOrder.count({
      where: {
        ...verifiedAssignedOrderWhere,
        officeId,
        visitDate: date,
        reservedStart: startTime,
      },
    }),
  ]);
  return { capacity, taken, remaining: capacity - taken };
}

export interface SlotAvailability {
  startTime: string;
  capacity: number;
  taken: number;
  remaining: number;
  available: boolean;
}

export interface DayAvailabilitySummary {
  date: string;
  slotCount: number;
  availableSlotCount: number;
  hasAvailability: boolean;
}

function slotKey(date: string, startTime: string): string {
  return `${date}\t${startTime}`;
}

/** 특정 (사무실, 날짜) 30분 슬롯별 캐파·차감·남은자리. capacity=0 슬롯은 제외. */
export async function getSlotAvailabilityForDate(
  officeId: number,
  date: string,
): Promise<SlotAvailability[]> {
  const [workSlots, verifiedOrders] = await Promise.all([
    prisma.workSlot.findMany({
      where: { officeId, date },
      select: { startTime: true },
    }),
    prisma.otcOrder.findMany({
      where: {
        ...verifiedAssignedOrderWhere,
        officeId,
        visitDate: date,
      },
      select: { reservedStart: true },
    }),
  ]);

  const capacityMap = new Map<string, number>();
  for (const s of workSlots) {
    capacityMap.set(s.startTime, (capacityMap.get(s.startTime) ?? 0) + 1);
  }

  const takenMap = new Map<string, number>();
  for (const o of verifiedOrders) {
    const t = o.reservedStart!;
    takenMap.set(t, (takenMap.get(t) ?? 0) + 1);
  }

  const result: SlotAvailability[] = [];
  for (const [startTime, capacity] of capacityMap) {
    const taken = takenMap.get(startTime) ?? 0;
    const remaining = capacity - taken;
    result.push({
      startTime,
      capacity,
      taken,
      remaining,
      available: remaining >= 1,
    });
  }

  return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** 기간 내 날짜별 가용 요약(달력용). */
export async function getDaySummaries(
  officeId: number,
  from: string,
  to: string,
): Promise<DayAvailabilitySummary[]> {
  const [workSlots, verifiedOrders] = await Promise.all([
    prisma.workSlot.findMany({
      where: { officeId, date: { gte: from, lte: to } },
      select: { date: true, startTime: true },
    }),
    prisma.otcOrder.findMany({
      where: {
        ...verifiedAssignedOrderWhere,
        officeId,
        visitDate: { gte: from, lte: to },
      },
      select: { visitDate: true, reservedStart: true },
    }),
  ]);

  const capacityByKey = new Map<string, number>();
  for (const s of workSlots) {
    const k = slotKey(s.date, s.startTime);
    capacityByKey.set(k, (capacityByKey.get(k) ?? 0) + 1);
  }

  const takenByKey = new Map<string, number>();
  for (const o of verifiedOrders) {
    const k = slotKey(o.visitDate!, o.reservedStart!);
    takenByKey.set(k, (takenByKey.get(k) ?? 0) + 1);
  }

  const byDate = new Map<
    string,
    { slotCount: number; availableSlotCount: number }
  >();

  for (const [k, capacity] of capacityByKey) {
    const [date] = k.split("\t");
    const taken = takenByKey.get(k) ?? 0;
    const remaining = capacity - taken;
    const cur = byDate.get(date) ?? { slotCount: 0, availableSlotCount: 0 };
    cur.slotCount += 1;
    if (remaining >= 1) cur.availableSlotCount += 1;
    byDate.set(date, cur);
  }

  return [...byDate.entries()]
    .map(([date, counts]) => ({
      date,
      slotCount: counts.slotCount,
      availableSlotCount: counts.availableSlotCount,
      hasAvailability: counts.availableSlotCount > 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 신청 가능 여부 — 근무 슬롯 있고 VERIFIED 차감 후 남은 자리 ≥ 1. PENDING은 차감하지 않음. */
export async function slotHasRemainingCapacity(
  officeId: number,
  date: string,
  startTime: string,
): Promise<boolean> {
  const slots = await getSlotAvailabilityForDate(officeId, date);
  const slot = slots.find((s) => s.startTime === startTime);
  return slot != null && slot.remaining >= 1;
}

/** @deprecated slotHasRemainingCapacity 사용. 운영자 근무 슬롯 존재만 확인. */
export async function slotHasCapacity(
  officeId: number,
  date: string,
  startTime: string,
): Promise<boolean> {
  const count = await prisma.workSlot.count({
    where: { officeId, date, startTime },
  });
  return count > 0;
}
