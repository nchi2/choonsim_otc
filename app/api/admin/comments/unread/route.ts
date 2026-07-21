import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, maskName } from "@/lib/admin-guard";
import { getUnreadCommentTargets } from "@/lib/order-comments";

export const runtime = "nodejs";

// 읽기 전용 — 내 안읽음 코멘트가 있는 신청 목록 (헤더 벨 드롭다운). 상태 변경 없음.
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const targets = await getUnreadCommentTargets(admin.adminUserId);

    // 신청명(이름) 배치 조회
    const m10Ids = targets
      .filter((t) => t.targetType === "MIRACLE10")
      .map((t) => t.targetId);
    const otcIds = targets
      .filter((t) => t.targetType === "OTC_REQUEST")
      .map((t) => t.targetId);
    const eduIds = targets
      .filter((t) => t.targetType === "EDUCATION_EVENT")
      .map((t) => t.targetId);

    const [orders, requests, events] = await Promise.all([
      m10Ids.length
        ? prisma.otcOrder.findMany({
            where: { id: { in: m10Ids } },
            select: { id: true, customer: { select: { name: true } } },
          })
        : Promise.resolve([]),
      otcIds.length
        ? prisma.otcRequest.findMany({
            where: { id: { in: otcIds } },
            select: { id: true, name: true, side: true },
          })
        : Promise.resolve([]),
      eduIds.length
        ? prisma.educationEvent.findMany({
            where: { id: { in: eduIds } },
            select: { id: true, title: true },
          })
        : Promise.resolve([]),
    ]);

    const m10Name = new Map(orders.map((o) => [o.id, o.customer.name]));
    const otcName = new Map(requests.map((r) => [r.id, r.name]));
    const eduTitle = new Map(events.map((e) => [e.id, e.title]));

    const items = targets.map((t) => {
      // 교육 행사는 개인정보가 아니라 제목 그대로 노출(마스킹 없음)
      if (t.targetType === "EDUCATION_EVENT") {
        return {
          targetType: t.targetType,
          targetId: t.targetId,
          name: eduTitle.get(t.targetId) ?? "(삭제됨)",
          unread: t.unread,
          lastBody: t.lastBody.slice(0, 80),
          lastAuthorName: t.lastAuthorName,
          lastCreatedAt: t.lastCreatedAt.toISOString(),
          href: `/admin/education/${t.targetId}`,
        };
      }
      const rawName =
        t.targetType === "MIRACLE10"
          ? m10Name.get(t.targetId)
          : otcName.get(t.targetId);
      return {
        targetType: t.targetType,
        targetId: t.targetId,
        name: rawName ? maskName(rawName) : "(삭제됨)",
        unread: t.unread,
        lastBody: t.lastBody.slice(0, 80),
        lastAuthorName: t.lastAuthorName,
        lastCreatedAt: t.lastCreatedAt.toISOString(),
        href:
          t.targetType === "MIRACLE10"
            ? `/admin/miracle10/${t.targetId}`
            : `/admin/otc-requests/${t.targetId}`,
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/comments/unread] failed", code);
    return NextResponse.json(
      { ok: false, error: "알림을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
