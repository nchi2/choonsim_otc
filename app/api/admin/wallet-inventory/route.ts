import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { requireOtcManager } from "@/lib/admin-scope-guard";
import { isKstYmd, todayKst } from "@/lib/kst";
import {
  computeWalletTotals,
  isLedgerType,
  parseWalletAddresses,
} from "@/lib/wallet-inventory";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requireOtcManager();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  try {
    const [totals, entries] = await Promise.all([
      computeWalletTotals(),
      prisma.paperWalletLedger.findMany({
        orderBy: [{ entryDate: "desc" }, { id: "desc" }],
        take: 200,
        select: {
          id: true,
          createdAt: true,
          type: true,
          count: true,
          entryDate: true,
          memo: true,
          adminName: true,
          orderId: true,
          receiverName: true,
          status: true,
          expectedDate: true,
          linkedLedgerId: true,
          walletAddresses: true,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, totals, entries });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/wallet-inventory] list failed", code);
    return NextResponse.json(
      { ok: false, error: "재고를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const gate = await requireOtcManager();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }
  const admin = gate.admin;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  if (!isLedgerType(body.type)) {
    return NextResponse.json(
      {
        ok: false,
        error: "type은 IN(입고)/OUT(불출)/ORDER(발주)여야 합니다.",
      },
      { status: 400 },
    );
  }
  const type = body.type;

  const count =
    typeof body.count === "number" ? body.count : Number(body.count);
  if (!Number.isInteger(count) || count <= 0 || count > 100_000) {
    return NextResponse.json(
      { ok: false, error: "장수는 1 이상 정수여야 합니다." },
      { status: 400 },
    );
  }

  let entryDate = todayKst();
  if (body.entryDate !== undefined && body.entryDate !== null) {
    if (typeof body.entryDate !== "string" || !isKstYmd(body.entryDate)) {
      return NextResponse.json(
        { ok: false, error: "날짜 형식은 YYYY-MM-DD 입니다." },
        { status: 400 },
      );
    }
    entryDate = body.entryDate;
  }

  const memo =
    typeof body.memo === "string" && body.memo.trim()
      ? body.memo.trim().slice(0, 500)
      : null;

  let orderId: number | null = null;
  let receiverName: string | null = null;
  if (type === "OUT") {
    if (body.orderId !== undefined && body.orderId !== null && body.orderId !== "") {
      const n = typeof body.orderId === "number" ? body.orderId : Number(body.orderId);
      if (!Number.isInteger(n) || n <= 0) {
        return NextResponse.json(
          { ok: false, error: "신청 번호가 올바르지 않습니다." },
          { status: 400 },
        );
      }
      orderId = n;
    }
    if (typeof body.receiverName === "string" && body.receiverName.trim()) {
      receiverName = body.receiverName.trim().slice(0, 50);
    }
  }

  // IN 직접 등록 — 스캔한 지갑 주소 배열 저장(선택)
  let walletAddresses: string[] | null = null;
  if (type === "IN") {
    const parsed = parseWalletAddresses(body.walletAddresses);
    if (parsed === "invalid") {
      return NextResponse.json(
        { ok: false, error: "walletAddresses 값이 올바르지 않습니다." },
        { status: 400 },
      );
    }
    walletAddresses = parsed;
  }

  // ORDER(발주) — 예상 도착일(선택, YYYY-MM-DD → KST 자정). 재고와 무관한 기록.
  let expectedDate: Date | null = null;
  if (type === "ORDER" && body.expectedDate !== undefined && body.expectedDate !== null && body.expectedDate !== "") {
    if (
      typeof body.expectedDate !== "string" ||
      !isKstYmd(body.expectedDate)
    ) {
      return NextResponse.json(
        { ok: false, error: "예상 도착일 형식은 YYYY-MM-DD 입니다." },
        { status: 400 },
      );
    }
    expectedDate = new Date(`${body.expectedDate}T00:00:00+09:00`);
  }

  try {
    if (orderId != null) {
      const order = await prisma.otcOrder.findUnique({
        where: { id: orderId },
        select: { id: true, customer: { select: { name: true } } },
      });
      if (!order) {
        return NextResponse.json(
          { ok: false, error: `신청 #${orderId}을 찾을 수 없습니다.` },
          { status: 400 },
        );
      }
      if (!receiverName) receiverName = order.customer.name;
    }

    const entry = await prisma.paperWalletLedger.create({
      data: {
        type,
        count,
        entryDate,
        memo,
        adminUserId: admin.adminUserId,
        adminName: admin.displayName || admin.username,
        orderId,
        receiverName,
        ...(type === "ORDER" ? { status: "PENDING", expectedDate } : {}),
        ...(walletAddresses
          ? {
              walletAddresses:
                walletAddresses as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
      select: { id: true },
    });

    const totals = await computeWalletTotals();
    return NextResponse.json({ ok: true, id: entry.id, totals });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/wallet-inventory] create failed", code);
    return NextResponse.json(
      { ok: false, error: "등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
