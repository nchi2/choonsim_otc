// 신청 상태 상수 정의
export const REQUEST_STATUS = {
  PENDING: "PENDING",
  LISTED: "LISTED",
  MATCHED: "MATCHED",
  COMPLETED: "COMPLETED",
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

// 상태 표시명 매핑
export const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "대기중",
  LISTED: "등록됨",
  MATCHED: "매칭됨",
  COMPLETED: "완료",
};
