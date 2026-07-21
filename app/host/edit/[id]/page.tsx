// /host/edit/[id] — 교육자 본인 행사 수정 (Step 15). HostFormClient 재사용(수정 모드).
// 서버 게이트: 로그인 + 본인 소유(hostMemberId) 확인. 남의 행사/미로그인은 이탈.
// PENDING/REJECTED=전 항목, APPROVED=안내성 필드만(폼 잠금 + API 거부), CANCELED=수정 불가.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";
import { loadActiveOffices } from "@/lib/education-public";
import { HostFormClient, type HostFormInitial } from "../../HostFormClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "행사 수정 — Choonsim Hub",
};

export default async function HostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) redirect("/mypage");

  const session = await getMemberUser();
  if (!session) redirect(`/login?next=/host/edit/${id}`);

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { id: true, name: true, email: true, phone: true, status: true },
  });
  if (!member || member.status !== "ACTIVE") redirect("/login");

  const event = await prisma.educationEvent.findUnique({
    where: { id },
    select: {
      hostMemberId: true,
      status: true,
      rejectReason: true,
      posterUrl: true,
      title: true,
      category: true,
      mode: true,
      streamUrl: true,
      descriptionMd: true,
      instructorName: true,
      instructorBio: true,
      officeId: true,
      customLocation: true,
      capacity: true,
      feeKrw: true,
      depositBankName: true,
      depositAccountNo: true,
      depositAccountHolder: true,
      eligibility: true,
      preparation: true,
      reward: true,
      refundPolicy: true,
      notice: true,
      applyDeadline: true,
      sessions: {
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        select: { date: true, startTime: true, endTime: true },
      },
    },
  });
  // 소유권 불일치·미존재·취소 → 마이페이지로 (존재 은닉)
  if (!event || event.hostMemberId !== member.id || event.status === "CANCELED") {
    redirect("/mypage");
  }

  const initial: HostFormInitial = {
    status: event.status,
    rejectReason: event.rejectReason,
    posterUrl: event.posterUrl,
    title: event.title,
    category: event.category,
    mode: event.mode,
    streamUrl: event.streamUrl,
    descriptionMd: event.descriptionMd,
    instructorName: event.instructorName,
    instructorBio: event.instructorBio,
    officeId: event.officeId,
    customLocation: event.customLocation,
    capacity: event.capacity,
    feeKrw: event.feeKrw,
    depositBankName: event.depositBankName,
    depositAccountNo: event.depositAccountNo,
    depositAccountHolder: event.depositAccountHolder,
    eligibility: event.eligibility,
    preparation: event.preparation,
    reward: event.reward,
    refundPolicy: event.refundPolicy,
    notice: event.notice,
    applyDeadline: event.applyDeadline
      ? event.applyDeadline.toISOString().slice(0, 10)
      : null,
    sessions: event.sessions,
  };

  const offices = await loadActiveOffices();
  return (
    <HostFormClient
      offices={offices}
      host={{ name: member.name, email: member.email, phone: member.phone }}
      initial={initial}
      editId={id}
    />
  );
}
