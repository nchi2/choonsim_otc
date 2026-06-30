// 10모 신청 상태 — DB enum(OrderStatus)과 1:1.
export const MIRACLE10_STATUSES = [
  "PENDING",
  "CONTACTED",
  "VERIFIED",
  "COMPLETED",
  "CANCELED",
] as const;

export type Miracle10Status = (typeof MIRACLE10_STATUSES)[number];

export const STATUS_LABELS: Record<Miracle10Status, string> = {
  PENDING: "접수",
  CONTACTED: "연락완료",
  VERIFIED: "일정 확정",
  COMPLETED: "완료",
  CANCELED: "취소",
};

export const STATUS_COLORS: Record<Miracle10Status, string> = {
  PENDING: "#9333ea",
  CONTACTED: "#2563eb",
  VERIFIED: "#0d9488",
  COMPLETED: "#64748b",
  CANCELED: "#dc2626",
};

/** 운영자 일정 지정·수정 가능 상태 (완료·취소 제외). */
export function canAdminEditSchedule(status: Miracle10Status): boolean {
  return (
    status === "PENDING" ||
    status === "CONTACTED" ||
    status === "VERIFIED"
  );
}

/** 운영자 UI — 방문 방식 표시 (WALK_IN 일정 지정 여부 포함). */
export function formatAdminVisitTypeLabel(
  visitType: string | null,
  schedule?: {
    officeId?: number | null;
    visitDate?: string | null;
    reservedStart?: string | null;
  },
): string {
  if (visitType === "RESERVED") return "직접 방문 (예약일 지정)";
  if (visitType === "WALK_IN") {
    const hasSchedule =
      schedule?.officeId != null &&
      schedule?.visitDate != null &&
      schedule.visitDate.trim() !== "" &&
      schedule?.reservedStart != null &&
      schedule.reservedStart.trim() !== "";
    return hasSchedule ? "워크인 · 일정 지정됨" : "예약 없이 방문";
  }
  return visitType?.trim() ? visitType : "-";
}
