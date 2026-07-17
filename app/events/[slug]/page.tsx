// /events/[slug] — 공개 행사 상세. 공개 조건 미충족 시 404.
// 실제 신청 POST는 Step 3(Fable) — 여기선 상세 표시 + 폼 UI(placeholder 제출)까지.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  loadEventDetail,
  loadSameOfficeEvents,
} from "@/lib/education-public";
import { EventDetailClient } from "./EventDetailClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEventDetail(slug);
  if (!event) return { title: "행사를 찾을 수 없습니다 — Choonsim Hub" };
  return {
    title: `${event.title} — Choonsim Hub`,
    description:
      event.descriptionMd?.replace(/[#*\-]/g, "").slice(0, 120) ??
      "모빅회관 교육 행사",
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await loadEventDetail(slug);
  if (!event) notFound();

  const sameOffice = await loadSameOfficeEvents(event.officeId, event.id);

  return <EventDetailClient event={event} sameOffice={sameOffice} />;
}
