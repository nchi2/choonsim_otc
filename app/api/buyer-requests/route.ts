import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("assetType"); // assetType 파라미터 (선택사항)
    const status = searchParams.get("status"); // status 파라미터 (선택사항)

    const whereClause: any = {};

    // assetType이 있으면 필터링에 추가
    if (assetType) {
      whereClause.assetType = assetType;
    }

    // status가 있으면 필터링에 추가
    if (status) {
      whereClause.status = status;
    }

    const buyerRequests = await prisma.buyerRequest.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        amount: true,
        remainingAmount: true, // remainingAmount 추가
        price: true,
        branch: true,
        assetType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(buyerRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching buyer requests:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "구매 신청 내역을 불러오는 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
