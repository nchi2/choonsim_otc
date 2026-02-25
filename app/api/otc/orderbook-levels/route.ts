import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("assetType") || "BMB";

    // OrderBookLevel 테이블 대신 직접 SellerRequest에서 조회
    // allowPartial = true이고 status = LISTED인 판매 신청 조회
    const listedRequests = await prisma.sellerRequest.findMany({
      where: {
        assetType: assetType,
        allowPartial: true,
        status: REQUEST_STATUS.LISTED,
      },
      select: {
        id: true,
        price: true,
        amount: true,
        remainingAmount: true,
        assetType: true,
        updatedAt: true,
      },
    });

    // 가격별로 수량 합산
    const priceMap = new Map<
      string,
      {
        price: string;
        totalAmount: number;
        requestCount: number;
        ids: number[];
        updatedAt: Date;
      }
    >();

    listedRequests.forEach((request) => {
      const priceKey = request.price.toString();
      const availableAmount = request.remainingAmount || request.amount;

      if (priceMap.has(priceKey)) {
        const existing = priceMap.get(priceKey)!;
        existing.totalAmount += availableAmount;
        existing.requestCount += 1;
        existing.ids.push(request.id);
        // 가장 최근 업데이트 시간으로 설정
        if (request.updatedAt > existing.updatedAt) {
          existing.updatedAt = request.updatedAt;
        }
      } else {
        priceMap.set(priceKey, {
          price: priceKey,
          totalAmount: availableAmount,
          requestCount: 1,
          ids: [request.id],
          updatedAt: request.updatedAt,
        });
      }
    });

    // 배열로 변환하고 가격순 정렬
    const orderBookLevels = Array.from(priceMap.values())
      .map((data, index) => ({
        id: data.ids[0] || index + 1, // 첫 번째 ID 사용
        assetType: assetType,
        price: data.price,
        totalAmount: data.totalAmount,
        requestCount: data.requestCount,
        updatedAt: data.updatedAt.toISOString(),
      }))
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return NextResponse.json(orderBookLevels, { status: 200 });
  } catch (error) {
    console.error("Error fetching orderbook levels:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "호가 정보를 불러오는 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
