import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";
import { sendEducatorApplyAlert } from "@/lib/education-alerts";

export const runtime = "nodejs";

// 교육자 자격 신청 — NONE→PENDING, REJECTED→PENDING(재신청 허용·이전 사유 비움).
// PENDING/APPROVED 상태에선 중복 신청 차단. 소개·계획 텍스트는 저장 필드가 없어(스키마 무변경)
// 운영자 알림 메일로만 전달 — 어드민 화면 검토는 회원 프로필 기준.
// ★ 미들웨어(/api/member 보호) + getMemberUser 이중 가드.

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const session = await getMemberUser();
  if (!session) return bad("unauthorized", 401);

  let body: { intro?: unknown; plan?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return bad("잘못된 요청입니다.");
  }
  const intro =
    typeof body.intro === "string" && body.intro.trim()
      ? body.intro.trim().slice(0, 1000)
      : null;
  const plan =
    typeof body.plan === "string" && body.plan.trim()
      ? body.plan.trim().slice(0, 1000)
      : null;

  try {
    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        educatorStatus: true,
      },
    });
    if (!member) return bad("unauthorized", 401);

    if (member.educatorStatus === "PENDING") {
      return bad("이미 신청이 접수되어 검토 중입니다.", 409);
    }
    if (member.educatorStatus === "APPROVED") {
      return bad("이미 승인된 교육자입니다.", 409);
    }
    const isReapply = member.educatorStatus === "REJECTED";

    await prisma.member.update({
      where: { id: member.id },
      data: {
        educatorStatus: "PENDING",
        educatorAppliedAt: new Date(),
        educatorRejectReason: null, // 재신청 시 이전 사유 비움
      },
    });

    // 운영자 알림 — 실패해도 신청 성공 유지
    try {
      await sendEducatorApplyAlert({
        memberName: member.name,
        memberEmail: member.email,
        memberPhone: member.phone,
        intro,
        plan,
        isReapply,
      });
    } catch (alertErr) {
      console.error("[member/educator/apply] alert failed", alertErr);
    }

    return NextResponse.json({ ok: true, educatorStatus: "PENDING" });
  } catch (err) {
    console.error("[member/educator/apply] failed", err);
    return bad("신청에 실패했습니다.", 500);
  }
}
