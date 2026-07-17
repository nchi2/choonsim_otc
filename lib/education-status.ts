// 교육 행사 개설 승인 상태 — 기존 status lib 패턴(miracle10-status/otc-request-status)과 동일 구조.
// DB는 enum(EducationEventStatus)이지만 라벨·전환 규칙은 여기 한 곳에서 관리.

export const EDUCATION_EVENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export type EducationEventStatus = (typeof EDUCATION_EVENT_STATUSES)[number];

export const EDUCATION_STATUS_LABELS: Record<EducationEventStatus, string> = {
  PENDING: "검토 대기",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
};

export function isEducationEventStatus(
  v: unknown,
): v is EducationEventStatus {
  return (
    typeof v === "string" &&
    (EDUCATION_EVENT_STATUSES as readonly string[]).includes(v)
  );
}

/**
 * 허용 전환 — PENDING→APPROVED/REJECTED(기본 워크플로우) +
 * REJECTED→APPROVED(재검토 승인) · APPROVED→REJECTED(승인 철회).
 * PENDING으로 되돌리는 전환은 없음(개설 신청은 검토 결과가 남는다).
 */
export function canTransitionEducationStatus(
  from: EducationEventStatus,
  to: EducationEventStatus,
): boolean {
  if (from === to) return false;
  if (to === "PENDING") return false;
  return true;
}
