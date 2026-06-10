import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  OrderKind,
  OrderSide,
  AssetType,
  AssetSymbol,
  OrderStatus,
} from "@/app/generated/prisma/client";

export const runtime = "nodejs";

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function asTrimmed(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function isValidVisitDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const max = new Date(today);
  max.setDate(max.getDate() + 28);
  return d >= tomorrow && d <= max;
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

  // 직접 방문(예약)인 경우 예약 희망일·시간대는 필수.
  if (visitType === "RESERVED") {
    if (!visitDate) return bad("예약 희망일을 선택해 주세요.");
    if (!visitTimeSlot) return bad("방문 시간대를 선택해 주세요.");
  }
  const needUsdt = asTrimmed(body.needUsdt);
  const needBmb = asTrimmed(body.needBmb);
  const needFaceAuth = asTrimmed(body.needFaceAuth);
  const isSbmbMember = body.isSbmbMember === true;
  const memo = asTrimmed(body.memo);

  try {
    // 같은 연락처는 한 Customer로 묶되(upsert), 신청(OtcOrder)은 매번 새 행으로
    // 생성한다 → 동일인의 반복 신청을 정상 허용. 중복 차단/거부 로직 없음.
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
        visitTimeSlot,
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

    // 표시용 신청번호 — 접수 연도 + 레코드 id(불변·고유)로 결정론적으로 구성.
    // 별도 DB 컬럼 없이 id/createdAt에서 언제든 재구성 가능.
    const applicationNo = `M10-${order.createdAt.getFullYear()}-${String(
      order.id,
    ).padStart(4, "0")}`;

    return NextResponse.json({ ok: true, id: order.id, applicationNo });
  } catch (err) {
    // 개인정보 유출 방지: 입력값/에러 원문은 로깅하지 않고 Prisma 에러 코드만 남긴다.
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
