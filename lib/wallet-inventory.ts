// 종이지갑 재고 집계 — 유일한 계산 위치.
// wallet-inventory API와 stats/dashboard가 전부 이 함수를 쓴다 (산식 이원화 금지).
import { prisma } from "@/lib/prisma";
import { addressDedupKey } from "@/app/scanner/lib/utils";

const MAX_WALLET_ADDRESSES = 500;

/** 입고 스캔 주소 배열 파싱 — 트림·소문자 기준 중복 제거. 형식 오류면 "invalid". */
export function parseWalletAddresses(v: unknown): string[] | null | "invalid" {
  if (v === undefined || v === null) return null;
  if (!Array.isArray(v) || v.length > MAX_WALLET_ADDRESSES) return "invalid";
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of v) {
    if (typeof item !== "string" || item.trim().length > 200) return "invalid";
    const t = item.trim();
    if (!t) continue;
    const key = addressDedupKey(t);
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(t);
  }
  return list.length > 0 ? list : null;
}

export const LEDGER_TYPES = ["IN", "OUT", "ORDER"] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export const ORDER_STATUSES = ["PENDING", "RECEIVED", "CANCELED"] as const;
export type LedgerOrderStatus = (typeof ORDER_STATUSES)[number];

export function isLedgerType(v: unknown): v is LedgerType {
  return typeof v === "string" && (LEDGER_TYPES as readonly string[]).includes(v);
}

export interface WalletTotals {
  inTotal: number;
  outTotal: number;
  /** 가용 재고 = IN합 − OUT합. ★ORDER(발주)는 절대 포함하지 않는다 — 별도 숫자. */
  stock: number;
  /** 발주(ORDER·PENDING) 수량 합 — 입고 예정 참고용 */
  onOrder: number;
}

export async function computeWalletTotals(): Promise<WalletTotals> {
  const [grouped, onOrderAgg] = await Promise.all([
    prisma.paperWalletLedger.groupBy({
      by: ["type"],
      where: { type: { in: ["IN", "OUT"] } },
      _sum: { count: true },
    }),
    prisma.paperWalletLedger.aggregate({
      where: { type: "ORDER", status: "PENDING" },
      _sum: { count: true },
    }),
  ]);
  const inTotal = grouped.find((g) => g.type === "IN")?._sum.count ?? 0;
  const outTotal = grouped.find((g) => g.type === "OUT")?._sum.count ?? 0;
  return {
    inTotal,
    outTotal,
    stock: inTotal - outTotal,
    onOrder: onOrderAgg._sum.count ?? 0,
  };
}
