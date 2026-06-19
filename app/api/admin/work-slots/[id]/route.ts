import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import { slotHasVerifiedReservation } from "@/lib/work-slot-reservation";

export const runtime = "nodejs";

async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const id = await parseId(ctx.params);
  if (id == null) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    const slot = await prisma.workSlot.findUnique({
      where: { id },
      select: {
        id: true,
        adminUserId: true,
        officeId: true,
        date: true,
        startTime: true,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { ok: false, error: "슬롯을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (slot.adminUserId !== admin.adminUserId) {
      return NextResponse.json(
        { ok: false, error: "본인 슬롯만 삭제할 수 있습니다." },
        { status: 403 },
      );
    }

    const reserved = await slotHasVerifiedReservation(slot);
    if (reserved) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "일정 확정(VERIFIED) 예약이 배정된 슬롯은 삭제할 수 없습니다.",
        },
        { status: 409 },
      );
    }

    await prisma.workSlot.delete({ where: { id } });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/work-slots/:id] delete failed", id, code);
    if (code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "슬롯을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "슬롯 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
