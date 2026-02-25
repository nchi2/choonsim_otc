import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";
import { syncOrderBookLevels } from "@/lib/orderbook-sync";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ buyerRequestId: string }> }
) {
  try {
    const { buyerRequestId } = await params;
    const idNum = parseInt(buyerRequestId, 10);

    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: "유효하지 않은 구매건 ID입니다." },
        { status: 400 }
      );
    }

    // 구매건 정보 조회
    const buyerRequest = await prisma.buyerRequest.findUnique({
      where: { id: idNum },
    });

    if (!buyerRequest) {
      return NextResponse.json(
        { error: "구매건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 해당 구매건과 연결된 모든 Match 레코드 조회
    const matches = await prisma.match.findMany({
      where: {
        buyerRequestId: idNum,
        status: {
          not: REQUEST_STATUS.COMPLETED, // 이미 완료된 매칭은 제외
        },
      },
    });

    if (matches.length === 0) {
      return NextResponse.json(
        { error: "취소할 매칭이 없습니다." },
        { status: 400 }
      );
    }

    // 판매건 ID 목록 수집
    const sellerIds = [...new Set(matches.map((m) => m.sellerRequestId))];

    // 판매건 정보 조회
    const sellerRequests = await prisma.sellerRequest.findMany({
      where: {
        id: { in: sellerIds },
      },
    });

    if (sellerRequests.length === 0) {
      return NextResponse.json(
        { error: "관련된 판매건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 판매건 정보를 Map으로 변환 (빠른 조회를 위해)
    const sellerMap = new Map(
      sellerRequests.map((seller) => [seller.id, seller])
    );

    // 거래 그룹 조회
    const tradeGroup = await prisma.tradeGroup.findUnique({
      where: {
        buyerRequestId: idNum,
      },
    });

    // 트랜잭션으로 취소 처리
    const result = await prisma.$transaction(async (tx) => {
      // 각 판매건의 remainingAmount 복구
      for (const match of matches) {
        const seller = sellerMap.get(match.sellerRequestId);
        if (!seller) continue;

        const newSellerRemaining = seller.remainingAmount + match.matchedAmount;
        const newSellerStatus =
          seller.status === REQUEST_STATUS.COMPLETED
            ? REQUEST_STATUS.LISTED
            : seller.status;

        await tx.sellerRequest.update({
          where: { id: match.sellerRequestId },
          data: {
            remainingAmount: newSellerRemaining,
            status: newSellerStatus,
          },
        });
      }

      // 구매건 remainingAmount 복구 (모든 매칭 수량 합계)
      const totalMatchedAmount = matches.reduce(
        (sum, match) => sum + match.matchedAmount,
        0
      );
      const newBuyerRemaining =
        buyerRequest.remainingAmount + totalMatchedAmount;

      await tx.buyerRequest.update({
        where: { id: idNum },
        data: {
          remainingAmount: newBuyerRemaining,
          status: REQUEST_STATUS.LISTED,
        },
      });

      // 모든 Match 레코드 삭제
      await tx.match.deleteMany({
        where: {
          buyerRequestId: idNum,
          id: { in: matches.map((m) => m.id) },
        },
      });

      // 거래 그룹 삭제
      if (tradeGroup) {
        await tx.tradeGroup.delete({
          where: {
            buyerRequestId: idNum,
          },
        });
      }

      return {
        buyerRequestId: idNum,
        canceledMatches: matches.length,
        totalMatchedAmount,
      };
    });

    // OrderBookLevel 동기화 (allowPartial = true인 판매건이 있는 경우)
    const hasPartialSeller = sellerRequests.some((s) => s.allowPartial);
    if (hasPartialSeller) {
      try {
        await syncOrderBookLevels(buyerRequest.assetType);
      } catch (syncError) {
        console.error("OrderBookLevel sync failed after cancel:", syncError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `거래 그룹이 취소되었습니다. ${result.canceledMatches}개의 매칭이 취소되었고, 판매건과 구매건이 LISTED 상태로 복구되었습니다.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error canceling trade group:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "거래 그룹 취소 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
