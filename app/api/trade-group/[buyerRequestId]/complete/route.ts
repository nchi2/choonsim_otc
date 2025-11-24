import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ buyerRequestId: string }> }
) {
  try {
    const { buyerRequestId } = await params;
    const idNum = parseInt(buyerRequestId, 10);

    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: "유효하지 않은 구매건 ID입니다." },
        { status: 400 }
      );
    }

    // 구매건 정보 조회
    const buyerRequest = await prisma.buyerRequest.findUnique({
      where: { id: idNum },
    });

    if (!buyerRequest) {
      return NextResponse.json(
        { error: "구매건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 해당 구매건과 연결된 모든 MATCHED 상태의 Match 레코드 조회
    const matches = await prisma.match.findMany({
      where: {
        buyerRequestId: idNum,
        status: REQUEST_STATUS.MATCHED, // MATCHED 상태만
      },
    });

    if (matches.length === 0) {
      return NextResponse.json(
        { error: "승인할 매칭이 없습니다." },
        { status: 400 }
      );
    }

    // 판매건 ID 목록 수집
    const sellerIds = [...new Set(matches.map((m) => m.sellerRequestId))];

    // 판매건 정보 조회
    const sellerRequests = await prisma.sellerRequest.findMany({
      where: {
        id: { in: sellerIds },
      },
    });

    // 판매건 정보를 Map으로 변환
    const sellerMap = new Map(
      sellerRequests.map((seller) => [seller.id, seller])
    );

    // 거래 그룹 조회
    const tradeGroup = await prisma.tradeGroup.findUnique({
      where: {
        buyerRequestId: idNum,
      },
    });

    // 트랜잭션으로 승인 처리
    const result = await prisma.$transaction(async (tx) => {
      // 모든 Match 레코드의 status를 COMPLETED로 변경
      await tx.match.updateMany({
        where: {
          buyerRequestId: idNum,
          status: REQUEST_STATUS.MATCHED,
        },
        data: {
          status: REQUEST_STATUS.COMPLETED,
        },
      });

      // 판매건과 구매건의 상태 확인 및 업데이트
      // 판매건: remainingAmount가 0이고 status가 LISTED인 경우 COMPLETED로 변경
      for (const match of matches) {
        const seller = sellerMap.get(match.sellerRequestId);
        if (!seller) continue;

        if (
          seller.remainingAmount === 0 &&
          seller.status === REQUEST_STATUS.LISTED
        ) {
          await tx.sellerRequest.update({
            where: { id: match.sellerRequestId },
            data: {
              status: REQUEST_STATUS.COMPLETED,
            },
          });
        }
      }

      // 구매건: remainingAmount가 0이고 status가 MATCHED인 경우 COMPLETED로 변경
      if (
        buyerRequest.remainingAmount === 0 &&
        buyerRequest.status === REQUEST_STATUS.MATCHED
      ) {
        await tx.buyerRequest.update({
          where: { id: idNum },
          data: {
            status: REQUEST_STATUS.COMPLETED,
          },
        });
      }

      // 거래 그룹 상태 업데이트
      if (tradeGroup) {
        await tx.tradeGroup.update({
          where: {
            buyerRequestId: idNum,
          },
          data: {
            status: REQUEST_STATUS.COMPLETED,
          },
        });
      }

      return {
        buyerRequestId: idNum,
        completedMatches: matches.length,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: `거래 그룹이 승인되었습니다. ${result.completedMatches}개의 매칭이 완료되었습니다.`,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing trade group:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "거래 그룹 승인 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
