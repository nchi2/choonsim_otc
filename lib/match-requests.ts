import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";
import { syncOrderBookLevels } from "@/lib/orderbook-sync";

interface MatchResult {
  success: boolean;
  matches?: Array<{
    sellerRequestId: number;
    matchedAmount: number;
  }>;
  message: string;
}

/**
 * 구매건을 판매건과 매칭하는 함수 (여러 판매건 순차 매칭)
 * @param buyerRequestId 구매 신청 ID
 * @returns 매칭 결과
 */
export async function matchBuyerRequest(
  buyerRequestId: number
): Promise<MatchResult> {
  try {
    // 구매건 정보 조회
    const buyerRequest = await prisma.buyerRequest.findUnique({
      where: { id: buyerRequestId },
    });

    if (!buyerRequest) {
      return {
        success: false,
        message: "구매 신청건을 찾을 수 없습니다.",
      };
    }

    // 이미 매칭되었거나 완료된 경우 매칭 시도하지 않음
    if (
      buyerRequest.status === REQUEST_STATUS.MATCHED ||
      buyerRequest.status === REQUEST_STATUS.COMPLETED
    ) {
      return {
        success: false,
        message: "이미 매칭되었거나 완료된 구매 신청입니다.",
      };
    }

    // 매칭 가능한 판매건 검색 (remainingAmount 기준)
    // 조건: 같은 assetType, 같은 price, status = LISTED, remainingAmount > 0
    const matchingSellers = await prisma.sellerRequest.findMany({
      where: {
        assetType: buyerRequest.assetType,
        price: buyerRequest.price, // 정확히 같은 가격
        status: REQUEST_STATUS.LISTED,
        remainingAmount: {
          gt: 0, // 남은 수량이 있어야 함
        },
      },
      orderBy: {
        createdAt: "asc", // 먼저 신청한 사람 우선
      },
    });

    if (matchingSellers.length === 0) {
      return {
        success: false,
        message: "매칭 가능한 판매건이 없습니다.",
      };
    }

    // 구매 수량만큼 순차적으로 매칭
    let remainingBuyAmount = buyerRequest.remainingAmount;
    const matches: Array<{
      sellerRequestId: number;
      matchedAmount: number;
    }> = [];

    // 트랜잭션으로 매칭 처리
    const result = await prisma.$transaction(async (tx) => {
      for (const seller of matchingSellers) {
        if (remainingBuyAmount <= 0) break;

        const matchedAmount = Math.min(
          remainingBuyAmount,
          seller.remainingAmount
        );

        // 판매건 remainingAmount 차감
        const newSellerRemaining = seller.remainingAmount - matchedAmount;
        const newSellerStatus =
          newSellerRemaining === 0
            ? REQUEST_STATUS.COMPLETED
            : REQUEST_STATUS.LISTED;

        await tx.sellerRequest.update({
          where: { id: seller.id },
          data: {
            remainingAmount: newSellerRemaining,
            status: newSellerStatus,
          },
        });

        // Match 레코드 생성
        await tx.match.create({
          data: {
            sellerRequestId: seller.id,
            buyerRequestId: buyerRequestId,
            matchedAmount: matchedAmount,
            matchedPrice: buyerRequest.price,
            status: REQUEST_STATUS.MATCHED,
          },
        });

        matches.push({
          sellerRequestId: seller.id,
          matchedAmount: matchedAmount,
        });

        remainingBuyAmount -= matchedAmount;
      }

      // 구매건 업데이트
      const newBuyerStatus =
        remainingBuyAmount === 0
          ? REQUEST_STATUS.MATCHED
          : REQUEST_STATUS.LISTED; // 일부만 매칭된 경우

      await tx.buyerRequest.update({
        where: { id: buyerRequestId },
        data: {
          remainingAmount: remainingBuyAmount,
          status: newBuyerStatus,
        },
      });

      // 거래 그룹 생성 또는 업데이트
      if (matches.length > 0) {
        const totalMatchedAmount = matches.reduce(
          (sum, match) => sum + match.matchedAmount,
          0
        );

        // 기존 거래 그룹 조회 또는 생성
        await tx.tradeGroup.upsert({
          where: {
            buyerRequestId: buyerRequestId,
          },
          create: {
            buyerRequestId: buyerRequestId,
            totalMatchedAmount: totalMatchedAmount,
            totalMatchedPrice: buyerRequest.price,
            status: REQUEST_STATUS.MATCHED,
          },
          update: {
            totalMatchedAmount: {
              increment: totalMatchedAmount, // 기존 수량에 추가
            },
            // 가격은 동일해야 하므로 업데이트하지 않음
            // status는 MATCHED로 유지 (이미 COMPLETED인 경우는 유지)
          },
        });
      }

      return { matches, remainingBuyAmount };
    });

    // OrderBookLevel 동기화 (allowPartial = true인 판매건이 있는 경우)
    const hasPartialSeller = matchingSellers.some((s) => s.allowPartial);
    if (hasPartialSeller) {
      try {
        await syncOrderBookLevels(buyerRequest.assetType);
      } catch (syncError) {
        console.error("OrderBookLevel sync failed after matching:", syncError);
      }
    }

    if (matches.length === 0) {
      return {
        success: false,
        message: "매칭 가능한 판매건이 없습니다.",
      };
    }

    return {
      success: true,
      matches: result.matches,
      message: `매칭 완료: ${
        result.matches.length
      }개의 판매건과 매칭되었습니다. (총 매칭 수량: ${
        buyerRequest.remainingAmount - result.remainingBuyAmount
      })`,
    };
  } catch (error) {
    console.error("Error matching buyer request:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "매칭 처리 중 오류가 발생했습니다.",
    };
  }
}
