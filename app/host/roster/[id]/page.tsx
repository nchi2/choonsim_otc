// /host/roster/[id] — 교육자 본인 행사 신청자 명단·출석 (Step 18).
// 서버 게이트: 로그인 + 본인 소유(hostMemberId). 남의 행사/미로그인은 이탈(존재 은닉).
// 실제 데이터·체크는 RosterClient가 /api/member/hosted-events/[id]/applicants 로 처리.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";
import { RosterClient } from "./RosterClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "신청자 명단 — Choonsim Hub",
};

export default async function RosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) redirect("/mypage");

  const session = await getMemberUser();
  if (!session) redirect(`/login?next=/host/roster/${id}`);

  const event = await prisma.educationEvent.findUnique({
    where: { id },
    select: { id: true, title: true, feeKrw: true, hostMemberId: true },
  });
  // 소유권 불일치·미존재 → 마이페이지(존재 은닉)
  if (!event || event.hostMemberId !== session.memberId) {
    redirect("/mypage");
  }

  return (
    <RosterClient
      eventId={event.id}
      title={event.title}
      isPaid={event.feeKrw > 0}
    />
  );
}
