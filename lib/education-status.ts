// 교육 행사 개설 승인 상태 — 기존 status lib 패턴(miracle10-status/otc-request-status)과 동일 구조.
// DB는 enum(EducationEventStatus)이지만 라벨·전환 규칙은 여기 한 곳에서 관리.

export const EDUCATION_EVENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELED",
] as const;

export type EducationEventStatus = (typeof EDUCATION_EVENT_STATUSES)[number];

export const EDUCATION_STATUS_LABELS: Record<EducationEventStatus, string> = {
  PENDING: "검토 대기",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
  CANCELED: "취소됨",
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
 * 허용 전환 — PENDING→APPROVED/REJECTED(기본) + REJECTED→APPROVED(재검토)·APPROVED→REJECTED(철회)
 * + PENDING/APPROVED/REJECTED→CANCELED(취소, Step 15)·CANCELED→APPROVED(실수 복구).
 * PENDING 복귀는 교육자 재제출 경로(member API)에서만 별도로 다룬다(어드민 전환으론 없음).
 */
export function canTransitionEducationStatus(
  from: EducationEventStatus,
  to: EducationEventStatus,
): boolean {
  if (from === to) return false;
  if (to === "PENDING") return false;
  if (from === "CANCELED") return to === "APPROVED"; // 취소 복구만
  return true; // → APPROVED/REJECTED/CANCELED
}

/** 승인·공개 후 교육자가 자유 수정 가능한 안내성 필드(신청자 실질 영향 없음) — Step 15/18/25.
 * posterUrl(포스터): 날짜·정원처럼 실질 영향을 주는 항목이 아니라 홍보 이미지이므로 승인 후에도 자유 교체·삭제 허용(Step 18).
 * posterFocus(크롭 위치): 포스터에 딸린 부가 설정이라 같은 자유도로 취급(Step 25). */
export const EDUCATOR_EDITABLE_AFTER_APPROVAL = [
  "descriptionMd",
  "instructorBio",
  "preparation",
  "notice",
  "eligibility",
  "reward",
  "streamUrl",
  "posterUrl",
  "posterFocus",
] as const;

/** 승인 후 운영자만 변경 가능한 잠금 필드(신청자 영향) — API 거부·화면 읽기전용 안내에 공용. */
export const EDUCATOR_LOCKED_AFTER_APPROVAL = [
  "title",
  "category",
  "mode",
  "sessions",
  "officeId",
  "customLocation",
  "capacity",
  "feeKrw",
  "depositBankName",
  "depositAccountNo",
  "depositAccountHolder",
  "applyDeadline",
] as const;
