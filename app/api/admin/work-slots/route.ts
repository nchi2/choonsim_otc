import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import { compareKstYmd, isKstYmd } from "@/lib/kst";
import {
  isAllowedSlotTime,
  isSlotRegistrationAllowed,
} from "@/lib/work-schedule";

export const runtime = "nodejs";

function mapSlot(row: {
  id: number;
  adminUserId: number;
  officeId: number;
  date: string;
  startTime: string;
  adminUser: { username: string; displayName: string };
}) {
  return {
    id: row.id,
    adminUserId: row.adminUserId,
    adminUserName: row.adminUser.username,
    adminDisplayName: row.adminUser.displayName,
    officeId: row.officeId,
    date: row.date,
    startTime: row.startTime,
  };
}

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const officeIdRaw = searchParams.get("officeId");
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  // mine=1 + officeId 생략 = 본인 슬롯 전 사무실 조회 (프로필 요약 — 사무실별 N회 호출 제거)
  const mineOnly = searchParams.get("mine") === "1";

  const officeId = Number(officeIdRaw);
  const hasOffice = Number.isInteger(officeId) && officeId > 0;
  if (!hasOffice && !mineOnly) {
    return NextResponse.json(
      { ok: false, error: "officeId가 필요합니다." },
      { status: 400 },
    );
  }

  let dateParam: string | null = null;
  let fromParam: string | null = null;
  let toParam: string | null = null;

  if (date) {
    if (!isKstYmd(date)) {
      return NextResponse.json(
        { ok: false, error: "date 형식은 YYYY-MM-DD 입니다." },
        { status: 400 },
      );
    }
    dateParam = date;
  } else if (from && to) {
    if (!isKstYmd(from) || !isKstYmd(to) || compareKstYmd(from, to) > 0) {
      return NextResponse.json(
        { ok: false, error: "from/to 형식 또는 범위가 올바르지 않습니다." },
        { status: 400 },
      );
    }
    fromParam = from;
    toParam = to;
  } else if (from) {
    if (!isKstYmd(from)) {
      return NextResponse.json(
        { ok: false, error: "from 형식은 YYYY-MM-DD 입니다." },
        { status: 400 },
      );
    }
    fromParam = from;
  } else {
    return NextResponse.json(
      { ok: false, error: "date 또는 from(+to) 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    if (hasOffice) {
      const office = await prisma.office.findUnique({
        where: { id: officeId },
        select: { id: true },
      });
      if (!office) {
        return NextResponse.json(
          { ok: false, error: "사무실을 찾을 수 없습니다." },
          { status: 404 },
        );
      }
    }

    const dateWhere =
      dateParam != null
        ? dateParam
        : toParam != null
          ? { gte: fromParam!, lte: toParam }
          : { gte: fromParam! };

    const slots = await prisma.workSlot.findMany({
      where: {
        ...(hasOffice ? { officeId } : {}),
        ...(mineOnly ? { adminUserId: admin.adminUserId } : {}),
        date: dateWhere,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        adminUser: { select: { username: true, displayName: true } },
        office: { select: { name: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      items: slots.map((s) => ({ ...mapSlot(s), officeName: s.office.name })),
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/work-slots] list failed", code);
    return NextResponse.json(
      { ok: false, error: "슬롯 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { officeId?: unknown; date?: unknown; startTimes?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const officeId = Number(body.officeId);
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const startTimes = Array.isArray(body.startTimes)
    ? body.startTimes.filter((t): t is string => typeof t === "string")
    : [];

  if (!Number.isInteger(officeId) || officeId <= 0) {
    return NextResponse.json(
      { ok: false, error: "officeId가 올바르지 않습니다." },
      { status: 400 },
    );
  }
  if (!isKstYmd(date)) {
    return NextResponse.json(
      { ok: false, error: "date 형식은 YYYY-MM-DD 입니다." },
      { status: 400 },
    );
  }
  if (!isSlotRegistrationAllowed(date)) {
    return NextResponse.json(
      { ok: false, error: "과거·휴무일에는 슬롯을 등록할 수 없습니다." },
      { status: 400 },
    );
  }
  if (startTimes.length === 0) {
    return NextResponse.json(
      { ok: false, error: "startTimes가 비어 있습니다." },
      { status: 400 },
    );
  }

  const uniqueTimes = [...new Set(startTimes)];
  if (uniqueTimes.some((t) => !isAllowedSlotTime(t))) {
    return NextResponse.json(
      { ok: false, error: "영업시간 내 30분 단위 슬롯만 등록할 수 있습니다." },
      { status: 400 },
    );
  }

  try {
    const office = await prisma.office.findUnique({
      where: { id: officeId },
      select: { id: true },
    });
    if (!office) {
      return NextResponse.json(
        { ok: false, error: "사무실을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const result = await prisma.workSlot.createMany({
      data: uniqueTimes.map((startTime) => ({
        adminUserId: admin.adminUserId,
        officeId,
        date,
        startTime,
      })),
      skipDuplicates: true,
    });

    const items = await prisma.workSlot.findMany({
      where: {
        adminUserId: admin.adminUserId,
        officeId,
        date,
        startTime: { in: uniqueTimes },
      },
      include: {
        adminUser: { select: { username: true, displayName: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({
      ok: true,
      created: result.count,
      skipped: uniqueTimes.length - result.count,
      items: items.map(mapSlot),
    });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/work-slots] create failed", code);
    return NextResponse.json(
      { ok: false, error: "슬롯 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
