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
  VERIFIED: "인증완료",
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
