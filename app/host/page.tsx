// /host — 행사 개설 신청(무계정 폼). 교육자가 강의/이벤트 개설을 신청.
// 제출 시 status=PENDING 스냅샷 생성이 목표지만, 실제 POST·검증·알림은 Step 3~5(Fable).
// 지금은 폼 UI 중심 + 제출 placeholder. 활성 회관만 서버에서 로드해 선택지로 전달.

import type { Metadata } from "next";
import { loadActiveOffices } from "@/lib/education-public";
import { HostFormClient } from "./HostFormClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "행사 개설 신청 — Choonsim Hub",
  description: "모빅회관에서 강의·워크숍·이벤트를 열고 싶은 교육자를 위한 개설 신청.",
};

export default async function HostPage() {
  const offices = await loadActiveOffices();
  return <HostFormClient offices={offices} />;
}
