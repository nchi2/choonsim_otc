import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";
import { sendEducatorCancelRequestAlert } from "@/lib/education-alerts";

export const runtime = "nodejs";

// 교육자 본인 행사 취소 (Step 15). 소유권(hostMemberId=세션 uid) 필수.
//  - PENDING/REJECTED: 즉시 CANCELED (비공개라 신청자 없음)
//  - APPROVED + APPLIED 0명: 즉시 CANCELED (+비공개)
//  - APPROVED + 신청자 ≥1: 직접 취소 불가 → 사유 필수, 운영자에게 취소 요청 메일(저장 없음)
//  - CANCELED: 400

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getMemberUser();
  if (!session) return bad("unauthorized", 401);
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return bad("잘못된 id");

  let body: { reason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 500)
      : null;

  try {
    const event = await prisma.educationEvent.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        hostMemberId: true,
        hostName: true,
        hostEmail: true,
        _count: {
          select: { applications: { where: { status: "APPLIED", isTest: false } } },
        },
      },
    });
    // 소유권 불일치 → 404 (존재 은닉)
    if (!event || event.hostMemberId !== session.memberId) {
      return bad("행사를 찾을 수 없습니다.", 404);
    }
    if (event.status === "CANCELED") return bad("이미 취소된 행사입니다.");

    const applied = event._count.applications;

    // 신청자 있는 승인 행사 — 직접 취소 불가, 운영자 요청으로 전환
    if (event.status === "APPROVED" && applied > 0) {
      if (!reason) {
        return bad("취소 사유를 입력해 주세요. 운영자에게 취소 요청이 전달됩니다.");
      }
      try {
        await sendEducatorCancelRequestAlert({
          eventId: event.id,
          eventTitle: event.title,
          applicationCount: applied,
          hostName: event.hostName ?? session.name,
          hostEmail: event.hostEmail ?? session.email,
          reason,
        });
      } catch (alertErr) {
        console.error("[hosted-events/cancel] request alert failed", alertErr);
        return bad("취소 요청 전달에 실패했습니다. 잠시 후 다시 시도해 주세요.", 500);
      }
      return NextResponse.json({ ok: true, requested: true });
    }

    // 즉시 취소 (PENDING/REJECTED, 또는 APPROVED+신청자 0)
    await prisma.educationEvent.update({
      where: { id },
      data: { status: "CANCELED", isPublished: false },
    });
    return NextResponse.json({ ok: true, canceled: true });
  } catch (err) {
    console.error("[member/hosted-events/:id/cancel] failed", err);
    return bad("취소에 실패했습니다.", 500);
  }
}
