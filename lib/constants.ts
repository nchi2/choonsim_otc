// 신청 상태 상수 정의
export const REQUEST_STATUS = {
  PENDING: "PENDING",
  LISTED: "LISTED",
  MATCHED: "MATCHED",
  COMPLETED: "COMPLETED",
  PENDING_CONFIRMATION: "PENDING_CONFIRMATION", // 새 상태 추가
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

// 상태 표시명 매핑
export const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "대기중",
  LISTED: "등록됨",
  MATCHED: "매칭됨",
  COMPLETED: "완료",
  PENDING_CONFIRMATION: "판매의사 확인중", // 새 상태 라벨 추가
};
