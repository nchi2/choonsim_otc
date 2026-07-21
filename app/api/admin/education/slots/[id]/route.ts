import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducationManager } from "@/lib/education-admin-guard";

export const runtime = "nodejs";

// 교육 슬롯 삭제 — manageEducation 스코프 운영자 전원(EducationSlot에 소유자 필드 없음).

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireEducationManager();
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status },
    );
  }

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    await prisma.educationSlot.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    if (code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "슬롯을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    console.error("[admin/education/slots/:id] delete failed", id, code);
    return NextResponse.json(
      { ok: false, error: "삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
