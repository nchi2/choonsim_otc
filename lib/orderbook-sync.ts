import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";

/**
 * OrderBookLevel 테이블을 재계산하는 함수
 * allowPartial = true이고 status = LISTED인 SellerRequest를 기준으로 가격별 수량 합계 계산
 */
export async function syncOrderBookLevels(assetType?: string) {
  try {
    // 동기화할 자산 종류 목록
    const assetTypes = assetType
      ? [assetType]
      : ["BMB", "MOVL", "WBMB", "SBMB"];

    for (const at of assetTypes) {
      // allowPartial = true이고 status = LISTED인 SellerRequest 조회
      const listedRequests = await prisma.sellerRequest.findMany({
        where: {
          allowPartial: true,
          status: REQUEST_STATUS.LISTED,
          assetType: at,
        },
        select: {
          price: true,
          amount: true,
        },
      });

      // 가격별로 수량 합산
      const priceMap = new Map<
        string,
        { totalAmount: number; requestCount: number }
      >();

      listedRequests.forEach((request) => {
        const priceKey = request.price.toString();
        if (priceMap.has(priceKey)) {
          const existing = priceMap.get(priceKey)!;
          existing.totalAmount += request.amount;
          existing.requestCount += 1;
        } else {
          priceMap.set(priceKey, {
            totalAmount: request.amount,
            requestCount: 1,
          });
        }
      });

      // OrderBookLevel 테이블 업데이트 (upsert)
      for (const [priceStr, data] of priceMap.entries()) {
        const price = parseFloat(priceStr);
        await prisma.orderBookLevel.upsert({
          where: {
            assetType_price: {
              assetType: at,
              price: price,
            },
          },
          update: {
            totalAmount: data.totalAmount,
            requestCount: data.requestCount,
          },
          create: {
            assetType: at,
            price: price,
            totalAmount: data.totalAmount,
            requestCount: data.requestCount,
          },
        });
      }

      // 더 이상 해당 가격대에 LISTED 상태인 요청이 없으면 OrderBookLevel 레코드 삭제
      const existingLevels = await prisma.orderBookLevel.findMany({
        where: {
          assetType: at,
        },
      });

      for (const level of existingLevels) {
        const priceKey = level.price.toString();
        if (!priceMap.has(priceKey)) {
          await prisma.orderBookLevel.delete({
            where: {
              id: level.id,
            },
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing order book levels:", error);
    throw error;
  }
}
