// 교육 관리 스코프 게이트 — AdminUser.manageEducation(기본 true).
// Step 16: 공통 구현을 lib/admin-scope-guard.ts로 일반화(manageOtc 대칭 게이트 추가).
// 이 파일은 기존 임포트 호환을 위해 위임만 한다. 교육 읽기(GET)·쓰기 API 모두 이 게이트를 쓴다.
import {
  requireAdminScope,
  type AdminScopeResult,
} from "@/lib/admin-scope-guard";

export type EducationManagerResult = AdminScopeResult;

/** 교육 API 공용 — 세션 확인 + manageEducation 스코프 확인. */
export function requireEducationManager(): Promise<EducationManagerResult> {
  return requireAdminScope("manageEducation");
}
