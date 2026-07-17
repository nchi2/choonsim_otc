import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

// 어드민 교육 행사 상세 — 전체 필드 + 세션 + 신청 수. 읽기 전용(편집/승인 저장은 4-B).

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    const event = await prisma.educationEvent.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        mode: true,
        status: true,
        rejectReason: true,
        isPublished: true,
        isFeatured: true,
        isTest: true,
        posterUrl: true,
        descriptionMd: true,
        instructorName: true,
        instructorBio: true,
        officeId: true,
        office: { select: { id: true, name: true } },
        customLocation: true,
        streamUrl: true,
        capacity: true,
        feeKrw: true,
        depositBankName: true,
        depositAccountNo: true,
        depositAccountHolder: true,
        eligibility: true,
        preparation: true,
        reward: true,
        refundPolicy: true,
        notice: true,
        applyDeadline: true,
        hostName: true,
        hostContact: true,
        hostEmail: true,
        lastEditedByName: true,
        lastEditedAt: true,
        createdAt: true,
        sessions: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          select: { id: true, date: true, startTime: true, endTime: true },
        },
        _count: {
          select: { applications: { where: { status: "APPLIED", isTest: false } } },
        },
      },
    });
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "행사를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/education/:id] get failed", code);
    return NextResponse.json(
      { ok: false, error: "상세를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
