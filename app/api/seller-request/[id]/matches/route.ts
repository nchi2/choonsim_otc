import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);

    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: "유효하지 않은 판매건 ID입니다." },
        { status: 400 }
      );
    }

    // 판매건 존재 확인
    const sellerRequest = await prisma.sellerRequest.findUnique({
      where: { id: idNum },
    });

    if (!sellerRequest) {
      return NextResponse.json(
        { error: "판매건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 해당 판매건과 연결된 모든 Match 레코드 조회
    const matches = await prisma.match.findMany({
      where: {
        sellerRequestId: idNum,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 매칭이 없으면 빈 배열 반환
    if (matches.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 구매건 ID 목록 수집
    const buyerIds = [...new Set(matches.map((m) => m.buyerRequestId))];

    // 구매건 정보 조회
    const buyers =
      buyerIds.length > 0
        ? await prisma.buyerRequest.findMany({
            where: {
              id: { in: buyerIds },
            },
            select: {
              id: true,
              name: true,
              phone: true,
              amount: true,
              remainingAmount: true,
              price: true,
              branch: true,
              assetType: true,
              status: true,
              createdAt: true,
            },
          })
        : [];

    // 매칭 정보와 구매건 정보 결합
    const matchesWithDetails = matches.map((match) => {
      const buyer = buyers.find((b) => b.id === match.buyerRequestId);

      return {
        ...match,
        buyerRequest: buyer || null,
      };
    });

    return NextResponse.json(matchesWithDetails, { status: 200 });
  } catch (error) {
    console.error("Error fetching seller request matches:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "판매건 매칭 정보를 불러오는 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
