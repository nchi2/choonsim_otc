import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // allowPartial = false(소량 판매 비허용)인 요청만 불러오기
    const cardRequests = await prisma.sellerRequest.findMany({
      where: {
        allowPartial: false,
        // 필요시 status도 필터링할 수 있음 (예: LISTED만)
        // status: REQUEST_STATUS.LISTED,
      },
      orderBy: {
        price: "asc", // 가격 오름차순 정렬
      },
    });

    return NextResponse.json(cardRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching card requests:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "카드형 정보를 불러오는 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
