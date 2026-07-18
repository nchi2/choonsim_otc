// 운영자 스코프 게이트 공통 구현 (Step 16) — AdminUser.manageOtc / manageEducation (둘 다 기본 true).
// 기본 전원 true라 아무도 안 막히지만, 게이트를 걸어두면 나중에 DB 값만 꺼서 팀 분리 가능.
// 스코프 조회 실패 시 잠그지 않고 세션 인증만으로 통과(가용성 우선 — 전원 true 기본과 일관).
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import type { AdminSessionUser } from "@/lib/admin-session";

export type AdminScope = "manageOtc" | "manageEducation";

export type AdminScopeResult =
  | { ok: true; admin: AdminSessionUser }
  | { ok: false; status: 401 | 403; error: string };

const SCOPE_DENIED_MESSAGE: Record<AdminScope, string> = {
  manageOtc: "OTC 운영 권한이 없습니다. (manageOtc)",
  manageEducation: "교육 관리 권한이 없습니다. (manageEducation)",
};

/** 스코프 게이트 공용 — 세션 확인 + 해당 스코프 확인. */
export async function requireAdminScope(
  scope: AdminScope,
): Promise<AdminScopeResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, status: 401, error: "unauthorized" };
  try {
    const row = await prisma.adminUser.findUnique({
      where: { id: admin.adminUserId },
      select: { manageOtc: true, manageEducation: true },
    });
    if (!row) return { ok: false, status: 401, error: "unauthorized" };
    if (!row[scope]) {
      return { ok: false, status: 403, error: SCOPE_DENIED_MESSAGE[scope] };
    }
    return { ok: true, admin };
  } catch (err) {
    console.error("[admin-scope-guard] scope check failed", scope, err);
    return { ok: true, admin };
  }
}

/** OTC 운영 API 공용 게이트 — manageOtc. */
export function requireOtcManager(): Promise<AdminScopeResult> {
  return requireAdminScope("manageOtc");
}
