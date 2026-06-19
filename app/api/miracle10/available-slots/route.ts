import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compareKstYmd, isKstYmd } from "@/lib/kst";
import {
  getDaySummaries,
  getSlotAvailabilityForDate,
} from "@/lib/available-slots";

export const runtime = "nodejs";

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const officeId = Number(searchParams.get("officeId"));
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!Number.isInteger(officeId) || officeId <= 0) {
    return bad("officeId가 필요합니다.");
  }

  try {
    const office = await prisma.office.findFirst({
      where: { id: officeId, isActive: true },
      select: { id: true },
    });
    if (!office) {
      return bad("사무실을 찾을 수 없습니다.", 404);
    }

    if (date) {
      if (!isKstYmd(date)) {
        return bad("date 형식은 YYYY-MM-DD 입니다.");
      }
      const slots = await getSlotAvailabilityForDate(officeId, date);
      return NextResponse.json({
        ok: true,
        officeId,
        date,
        slots,
      });
    }

    if (from) {
      if (!isKstYmd(from)) {
        return bad("from 형식은 YYYY-MM-DD 입니다.");
      }
      const toDate = to && isKstYmd(to) ? to : from;
      if (!isKstYmd(toDate) || compareKstYmd(from, toDate) > 0) {
        return bad("to 형식 또는 범위가 올바르지 않습니다.");
      }
      const days = await getDaySummaries(officeId, from, toDate);
      return NextResponse.json({
        ok: true,
        officeId,
        from,
        to: toDate,
        days,
      });
    }

    return bad("date 또는 from 파라미터가 필요합니다.");
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[miracle10/available-slots] failed", code);
    return NextResponse.json(
      { ok: false, error: "예약 가능 시간을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
