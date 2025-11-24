import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get("assetType");
    const status = searchParams.get("status"); // MATCHED 또는 COMPLETED

    const whereClause: any = {};

    // status 필터 (기본값: MATCHED)
    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = REQUEST_STATUS.MATCHED; // 기본값은 MATCHED
    }

    // Match 레코드 조회
    const matches = await prisma.match.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    // 매칭이 없으면 빈 배열 반환
    if (matches.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // 판매건과 구매건 정보를 별도로 조회 (PlanetScale은 foreign key를 지원하지 않음)
    const sellerIds = [...new Set(matches.map((m) => m.sellerRequestId))];
    const buyerIds = [...new Set(matches.map((m) => m.buyerRequestId))];

    // 빈 배열 체크 추가
    const sellers =
      sellerIds.length > 0
        ? await prisma.sellerRequest.findMany({
            where: {
              id: { in: sellerIds },
              ...(assetType ? { assetType } : {}),
            },
          })
        : [];

    const buyers =
      buyerIds.length > 0
        ? await prisma.buyerRequest.findMany({
            where: {
              id: { in: buyerIds },
              ...(assetType ? { assetType } : {}),
            },
          })
        : [];

    // 매칭 정보와 판매건/구매건 정보 결합
    const matchesWithDetails = matches
      .map((match) => {
        const seller = sellers.find((s) => s.id === match.sellerRequestId);
        const buyer = buyers.find((b) => b.id === match.buyerRequestId);

        // assetType 필터링 (매칭된 판매건 또는 구매건의 assetType이 일치하는 경우만)
        if (assetType) {
          if (seller && seller.assetType !== assetType) {
            return null;
          }
          if (buyer && buyer.assetType !== assetType) {
            return null;
          }
        }

        return {
          ...match,
          sellerRequest: seller || null,
          buyerRequest: buyer || null,
        };
      })
      .filter((m) => m !== null); // null 제거

    return NextResponse.json(matchesWithDetails, { status: 200 });
  } catch (error) {
    console.error("Error fetching matches:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "매칭 정보를 불러오는 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
