import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducationManager } from "@/lib/education-admin-guard";
import { sendEducationReminders } from "@/lib/education-alerts";

export const runtime = "nodejs";

// 행사 전일 리마인더 — 수동 트리거(어드민 버튼). 크론 없음(Step 6 이후 자동화 검토).
// 수신: 해당 행사 APPLIED 신청자 중 contact가 이메일 형태(@)인 사람.
// (EventApplication에 이메일 필드가 없어 전화번호 신청자는 skippedNoEmail로 집계 — 스키마 무변경 제약)

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireEducationManager();
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status },
    );
  }

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    const event = await prisma.educationEvent.findUnique({
      where: { id },
      select: {
        title: true,
        slug: true,
        customLocation: true,
        preparation: true,
        notice: true,
        office: { select: { name: true } },
        sessions: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          select: { date: true, startTime: true, endTime: true },
        },
        applications: {
          where: { status: "APPLIED", isTest: false },
          select: { name: true, contact: true },
        },
      },
    });
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "행사를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const result = await sendEducationReminders({
      eventTitle: event.title,
      slug: event.slug,
      locationName: event.office?.name ?? event.customLocation ?? null,
      sessions: event.sessions,
      preparation: event.preparation,
      notice: event.notice,
      recipients: event.applications,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/education/:id/remind] failed", id, code);
    return NextResponse.json(
      { ok: false, error: "리마인더 발송에 실패했습니다." },
      { status: 500 },
    );
  }
}
