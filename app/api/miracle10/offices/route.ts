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
    // 회관 목록은 거의 불변 — CDN 10분 + SWR 1시간 (Step 11: 콜드스타트+Neon 커넥션 비용 제거)
    return NextResponse.json(
      { ok: true, offices },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[miracle10/offices] list failed", code);
    return NextResponse.json(
      { ok: false, error: "사무실 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
