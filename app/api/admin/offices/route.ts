import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const offices = await prisma.office.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        isActive: true,
        educationActive: true,
        sortOrder: true,
      },
    });
    return NextResponse.json({ ok: true, offices });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/offices] list failed", code);
    return NextResponse.json(
      { ok: false, error: "사무실 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
