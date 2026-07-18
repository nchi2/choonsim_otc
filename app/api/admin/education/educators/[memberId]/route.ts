import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducationManager } from "@/lib/education-admin-guard";
import { sendEducatorDecisionEmail } from "@/lib/education-alerts";

export const runtime = "nodejs";

// 교육자 자격 승인/반려 — PENDING→APPROVED/REJECTED + REJECTED→APPROVED(재검토)·
// APPROVED→REJECTED(자격 철회). NONE 복귀 없음(행사 승인 상태머신과 동일 규칙).
// 반려 시 사유 필수. manageEducation 스코프. 결과 메일은 실패해도 전환 성공 유지.

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function canTransition(from: string, to: string): boolean {
  if (from === to) return false;
  if (to !== "APPROVED" && to !== "REJECTED") return false;
  return from === "PENDING" || from === "REJECTED" || from === "APPROVED";
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ memberId: string }> },
) {
  const gate = await requireEducationManager();
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status },
    );
  }

  const { memberId } = await ctx.params;
  if (!memberId) return bad("잘못된 id");

  let body: { status?: unknown; rejectReason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return bad("잘못된 요청입니다.");
  }
  const nextStatus = typeof body.status === "string" ? body.status : "";
  const rejectReason =
    typeof body.rejectReason === "string" && body.rejectReason.trim()
      ? body.rejectReason.trim().slice(0, 500)
      : null;

  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, email: true, educatorStatus: true },
    });
    if (!member) return bad("회원을 찾을 수 없습니다.", 404);
    if (!canTransition(member.educatorStatus, nextStatus)) {
      return bad(
        `현재 상태(${member.educatorStatus})에서 ${nextStatus}(으)로 전환할 수 없습니다.`,
      );
    }
    if (nextStatus === "REJECTED" && !rejectReason) {
      return bad("반려 사유를 입력해 주세요.");
    }

    await prisma.member.update({
      where: { id: member.id },
      data:
        nextStatus === "APPROVED"
          ? {
              educatorStatus: "APPROVED",
              educatorApprovedAt: new Date(),
              educatorRejectReason: null,
            }
          : {
              educatorStatus: "REJECTED",
              educatorRejectReason: rejectReason,
            },
    });

    // 결과 메일 — 실패해도 전환 성공 유지
    try {
      await sendEducatorDecisionEmail({
        decision: nextStatus as "APPROVED" | "REJECTED",
        memberName: member.name,
        memberEmail: member.email,
        rejectReason: nextStatus === "REJECTED" ? rejectReason : null,
      });
    } catch (alertErr) {
      console.error("[admin/educators] decision email failed", alertErr);
    }

    return NextResponse.json({ ok: true, educatorStatus: nextStatus });
  } catch (err) {
    console.error("[admin/educators] patch failed", memberId, err);
    return bad("저장에 실패했습니다.", 500);
  }
}
