import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";
import { isKstYmd, todayKst } from "@/lib/kst";

export const runtime = "nodejs";

const LEDGER_TYPES = ["IN", "OUT"] as const;
type LedgerType = (typeof LEDGER_TYPES)[number];

function isLedgerType(v: unknown): v is LedgerType {
  return typeof v === "string" && (LEDGER_TYPES as readonly string[]).includes(v);
}

async function computeTotals(): Promise<{
  inTotal: number;
  outTotal: number;
  stock: number;
}> {
  const grouped = await prisma.paperWalletLedger.groupBy({
    by: ["type"],
    _sum: { count: true },
  });
  const inTotal = grouped.find((g) => g.type === "IN")?._sum.count ?? 0;
  const outTotal = grouped.find((g) => g.type === "OUT")?._sum.count ?? 0;
  return { inTotal, outTotal, stock: inTotal - outTotal };
}

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const [totals, entries] = await Promise.all([
      computeTotals(),
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
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

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
      { ok: false, error: "type은 IN(입고)/OUT(불출)이어야 합니다." },
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
      },
      select: { id: true },
    });

    const totals = await computeTotals();
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
