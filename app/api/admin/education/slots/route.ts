import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

// 교육 회관 슬롯(EducationSlot) 목록 — 읽기 전용. 등록/삭제 쓰기는 4-B.
// 선택 필터: ?officeId=&from=&to= (YMD). 기본은 최근 등록 순 상위 200.

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
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
