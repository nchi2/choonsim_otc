import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** 손님용 — isActive 사무실만 노출. */
export async function GET() {
  try {
    const offices = await prisma.office.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
      },
    });
    return NextResponse.json({ ok: true, offices });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[miracle10/offices] list failed", code);
    return NextResponse.json(
      { ok: false, error: "사무실 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
