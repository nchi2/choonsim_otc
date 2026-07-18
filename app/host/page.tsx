// /host — 행사 개설 신청. ★B-3: 로그인 + 교육자 승인(APPROVED) 필수 게이트.
//  - 비로그인 → /login?next=/host
//  - 로그인 + 미승인(NONE/PENDING/REJECTED) → 마이페이지 교육자 신청 안내(HostGateNotice)
//  - APPROVED → 개설 폼(개설자 정보는 회원 정보로 자동 — HostFormClient에 전달)
// (기존 무계정 개설 경로는 비활성 — 코드·필드는 보존, API도 동일 게이트)

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";
import { loadActiveOffices } from "@/lib/education-public";
import { HostFormClient } from "./HostFormClient";
import { HostGateNotice } from "./HostGateNotice";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "행사 개설 신청 — Choonsim Hub",
  description: "모빅회관에서 강의·워크숍·이벤트를 열고 싶은 교육자를 위한 개설 신청.",
};

export default async function HostPage() {
  const session = await getMemberUser();
  if (!session) redirect("/login?next=/host");

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      educatorStatus: true,
      status: true,
    },
  });
  if (!member || member.status !== "ACTIVE") redirect("/login?next=/host");

  if (member.educatorStatus !== "APPROVED") {
    return <HostGateNotice educatorStatus={member.educatorStatus} />;
  }

  const offices = await loadActiveOffices();
  return (
    <HostFormClient
      offices={offices}
      host={{ name: member.name, email: member.email, phone: member.phone }}
    />
  );
}
