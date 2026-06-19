import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  OrderKind,
  OrderSide,
  AssetType,
  AssetSymbol,
  OrderStatus,
} from "@/app/generated/prisma/client";
import { slotHasRemainingCapacity } from "@/lib/available-slots";
import { sendMiracle10ApplyAlert } from "@/lib/miracle10-apply-alert";
import {
  addDaysKstYmd,
  compareKstYmd,
  isKstYmd,
  slotEndTime,
  todayKst,
} from "@/lib/kst";
import { isAllowedSlotTime, isBusinessDayKst } from "@/lib/work-schedule";

export const runtime = "nodejs";

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function asTrimmed(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** 내일(KST)~28일 이내 영업일. */
function isValidVisitDate(s: string): boolean {
  if (!isKstYmd(s) || !isBusinessDayKst(s)) return false;
  const tomorrow = addDaysKstYmd(todayKst(), 1);
  const max = addDaysKstYmd(todayKst(), 28);
  return compareKstYmd(s, tomorrow) >= 0 && compareKstYmd(s, max) <= 0;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const name = asTrimmed(body.name) ?? "";
  const contact = asTrimmed(body.contact) ?? "";
  const quantity =
    typeof body.quantity === "number" ? body.quantity : Number(body.quantity);
  const visitType = asTrimmed(body.visitType) ?? "";
  const agreePrivacy = body.agreePrivacy === true;
  const agreeRisk = body.agreeRisk === true;
  const agreeP2p = body.agreeP2p === true;

  if (!name) return bad("이름을 입력해 주세요.");
  if (!contact)
    return bad("연락처(카카오톡 ID 또는 전화번호)를 입력해 주세요.");
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity % 10 !== 0) {
    return bad("수량은 10 단위의 양수여야 합니다.");
  }
  if (quantity > 100000) return bad("수량이 너무 큽니다.");
  if (!visitType) return bad("방문 방식을 선택해 주세요.");
  if (!agreePrivacy || !agreeRisk || !agreeP2p) {
    return bad("필수 동의 항목에 모두 동의해 주세요.");
  }

  const visitDate = asTrimmed(body.visitDate);
  if (visitDate && !isValidVisitDate(visitDate)) {
    return bad("방문 희망일은 내일부터 28일 이내로 선택해 주세요.");
  }

  const contactTimePref = asTrimmed(body.contactTimePref);
  const visitTimeSlot = asTrimmed(body.visitTimeSlot);
  const reservedStart = asTrimmed(body.reservedStart);
  const officeIdRaw = body.officeId;
  const officeId =
    officeIdRaw == null || officeIdRaw === ""
      ? null
      : Number(officeIdRaw);

  const needUsdt = asTrimmed(body.needUsdt);
  const needBmb = asTrimmed(body.needBmb);
  const needFaceAuth = asTrimmed(body.needFaceAuth);
  const isSbmbMember = body.isSbmbMember === true;
  const memo = asTrimmed(body.memo);

  let resolvedVisitTimeSlot = visitTimeSlot;
  let resolvedOfficeId: number | null = null;
  let resolvedOfficeName: string | null = null;
  let resolvedReservedStart: string | null = reservedStart;

  try {
    if (visitType === "RESERVED") {
      if (!visitDate) return bad("예약 희망일을 선택해 주세요.");
      if (!Number.isInteger(officeId) || officeId! <= 0) {
        return bad("방문 사무실을 선택해 주세요.");
      }
      if (!reservedStart || !isAllowedSlotTime(reservedStart)) {
        return bad("방문 시간을 선택해 주세요.");
      }
      const end = slotEndTime(reservedStart);
      if (!end) return bad("방문 시간이 올바르지 않습니다.");

      const office = await prisma.office.findFirst({
        where: { id: officeId!, isActive: true },
        select: { id: true, name: true },
      });
      if (!office) {
        return bad("선택한 사무실을 이용할 수 없습니다.");
      }

      const hasCapacity = await slotHasRemainingCapacity(
        officeId!,
        visitDate,
        reservedStart,
      );
      if (!hasCapacity) {
        return bad("선택한 시간은 예약이 마감되었습니다. 다른 시간을 선택해 주세요.");
      }

      resolvedOfficeId = officeId!;
      resolvedOfficeName = office.name;
      resolvedReservedStart = reservedStart;
      resolvedVisitTimeSlot = visitTimeSlot ?? `${reservedStart}-${end}`;
    }

    if (visitType === "RESERVED" && !resolvedVisitTimeSlot) {
      return bad("방문 시간대를 선택해 주세요.");
    }

    const customer = await prisma.customer.upsert({
      where: { contact },
      update: { name },
      create: { name, contact },
      select: { id: true },
    });

    const order = await prisma.otcOrder.create({
      data: {
        kind: OrderKind.MIRACLE10,
        side: OrderSide.BUY,
        assetType: AssetType.COIN,
        asset: AssetSymbol.BMB,
        status: OrderStatus.PENDING,
        quantity,
        contactTimePref,
        visitType,
        visitDate,
        visitTimeSlot: resolvedVisitTimeSlot,
        officeId: visitType === "RESERVED" ? resolvedOfficeId : null,
        reservedStart:
          visitType === "RESERVED" ? resolvedReservedStart : null,
        needUsdt,
        needBmb,
        needFaceAuth,
        isSbmbMember,
        memo,
        agreePrivacy,
        agreeRisk,
        agreeP2p,
        customerId: customer.id,
      },
      select: { id: true, createdAt: true },
    });

    const applicationNo = `M10-${order.createdAt.getFullYear()}-${String(
      order.id,
    ).padStart(4, "0")}`;

    try {
      await sendMiracle10ApplyAlert({
        applicationNo,
        name,
        contact,
        quantity,
        visitType,
        visitDate,
        reservedStart:
          visitType === "RESERVED" ? resolvedReservedStart : null,
        visitTimeSlot: resolvedVisitTimeSlot,
        officeName: resolvedOfficeName,
        memo,
        createdAt: order.createdAt,
      });
    } catch (mailErr) {
      console.error(
        "[miracle10/apply] alert email failed",
        mailErr instanceof Error ? mailErr.message : mailErr,
      );
    }

    return NextResponse.json({ ok: true, id: order.id, applicationNo });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[miracle10/apply] failed", code);
    return NextResponse.json(
      {
        ok: false,
        error: "신청 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 },
    );
  }
}
