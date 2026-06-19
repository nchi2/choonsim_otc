import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-guard";
import { compareKstYmd, isKstYmd } from "@/lib/kst";
import { getScheduleReservations } from "@/lib/schedule-reservations";

export const runtime = "nodejs";

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const officeId = Number(searchParams.get("officeId"));
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!Number.isInteger(officeId) || officeId <= 0) {
    return bad("officeId가 필요합니다.");
  }
  if (!from || !isKstYmd(from)) {
    return bad("from 형식은 YYYY-MM-DD 입니다.");
  }
  const toDate = to && isKstYmd(to) ? to : from;
  if (!isKstYmd(toDate) || compareKstYmd(from, toDate) > 0) {
    return bad("to 형식 또는 범위가 올바르지 않습니다.");
  }

  try {
    const items = await getScheduleReservations(officeId, from, toDate);
    return NextResponse.json({ ok: true, officeId, from, to: toDate, items });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/schedule/reservations] failed", code);
    return NextResponse.json(
      { ok: false, error: "확정 예약을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
