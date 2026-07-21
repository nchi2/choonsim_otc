import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";

export const runtime = "nodejs";

// 내 신청 내역 — 로그인 상태로 신청한(memberId 연결) 행사만. 읽기 전용.
// ★ 미들웨어(/api/member 보호) + getMemberUser 이중 가드. 비로그인 신청 건은 애초에 memberId=null이라 안 잡힘.

export async function GET() {
  const session = await getMemberUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.eventApplication.findMany({
      where: { memberId: session.memberId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        contact: true,
        depositorName: true,
        status: true,
        createdAt: true,
        paidConfirmedAt: true,
        attendedAt: true,
        session: { select: { date: true, startTime: true, endTime: true } },
        event: {
          select: {
            title: true,
            slug: true,
            feeKrw: true,
            customLocation: true,
            office: { select: { name: true } },
            depositBankName: true,
            depositAccountNo: true,
            depositAccountHolder: true,
            refundPolicy: true,
          },
        },
      },
    });

    const items = rows.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      paid: r.paidConfirmedAt != null,
      attended: r.attendedAt != null,
      session: r.session,
      eventTitle: r.event.title,
      eventSlug: r.event.slug,
      feeKrw: r.event.feeKrw,
      locationName: r.event.office?.name ?? r.event.customLocation ?? null,
      // Step 21: 마이페이지 재확인용(입금 안내 다시 보기) — 신청 시 제출한 값 + 행사 계좌 정보
      name: r.name,
      contact: r.contact,
      depositorName: r.depositorName,
      depositBankName: r.event.depositBankName,
      depositAccountNo: r.event.depositAccountNo,
      depositAccountHolder: r.event.depositAccountHolder,
      refundPolicy: r.event.refundPolicy,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[member/applications] failed", err);
    return NextResponse.json(
      { ok: false, error: "신청 내역을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
