import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";

export const runtime = "nodejs";

// 교육자 본인 행사 신청자 입금확인·출석 체크(PATCH) — 현장 운영용 (Step 18).
// body: { paidConfirmed?: boolean, attended?: boolean } — true=현재시각 기록, false=해제(null).
// ★ 소유권 이중 확인: (1) 행사 hostMemberId === 세션 uid, (2) 신청의 eventId === 행사 id.
//    남의 행사·행사 불일치 신청은 404로 존재 은닉(Step 15 패턴). 어드민 체크 API와 동일한 필드·의미.

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string; appId: string }> },
) {
  const session = await getMemberUser();
  if (!session) return bad("unauthorized", 401);

  const { id: rawId, appId: rawAppId } = await ctx.params;
  const id = Number(rawId);
  const appId = Number(rawAppId);
  if (!Number.isInteger(id) || id <= 0) return bad("잘못된 id");
  if (!Number.isInteger(appId) || appId <= 0) return bad("잘못된 신청 id");

  let body: { paidConfirmed?: unknown; attended?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const data: { paidConfirmedAt?: Date | null; attendedAt?: Date | null } = {};
  if (body.paidConfirmed !== undefined) {
    if (typeof body.paidConfirmed !== "boolean") {
      return bad("paidConfirmed 값이 올바르지 않습니다.");
    }
    data.paidConfirmedAt = body.paidConfirmed ? new Date() : null;
  }
  if (body.attended !== undefined) {
    if (typeof body.attended !== "boolean") {
      return bad("attended 값이 올바르지 않습니다.");
    }
    data.attendedAt = body.attended ? new Date() : null;
  }
  if (Object.keys(data).length === 0) return bad("변경할 항목이 없습니다.");

  try {
    // (1) 행사 소유권
    const event = await prisma.educationEvent.findUnique({
      where: { id },
      select: { id: true, hostMemberId: true },
    });
    if (!event || event.hostMemberId !== session.memberId) {
      return bad("행사를 찾을 수 없습니다.", 404);
    }
    // (2) 신청이 이 행사 소속인지 — updateMany로 (id AND eventId) 조건 강제(타 행사 신청 조작 차단)
    const result = await prisma.eventApplication.updateMany({
      where: { id: appId, eventId: id },
      data,
    });
    if (result.count === 0) {
      return bad("신청을 찾을 수 없습니다.", 404);
    }
    const updated = await prisma.eventApplication.findUnique({
      where: { id: appId },
      select: { id: true, paidConfirmedAt: true, attendedAt: true },
    });
    return NextResponse.json({ ok: true, application: updated });
  } catch (err) {
    console.error(
      "[member/hosted-events/:id/applicants/:appId] patch failed",
      err,
    );
    return bad("저장에 실패했습니다.", 500);
  }
}
