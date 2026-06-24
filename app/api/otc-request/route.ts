import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isKstYmd } from "@/lib/kst";
import { isAllowedSlotTime, isBusinessDayKst } from "@/lib/work-schedule";

export const runtime = "nodejs";

const MIN_QUANTITY = 10;
const VALID_SIDES = new Set(["BUY", "SELL"]);

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function asTrimmed(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function normalizeSide(v: unknown): string | null {
  const s = asTrimmed(v)?.toUpperCase();
  if (!s || !VALID_SIDES.has(s)) return null;
  return s;
}

function parseOptionalInt(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseOfficeId(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseBankFields(
  body: Record<string, unknown>,
  prefix: "buyer" | "seller",
): { bankName: string | null; accountNo: string | null; accountHolder: string | null } {
  return {
    bankName: asTrimmed(body[`${prefix}BankName`]),
    accountNo: asTrimmed(body[`${prefix}AccountNo`]),
    accountHolder: asTrimmed(body[`${prefix}AccountHolder`]),
  };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const side = normalizeSide(body.side);
  const name = asTrimmed(body.name) ?? "";
  const contact = asTrimmed(body.contact) ?? "";
  const quantity =
    typeof body.quantity === "number" ? body.quantity : Number(body.quantity);
  const memo = asTrimmed(body.memo);

  if (!side) return bad("매수/판매 구분이 올바르지 않습니다.");
  if (!name) return bad("이름을 입력해 주세요.");
  if (!contact) return bad("연락처를 입력해 주세요.");
  if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY) {
    return bad(`수량은 최소 ${MIN_QUANTITY}개 이상이어야 합니다.`);
  }

  const desiredPrice = parseOptionalInt(body.desiredPrice);

  if (side === "BUY") {
    const receiveAddress = asTrimmed(body.receiveAddress);
    const visitDate = asTrimmed(body.visitDate);
    const reservedStart = asTrimmed(body.reservedStart);
    const officeId = parseOfficeId(body.officeId);
    const buyerBank = parseBankFields(body, "buyer");

    const hasSchedule = !!(visitDate || reservedStart || officeId);
    if (hasSchedule) {
      if (!visitDate || !isKstYmd(visitDate) || !isBusinessDayKst(visitDate)) {
        return bad("방문 희망일이 올바르지 않습니다.");
      }
      if (!reservedStart || !isAllowedSlotTime(reservedStart)) {
        return bad("방문 시간을 선택해 주세요.");
      }
      if (officeId == null) {
        return bad("방문 사무실을 선택해 주세요.");
      }
      const office = await prisma.office.findUnique({
        where: { id: officeId },
        select: { id: true },
      });
      if (!office) return bad("사무실을 찾을 수 없습니다.");
    }

    try {
      const row = await prisma.otcRequest.create({
        data: {
          side,
          name,
          contact,
          quantity,
          desiredPrice,
          receiveAddress,
          buyerBankName: buyerBank.bankName,
          buyerAccountNo: buyerBank.accountNo,
          buyerAccountHolder: buyerBank.accountHolder,
          visitDate: hasSchedule ? visitDate : null,
          reservedStart: hasSchedule ? reservedStart : null,
          officeId: hasSchedule ? officeId : null,
          memo,
          status: "PENDING",
        },
        select: { id: true },
      });
      return NextResponse.json({ ok: true, id: row.id });
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "unknown";
      console.error("[otc-request] buy create failed", code);
      return bad("신청 접수에 실패했습니다.", 500);
    }
  }

  // SELL
  const senderAddress = asTrimmed(body.senderAddress);
  const sellerBank = parseBankFields(body, "seller");

  try {
    const row = await prisma.otcRequest.create({
      data: {
        side,
        name,
        contact,
        quantity,
        desiredPrice,
        senderAddress,
        sellerBankName: sellerBank.bankName,
        sellerAccountNo: sellerBank.accountNo,
        sellerAccountHolder: sellerBank.accountHolder,
        memo,
        status: "PENDING",
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[otc-request] sell create failed", code);
    return bad("신청 접수에 실패했습니다.", 500);
  }
}
