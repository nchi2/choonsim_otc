// BMB OTC 신청(OtcRequest) 상태 — DB는 String(@default "PENDING"), 값 검증은 여기서.
// 10모(lib/miracle10-status.ts)와 같은 패턴. enum 마이그레이션 대신 String 유지(기존 데이터 안전).

export const OTC_REQUEST_STATUSES = [
  "PENDING",
  "CONTACTED",
  "AGREED",
  "COMPLETED",
  "CANCELED",
] as const;

export type OtcRequestStatus = (typeof OTC_REQUEST_STATUSES)[number];

export const OTC_REQUEST_STATUS_LABELS: Record<OtcRequestStatus, string> = {
  PENDING: "접수",
  CONTACTED: "연락완료",
  AGREED: "합의완료",
  COMPLETED: "완료",
  CANCELED: "취소",
};

// 색은 10모 STATUS_COLORS와 같은 계열 — 접수=주황, 진행=파랑, 합의=청록, 완료=슬레이트, 취소=빨강.
export const OTC_REQUEST_STATUS_COLORS: Record<OtcRequestStatus, string> = {
  PENDING: "#ea580c",
  CONTACTED: "#2563eb",
  AGREED: "#0d9488",
  COMPLETED: "#64748b",
  CANCELED: "#dc2626",
};

export function isOtcRequestStatus(v: unknown): v is OtcRequestStatus {
  return (
    typeof v === "string" &&
    (OTC_REQUEST_STATUSES as readonly string[]).includes(v)
  );
}

/** 알 수 없는(레거시·수기) 상태값 안전 라벨 — 모르는 값은 원문 그대로. */
export function otcRequestStatusLabel(status: string): string {
  return isOtcRequestStatus(status)
    ? OTC_REQUEST_STATUS_LABELS[status]
    : status;
}

export function otcRequestStatusColor(status: string): string {
  return isOtcRequestStatus(status)
    ? OTC_REQUEST_STATUS_COLORS[status]
    : "#6b7280";
}

/** side 라벨 — 손님 기준 구매(BUY)/판매(SELL). */
export function otcSideLabel(side: string): string {
  return side === "SELL" ? "판매" : "구매";
}
