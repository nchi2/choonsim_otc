import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("assetType") || "BMB"; // 기본값 "BMB"

    // allowPartial = true(소량 판매 허용)이고 status = LISTED인 SellerRequest만 불러오기
    const listedRequests = await prisma.sellerRequest.findMany({
      where: {
        allowPartial: true, // 소량 판매 허용만
        assetType: assetType, // 자산 종류 필터링
        status: REQUEST_STATUS.LISTED, // LISTED 상태만 필터링 추가
      },
      orderBy: {
        price: "asc", // 가격 오름차순 정렬
      },
    });

    return NextResponse.json(listedRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching listed requests:", error);

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
