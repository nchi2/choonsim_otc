import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    // LISTED 상태인 모든 판매 건을 PENDING_CONFIRMATION으로 변경
    const result = await prisma.sellerRequest.updateMany({
      where: {
        status: REQUEST_STATUS.LISTED,
      },
      data: {
        status: REQUEST_STATUS.PENDING_CONFIRMATION,
      },
    });

    // OrderBookLevel 동기화 (LISTED 상태가 없어졌으므로 호가에서 제거)
    // 모든 자산 종류에 대해 동기화
    const assetTypes = ["BMB", "MOVL", "WBMB", "SBMB"];

    for (const assetType of assetTypes) {
      // LISTED 상태인 건이 없으므로 모든 OrderBookLevel 삭제
      await prisma.orderBookLevel.deleteMany({
        where: {
          assetType: assetType,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        updatedCount: result.count,
        message: `${result.count}건의 판매 건이 '판매의사 확인중' 상태로 변경되었습니다.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in weekly reset:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "주간 재정비 처리 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
