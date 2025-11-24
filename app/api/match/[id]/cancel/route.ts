import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";
import { syncOrderBookLevels } from "@/lib/orderbook-sync";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);

    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    // Match 레코드 조회
    const match = await prisma.match.findUnique({
      where: { id: idNum },
    });

    if (!match) {
      return NextResponse.json(
        { error: "매칭 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 취소되었거나 완료된 경우
    if (match.status === REQUEST_STATUS.COMPLETED) {
      return NextResponse.json(
        { error: "이미 완료된 거래는 취소할 수 없습니다." },
        { status: 400 }
      );
    }

    // 판매건과 구매건 정보 조회
    const sellerRequest = await prisma.sellerRequest.findUnique({
      where: { id: match.sellerRequestId },
    });

    const buyerRequest = await prisma.buyerRequest.findUnique({
      where: { id: match.buyerRequestId },
    });

    if (!sellerRequest || !buyerRequest) {
      return NextResponse.json(
        { error: "판매건 또는 구매건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 트랜잭션으로 취소 처리
    const result = await prisma.$transaction(async (tx) => {
      // 판매건 remainingAmount 복구
      const newSellerRemaining = sellerRequest.remainingAmount + match.matchedAmount;
      const newSellerStatus =
        sellerRequest.status === REQUEST_STATUS.COMPLETED
          ? REQUEST_STATUS.LISTED
          : sellerRequest.status;

      await tx.sellerRequest.update({
        where: { id: match.sellerRequestId },
        data: {
          remainingAmount: newSellerRemaining,
          status: newSellerStatus,
        },
      });

      // 구매건 remainingAmount 복구
      const newBuyerRemaining = buyerRequest.remainingAmount + match.matchedAmount;
      const newBuyerStatus = REQUEST_STATUS.LISTED;

      await tx.buyerRequest.update({
        where: { id: match.buyerRequestId },
        data: {
          remainingAmount: newBuyerRemaining,
          status: newBuyerStatus,
        },
      });

      // Match 레코드 삭제
      await tx.match.delete({
        where: { id: idNum },
      });

      return {
        sellerRequestId: match.sellerRequestId,
        buyerRequestId: match.buyerRequestId,
        matchedAmount: match.matchedAmount,
      };
    });

    // OrderBookLevel 동기화 (allowPartial = true인 경우)
    if (sellerRequest.allowPartial) {
      try {
        await syncOrderBookLevels(sellerRequest.assetType);
      } catch (syncError) {
        console.error("OrderBookLevel sync failed after cancel:", syncError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `매칭이 취소되었습니다. 판매건과 구매건이 LISTED 상태로 복구되었습니다.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error canceling match:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "매칭 취소 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
