// 어드민 집계 — /api/admin/stats 와 /api/admin/dashboard 가 공유하는 유일한 계산 위치.
// 모든 집계는 기본 isTest=false (테스트 데이터 제외).
import { prisma } from "@/lib/prisma";
import { OrderKind, OrderStatus } from "@/app/generated/prisma/client";
import { computeWalletTotals } from "@/lib/wallet-inventory";
import { getGlobalUnreadCount } from "@/lib/order-comments";
import { paperWalletCountToPrepare } from "@/lib/otc-estimate";

export interface AdminStats {
  // 10모 flat 키 — AdminShell 배지 등 기존 소비처 호환. 절대 이름 바꾸지 말 것.
  total: number;
  pending: number;
  contacted: number;
  verified: number;
  completed: number;
  canceled: number;
  active: number;
  otc: {
    total: number;
    pending: number;
    contacted: number;
    agreed: number;
    completed: number;
    canceled: number;
  };
  /** OTC 접수 flat — 헤더 배지용 */
  otcPending: number;
  /** 내(세션) 전역 안읽음 코멘트 총합 */
  commentUnread: number;
  // 지갑 flat 키 — 기존 대시보드 호환
  walletStock: number;
  walletIn: number;
  walletOut: number;
  /** 지갑 확장 — stock(가용)·onOrder(발주 중)·reserved(확정 예약 소요 예상). 여유 = stock − reserved */
  wallet: { stock: number; onOrder: number; reserved: number };
}

export async function computeAdminStats(
  adminUserId: number,
): Promise<AdminStats> {
  const m10Base = { kind: OrderKind.MIRACLE10, isTest: false };

  const [m10Grouped, otcGrouped, walletTotals, commentUnread, verifiedRows] =
    await Promise.all([
      prisma.otcOrder.groupBy({
        by: ["status"],
        where: m10Base,
        _count: { _all: true },
      }),
      prisma.otcRequest.groupBy({
        by: ["status"],
        where: { isTest: false },
        _count: { _all: true },
      }),
      computeWalletTotals(),
      getGlobalUnreadCount(adminUserId),
      // reserved: 확정(VERIFIED) 건이 전부 나가면 필요한 종이지갑 장수
      // (손님 보유분 ownedPaperWalletCount 차감 — 거래기록에 장수가 있으면 그 값 우선)
      prisma.otcOrder.findMany({
        where: { ...m10Base, status: OrderStatus.VERIFIED },
        select: {
          paperWalletCount: true,
          quantity: true,
          ownedPaperWalletCount: true,
        },
      }),
    ]);

  const m10Count = (status: OrderStatus) =>
    m10Grouped.find((g) => g.status === status)?._count._all ?? 0;
  const total = m10Grouped.reduce((sum, g) => sum + g._count._all, 0);
  const pending = m10Count(OrderStatus.PENDING);
  const contacted = m10Count(OrderStatus.CONTACTED);
  const verified = m10Count(OrderStatus.VERIFIED);
  const completed = m10Count(OrderStatus.COMPLETED);
  const canceled = m10Count(OrderStatus.CANCELED);

  const otcCount = (status: string) =>
    otcGrouped.find((g) => g.status === status)?._count._all ?? 0;
  const otcTotal = otcGrouped.reduce((sum, g) => sum + g._count._all, 0);
  const otc = {
    total: otcTotal,
    pending: otcCount("PENDING"),
    contacted: otcCount("CONTACTED"),
    agreed: otcCount("AGREED"),
    completed: otcCount("COMPLETED"),
    canceled: otcCount("CANCELED"),
  };

  const reserved = verifiedRows.reduce(
    (sum, r) =>
      sum +
      (r.paperWalletCount ??
        paperWalletCountToPrepare(r.quantity, r.ownedPaperWalletCount)),
    0,
  );

  return {
    total,
    pending,
    contacted,
    verified,
    completed,
    canceled,
    active: total - completed - canceled,
    otc,
    otcPending: otc.pending,
    commentUnread,
    walletStock: walletTotals.stock,
    walletIn: walletTotals.inTotal,
    walletOut: walletTotals.outTotal,
    wallet: {
      stock: walletTotals.stock,
      onOrder: walletTotals.onOrder,
      reserved,
    },
  };
}
