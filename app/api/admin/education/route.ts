import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getAdminUser } from "@/lib/admin-guard";
import { todayKst } from "@/lib/kst";

export const runtime = "nodejs";

// 어드민 교육 행사 통합 목록 — status 필터(PENDING/APPROVED/REJECTED/ALL) + 서버 건수 집계.
// isTest 기본 제외(?includeTest=1 포함). 읽기 전용 — 승인/반려 등 쓰기는 4-B.

const VALID_STATUS = new Set(["PENDING", "APPROVED", "REJECTED"]);

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const includeTest = searchParams.get("includeTest") === "1";

  const baseWhere: Prisma.EducationEventWhereInput = includeTest
    ? {}
    : { isTest: false };
  const where: Prisma.EducationEventWhereInput = { ...baseWhere };
  if (statusParam && VALID_STATUS.has(statusParam)) {
    where.status = statusParam as "PENDING" | "APPROVED" | "REJECTED";
  }

  try {
    const today = todayKst();
    const [total, grouped, rows] = await Promise.all([
      prisma.educationEvent.count({ where }),
      prisma.educationEvent.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { _all: true },
      }),
      prisma.educationEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          category: true,
          mode: true,
          status: true,
          isPublished: true,
          isFeatured: true,
          isTest: true,
          capacity: true,
          feeKrw: true,
          customLocation: true,
          createdAt: true,
          office: { select: { name: true } },
          sessions: {
            orderBy: [{ date: "asc" }, { startTime: "asc" }],
            select: { date: true, startTime: true, endTime: true },
          },
          _count: {
            select: { applications: { where: { status: "APPLIED", isTest: false } } },
          },
        },
      }),
    ]);

    const countOf = (s: string) =>
      grouped.find((g) => g.status === s)?._count._all ?? 0;
    const counts = {
      PENDING: countOf("PENDING"),
      APPROVED: countOf("APPROVED"),
      REJECTED: countOf("REJECTED"),
      total: grouped.reduce((sum, g) => sum + g._count._all, 0),
    };

    const items = rows.map((r) => {
      const upcoming = r.sessions.find((s) => s.date >= today);
      const session = upcoming ?? r.sessions[r.sessions.length - 1] ?? null;
      return {
        id: r.id,
        title: r.title,
        category: r.category,
        mode: r.mode,
        status: r.status,
        isPublished: r.isPublished,
        isFeatured: r.isFeatured,
        isTest: r.isTest,
        capacity: r.capacity,
        feeKrw: r.feeKrw,
        locationName: r.office?.name ?? r.customLocation ?? null,
        createdAt: r.createdAt,
        session,
        sessionCount: r.sessions.length,
        applicationCount: r._count.applications,
      };
    });

    return NextResponse.json({ ok: true, total, counts, limit, offset, items });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/education] list failed", code);
    return NextResponse.json(
      { ok: false, error: "목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
