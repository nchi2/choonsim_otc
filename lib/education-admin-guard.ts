// 교육 관리 스코프 게이트 — AdminUser.manageEducation(기본 true).
// 점진 도입: 지금은 전원 true라 아무도 안 막히지만, 교육 "쓰기" API에만 게이트를 걸어두면
// 나중에 OTC팀/교육팀 분리 시 DB 값만 끄면 된다. 읽기(GET)는 전 운영자 개방 유지.
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import type { AdminSessionUser } from "@/lib/admin-session";

export type EducationManagerResult =
  | { ok: true; admin: AdminSessionUser }
  | { ok: false; status: 401 | 403; error: string };

/** 교육 쓰기 API 공용 — 세션 확인 + manageEducation 스코프 확인. */
export async function requireEducationManager(): Promise<EducationManagerResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, status: 401, error: "unauthorized" };
  try {
    const row = await prisma.adminUser.findUnique({
      where: { id: admin.adminUserId },
      select: { manageEducation: true },
    });
    if (!row) return { ok: false, status: 401, error: "unauthorized" };
    if (!row.manageEducation) {
      return {
        ok: false,
        status: 403,
        error: "교육 관리 권한이 없습니다. (manageEducation)",
      };
    }
    return { ok: true, admin };
  } catch (err) {
    console.error("[education-admin-guard] scope check failed", err);
    // 스코프 조회 실패 시 잠그지 않고 세션 인증만으로 통과(가용성 우선 — 전원 true 기본과 일관)
    return { ok: true, admin };
  }
}
