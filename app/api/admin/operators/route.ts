import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-scope-guard";
import { isAdminRole, scopesFromRole } from "@/lib/admin-role";

export const runtime = "nodejs";

// 운영자 계정 관리 (Step 27) — ★총괄(manageOtc && manageEducation && isActive)만 접근.
//   GET  목록(role·활성 상태 포함, 민감 필드는 노출 금지)
//   POST 계정 생성(username 중복 검사·bcrypt 해싱·role→두 불리언)
//   PATCH role 변경 / 활성 토글
// ★ 잠김 방지: 활성 총괄이 0명이 되는 변경(마지막 총괄 강등·비활성화, 자기 자신 포함)은 400.
// 로그인 코드와 동일한 해싱(bcryptjs, 라운드 10). 평문·해시는 어떤 응답에도 노출하지 않는다.

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LEN = 8;

const LIST_SELECT = {
  id: true,
  username: true,
  displayName: true,
  manageOtc: true,
  manageEducation: true,
  isActive: true,
} as const;

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** 활성 총괄 수 — 잠김 방지 기준(비활성 총괄은 로그인 못 하므로 기능하는 총괄이 아님). */
async function activeSuperCount(): Promise<number> {
  return prisma.adminUser.count({
    where: { manageOtc: true, manageEducation: true, isActive: true },
  });
}

export async function GET() {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  try {
    const operators = await prisma.adminUser.findMany({
      orderBy: [{ id: "asc" }],
      select: LIST_SELECT,
    });
    return NextResponse.json({ ok: true, operators, selfId: gate.admin.adminUserId });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/operators] list failed", code);
    return bad("운영자 목록을 불러오지 못했습니다.", 500);
  }
}

// ── POST: 계정 생성 ──
export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role;

  if (!username) return bad("사용자명을 입력해 주세요.");
  if (!/^[a-zA-Z0-9._-]{2,30}$/.test(username)) {
    return bad("사용자명은 영문·숫자·._- 조합 2~30자여야 합니다.");
  }
  if (!displayName) return bad("표시 이름을 입력해 주세요.");
  if (displayName.length > 50) return bad("표시 이름이 너무 깁니다.");
  if (password.length < MIN_PASSWORD_LEN) {
    return bad(`초기 비밀번호는 최소 ${MIN_PASSWORD_LEN}자 이상이어야 합니다.`);
  }
  if (!isAdminRole(role)) return bad("역할이 올바르지 않습니다.");

  const scopes = scopesFromRole(role);

  try {
    const dup = await prisma.adminUser.findUnique({
      where: { username },
      select: { id: true },
    });
    if (dup) return bad("이미 존재하는 사용자명입니다.");

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const created = await prisma.adminUser.create({
      data: {
        username,
        displayName,
        passwordHash,
        manageOtc: scopes.manageOtc,
        manageEducation: scopes.manageEducation,
        isActive: true,
      },
      select: LIST_SELECT,
    });
    // ★ passwordHash는 select에 없음 — 어떤 응답에도 해시/평문 노출 안 함.
    return NextResponse.json({ ok: true, operator: created });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    if (code === "P2002") return bad("이미 존재하는 사용자명입니다.");
    console.error("[admin/operators] create failed", code);
    return bad("계정 생성에 실패했습니다.", 500);
  }
}

// ── PATCH: role 변경 / 활성 토글 ──
export async function PATCH(request: Request) {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const targetId = Number(body.adminUserId);
  if (!Number.isInteger(targetId) || targetId <= 0) return bad("대상이 올바르지 않습니다.");

  const hasRole = body.role !== undefined;
  const hasActive = body.isActive !== undefined;
  if (!hasRole && !hasActive) return bad("변경할 항목이 없습니다.");
  if (hasRole && !isAdminRole(body.role)) return bad("역할이 올바르지 않습니다.");
  if (hasActive && typeof body.isActive !== "boolean") return bad("활성 값이 올바르지 않습니다.");

  try {
    const target = await prisma.adminUser.findUnique({
      where: { id: targetId },
      select: { id: true, manageOtc: true, manageEducation: true, isActive: true },
    });
    if (!target) return bad("운영자를 찾을 수 없습니다.", 404);

    // 변경 후 결과 상태 계산
    const scopes = hasRole
      ? scopesFromRole(body.role as "super" | "otc" | "education")
      : { manageOtc: target.manageOtc, manageEducation: target.manageEducation };
    const nextActive = hasActive ? (body.isActive as boolean) : target.isActive;

    const targetIsActiveSuperNow =
      target.manageOtc && target.manageEducation && target.isActive;
    const targetWillBeActiveSuper =
      scopes.manageOtc && scopes.manageEducation && nextActive;

    // ★ 잠김 방지 — 지금 "활성 총괄"인 대상이 그 지위를 잃는 변경이면,
    //   대상을 제외한 다른 활성 총괄이 최소 1명 남아야 한다(자기 자신 포함 동일 규칙).
    if (targetIsActiveSuperNow && !targetWillBeActiveSuper) {
      const total = await activeSuperCount();
      const remaining = total - 1; // 대상 제외
      if (remaining < 1) {
        return bad(
          "마지막 총괄 운영자입니다. 다른 운영자를 총괄로 지정한 뒤에 변경할 수 있습니다.",
        );
      }
    }

    const updated = await prisma.adminUser.update({
      where: { id: targetId },
      data: {
        manageOtc: scopes.manageOtc,
        manageEducation: scopes.manageEducation,
        isActive: nextActive,
      },
      select: LIST_SELECT,
    });
    return NextResponse.json({ ok: true, operator: updated });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/operators] patch failed", code);
    return bad("저장에 실패했습니다.", 500);
  }
}
