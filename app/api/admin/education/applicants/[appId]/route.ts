import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducationManager } from "@/lib/education-admin-guard";

export const runtime = "nodejs";

// 신청자 체크 저장 — 입금 확인(paidConfirmedAt)·출석(attendedAt) 토글.
// body: { paidConfirmed?: boolean, attended?: boolean } — true=현재시각 기록, false=해제(null).
// EventApplication에는 감사 필드가 없어(스키마 무변경 원칙) 별도 감사 기록은 남기지 않는다.

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ appId: string }> },
) {
  const gate = await requireEducationManager();
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status },
    );
  }

  const { appId: raw } = await ctx.params;
  const appId = Number(raw);
  if (!Number.isInteger(appId) || appId <= 0) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  let body: { paidConfirmed?: unknown; attended?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const data: { paidConfirmedAt?: Date | null; attendedAt?: Date | null } = {};
  if (body.paidConfirmed !== undefined) {
    if (typeof body.paidConfirmed !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "paidConfirmed 값이 올바르지 않습니다." },
        { status: 400 },
      );
    }
    data.paidConfirmedAt = body.paidConfirmed ? new Date() : null;
  }
  if (body.attended !== undefined) {
    if (typeof body.attended !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "attended 값이 올바르지 않습니다." },
        { status: 400 },
      );
    }
    data.attendedAt = body.attended ? new Date() : null;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "변경할 항목이 없습니다." },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.eventApplication.update({
      where: { id: appId },
      data,
      select: { id: true, paidConfirmedAt: true, attendedAt: true },
    });
    return NextResponse.json({ ok: true, application: updated });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    if (code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "신청을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    console.error("[admin/education/applicants/:appId] patch failed", appId, code);
    return NextResponse.json(
      { ok: false, error: "저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
