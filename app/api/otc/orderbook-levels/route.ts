import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("assetType") || "BMB"; // 기본값 "BMB"

    // OrderBookLevel 테이블에서 요약 데이터 조회
    const orderBookLevels = await prisma.orderBookLevel.findMany({
      where: {
        assetType: assetType,
      },
      orderBy: {
        price: "asc", // 가격 오름차순 정렬
      },
    });

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
