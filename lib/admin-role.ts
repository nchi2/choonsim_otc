// 운영자 role 표현 (Step 27) — 게이트 메커니즘은 여전히 두 불리언(manageOtc/manageEducation).
// role은 그 조합을 사람이 이해하기 쉽게 보여주는 표현일 뿐. (AdminUser.role String 레거시 컬럼과 무관.)
//   총괄(super)   = manageOtc ✅ + manageEducation ✅
//   OTC(otc)      = manageOtc ✅ + manageEducation ✖️
//   교육(education) = manageOtc ✖️ + manageEducation ✅
// 둘 다 false는 유효 role이 아님(권한 없는 계정) → null. UI에서 만들 수 없고, DB에 있어도 표시만.

export type AdminRole = "super" | "otc" | "education";

export const ADMIN_ROLES: AdminRole[] = ["super", "otc", "education"];

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  super: "총괄",
  otc: "OTC",
  education: "교육",
};

export function isAdminRole(v: unknown): v is AdminRole {
  return v === "super" || v === "otc" || v === "education";
}

/** 두 불리언 → role. 둘 다 false면 null(권한 없음 — 유효 role 아님). */
export function roleFromScopes(
  manageOtc: boolean,
  manageEducation: boolean,
): AdminRole | null {
  if (manageOtc && manageEducation) return "super";
  if (manageOtc) return "otc";
  if (manageEducation) return "education";
  return null;
}

/** role → 두 불리언(게이트 단일 소스). */
export function scopesFromRole(role: AdminRole): {
  manageOtc: boolean;
  manageEducation: boolean;
} {
  switch (role) {
    case "super":
      return { manageOtc: true, manageEducation: true };
    case "otc":
      return { manageOtc: true, manageEducation: false };
    case "education":
      return { manageOtc: false, manageEducation: true };
  }
}

/** 총괄(두 권한 모두) 여부 — 운영자 관리 접근 판정에 사용. */
export function isSuperScopes(
  manageOtc: boolean,
  manageEducation: boolean,
): boolean {
  return manageOtc && manageEducation;
}
