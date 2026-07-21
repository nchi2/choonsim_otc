import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";

export const runtime = "nodejs";

// 교육자 본인 행사 신청자 명단(GET) — 현장 출석·입금 확인용 (Step 18).
// ★ 소유권: hostMemberId === 세션 uid. 남의 행사는 404로 존재 은닉(Step 15 패턴).
// ★ 표시 최소화: 이름·연락처·입금자명·신청일시·상태·입금확인·출석만. 이메일·사전질문 등은 제외.
// 내보내기 없음(화면 열람만) — 대량 유출 위험 차단.

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getMemberUser();
  if (!session) return bad("unauthorized", 401);

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return bad("잘못된 id");

  try {
    const event = await prisma.educationEvent.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        capacity: true,
        feeKrw: true,
        hostMemberId: true,
      },
    });
    // 소유권 불일치·미존재는 동일하게 404(존재 은닉)
    if (!event || event.hostMemberId !== session.memberId) {
      return bad("행사를 찾을 수 없습니다.", 404);
    }

    const applications = await prisma.eventApplication.findMany({
      where: { eventId: id, isTest: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        contact: true,
        depositorName: true,
        status: true,
        paidConfirmedAt: true,
        attendedAt: true,
        createdAt: true,
      },
    });
    const appliedCount = applications.filter((a) => a.status === "APPLIED").length;

    return NextResponse.json({
      ok: true,
      event: {
        id: event.id,
        title: event.title,
        capacity: event.capacity,
        feeKrw: event.feeKrw,
      },
      applications,
      appliedCount,
    });
  } catch (err) {
    console.error("[member/hosted-events/:id/applicants] get failed", err);
    return bad("명단을 불러오지 못했습니다.", 500);
  }
}
