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

// 접수(PENDING)=주황: 어드민 셸 알림 배지·대시보드 접수 카드와 같은 계열로 통일.
// 접수=주황 · 연락완료=파랑 · 일정확정=틸 · 완료=초록 · 취소=회색
// (components/admin/ui.ts statusColor와 동일 팔레트 — 두 곳을 함께 유지할 것)
export const STATUS_COLORS: Record<Miracle10Status, string> = {
  PENDING: "#ea580c",
  CONTACTED: "#2563eb",
  VERIFIED: "#0d9488",
  COMPLETED: "#16a34a",
  CANCELED: "#6b7280",
};

/** 운영자 일정 지정·수정 가능 상태 (완료·취소 제외). */
export function canAdminEditSchedule(status: Miracle10Status): boolean {
  return (
    status === "PENDING" ||
    status === "CONTACTED" ||
    status === "VERIFIED"
  );
}

/**
 * 목록용 방문 일정 한 줄 요약.
 * RESERVED(또는 기타)=일정 있으면 "7/1 16:00", 없으면 "-".
 * WALK_IN="워크인", 일정 지정됐으면 "워크인 7/1 16:00".
 * 시간은 reservedStart(30분) 우선, 레거시 visitTimeSlot 폴백.
 */
export function formatVisitBrief(item: {
  visitType: string | null;
  visitDate: string | null;
  reservedStart?: string | null;
  visitTimeSlot?: string | null;
}): string {
  const d = item.visitDate?.trim() ?? "";
  const date =
    d.length >= 10 ? `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}` : null;
  const time = item.reservedStart?.trim() || item.visitTimeSlot?.trim() || "";
  const sched = date ? (time ? `${date} ${time}` : date) : null;
  if (item.visitType === "WALK_IN") {
    return sched ? `워크인 ${sched}` : "워크인";
  }
  return sched ?? "-";
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
