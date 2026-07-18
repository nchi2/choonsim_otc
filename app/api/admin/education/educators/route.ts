import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

// 교육자 신청 목록 — status 필터(PENDING/APPROVED/REJECTED/ALL) + 건수. 읽기는 전 운영자.
// (신청 소개·활동 계획은 educatorIntro 저장분을 함께 반환 — 12A.)

const VALID = new Set(["PENDING", "APPROVED", "REJECTED"]);

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  const baseWhere = { educatorStatus: { not: "NONE" } };
  const where =
    statusParam && VALID.has(statusParam)
      ? { educatorStatus: statusParam }
      : baseWhere;

  try {
    const [rows, grouped] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { educatorAppliedAt: "desc" },
        take: 200,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailVerifiedAt: true,
          createdAt: true,
          educatorStatus: true,
          educatorIntro: true,
          educatorRejectReason: true,
          educatorAppliedAt: true,
          educatorApprovedAt: true,
          _count: { select: { hostedEvents: true } },
        },
      }),
      prisma.member.groupBy({
        by: ["educatorStatus"],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);

    const countOf = (s: string) =>
      grouped.find((g) => g.educatorStatus === s)?._count._all ?? 0;
    const counts = {
      PENDING: countOf("PENDING"),
      APPROVED: countOf("APPROVED"),
      REJECTED: countOf("REJECTED"),
      total: grouped.reduce((sum, g) => sum + g._count._all, 0),
    };

    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      emailVerified: r.emailVerifiedAt != null,
      joinedAt: r.createdAt,
      educatorStatus: r.educatorStatus,
      educatorIntro: r.educatorIntro,
      educatorRejectReason: r.educatorRejectReason,
      educatorAppliedAt: r.educatorAppliedAt,
      educatorApprovedAt: r.educatorApprovedAt,
      hostedEventCount: r._count.hostedEvents,
    }));

    return NextResponse.json({ ok: true, counts, items });
  } catch (err) {
    console.error("[admin/education/educators] list failed", err);
    return NextResponse.json(
      { ok: false, error: "목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
