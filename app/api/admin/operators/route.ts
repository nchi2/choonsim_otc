import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

// 운영자 권한 관리 (Step 16) — 목록 GET + 권한 PATCH.
// 별도 상위 권한 없이 모든 운영자가 조정 가능(스펙). 계좌 등 민감 필드는 절대 노출 금지.
// ★자기 잠금 방지: 자기 자신의 권한을 전부(양쪽 false) 끄는 요청은 거부.
// 감사 기록: AdminUser에 lastEdited* 필드가 없어 생략(스키마 무변경 원칙 — 보고 사항).

const LIST_SELECT = {
  id: true,
  username: true,
  displayName: true,
  manageOtc: true,
  manageEducation: true,
} as const;

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const operators = await prisma.adminUser.findMany({
      orderBy: [{ id: "asc" }],
      select: LIST_SELECT,
    });
    return NextResponse.json({ ok: true, operators, selfId: admin.adminUserId });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/operators] list failed", code);
    return NextResponse.json(
      { ok: false, error: "운영자 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const targetId = Number(body.adminUserId);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json({ ok: false, error: "대상이 올바르지 않습니다." }, { status: 400 });
  }

  const data: { manageOtc?: boolean; manageEducation?: boolean } = {};
  if (typeof body.manageOtc === "boolean") data.manageOtc = body.manageOtc;
  if (typeof body.manageEducation === "boolean") {
    data.manageEducation = body.manageEducation;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "변경할 권한이 없습니다." }, { status: 400 });
  }

  try {
    const target = await prisma.adminUser.findUnique({
      where: { id: targetId },
      select: { id: true, manageOtc: true, manageEducation: true },
    });
    if (!target) {
      return NextResponse.json(
        { ok: false, error: "운영자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // ★자기 잠금 방지 — 결과값 기준으로 판정(한 번에 하나만 끄는 경우도 커버)
    const nextOtc = data.manageOtc ?? target.manageOtc;
    const nextEducation = data.manageEducation ?? target.manageEducation;
    if (targetId === admin.adminUserId && !nextOtc && !nextEducation) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "자기 자신의 권한을 전부 끌 수 없습니다. 마지막 남은 권한은 다른 운영자가 조정해 주세요.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.adminUser.update({
      where: { id: targetId },
      data,
      select: LIST_SELECT,
    });
    return NextResponse.json({ ok: true, operator: updated });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/operators] patch failed", code);
    return NextResponse.json(
      { ok: false, error: "권한 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
