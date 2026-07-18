import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEducationManager } from "@/lib/education-admin-guard";
import { isKstYmd } from "@/lib/kst";

export const runtime = "nodejs";

// 교육 회관 슬롯(EducationSlot) — GET 목록(전 운영자) + POST 등록(manageEducation).
// 선택 필터: ?officeId=&from=&to= (YMD). 기본은 날짜순 상위 200.

export async function GET(request: Request) {
  // Step 16: 교육 읽기(GET)에도 manageEducation 게이트(기본 전원 true — 아무도 안 막힘)
  const gate = await requireEducationManager();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const { searchParams } = new URL(request.url);
  const officeId = Number(searchParams.get("officeId")) || null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: {
    officeId?: number;
    date?: { gte?: string; lte?: string };
  } = {};
  if (officeId && Number.isInteger(officeId) && officeId > 0) where.officeId = officeId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }

  try {
    const slots = await prisma.educationSlot.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 200,
      select: {
        id: true,
        officeId: true,
        date: true,
        startTime: true,
        endTime: true,
        memo: true,
        office: { select: { name: true } },
      },
    });
    const items = slots.map((s) => ({
      id: s.id,
      officeId: s.officeId,
      officeName: s.office?.name ?? null,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      memo: s.memo,
    }));
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/education/slots] list failed", code);
    return NextResponse.json(
      { ok: false, error: "슬롯을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

// POST — 슬롯 등록. EducationSlot에는 등록자 필드가 없어(스키마 무변경) 소유 개념 없이
// 교육 관리 스코프 운영자 전원이 등록·삭제 가능.
const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export async function POST(request: Request) {
  const gate = await requireEducationManager();
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const officeId = Number(body.officeId);
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const startTime = typeof body.startTime === "string" ? body.startTime.trim() : "";
  const endTime = typeof body.endTime === "string" ? body.endTime.trim() : "";
  const memo =
    typeof body.memo === "string" && body.memo.trim()
      ? body.memo.trim().slice(0, 100)
      : null;

  if (!Number.isInteger(officeId) || officeId <= 0) {
    return NextResponse.json({ ok: false, error: "회관을 선택해 주세요." }, { status: 400 });
  }
  if (!isKstYmd(date)) {
    return NextResponse.json({ ok: false, error: "날짜가 올바르지 않습니다." }, { status: 400 });
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return NextResponse.json({ ok: false, error: "시간이 올바르지 않습니다." }, { status: 400 });
  }
  if (endTime <= startTime) {
    return NextResponse.json(
      { ok: false, error: "종료 시간은 시작 시간보다 늦어야 합니다." },
      { status: 400 },
    );
  }

  try {
    // Step 16: 교육 슬롯은 educationActive 회관만 허용(OTC isActive와 독립)
    const office = await prisma.office.findFirst({
      where: { id: officeId, educationActive: true },
      select: { id: true },
    });
    if (!office) {
      return NextResponse.json(
        { ok: false, error: "회관을 찾을 수 없습니다." },
        { status: 400 },
      );
    }
    const slot = await prisma.educationSlot.create({
      data: { officeId, date, startTime, endTime, memo },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: slot.id });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/education/slots] create failed", code);
    return NextResponse.json(
      { ok: false, error: "슬롯 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
