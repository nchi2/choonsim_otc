import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("assetType") || "BMB"; // 기본값 "BMB"
    const status = searchParams.get("status"); // status 파라미터도 처리

    // allowPartial = false(소량 판매 비허용)인 요청만 불러오기
    const whereClause: any = {
      allowPartial: false,
      assetType: assetType, // 자산 종류 필터링 추가
    };

    // status 파라미터가 있으면 필터링에 추가
    if (status) {
      whereClause.status = status;
    }

    const cardRequests = await prisma.sellerRequest.findMany({
      where: whereClause,
      orderBy: {
        price: "asc", // 가격 오름차순 정렬
      },
      select: {
        // 민감 정보 제외하고 필요한 필드만 선택
        id: true,
        amount: true,
        price: true,
        allowPartial: true,
        branch: true,
        status: true,
        assetType: true,
        createdAt: true,
        updatedAt: true,
        // name, phone 제외
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
