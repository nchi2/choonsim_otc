import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id, 10);

    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    // Match 레코드 조회
    const match = await prisma.match.findUnique({
      where: { id: idNum },
    });

    if (!match) {
      return NextResponse.json(
        { error: "매칭 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 완료된 경우
    if (match.status === REQUEST_STATUS.COMPLETED) {
      return NextResponse.json(
        { error: "이미 완료된 매칭입니다." },
        { status: 400 }
      );
    }

    // MATCHED 상태가 아닌 경우
    if (match.status !== REQUEST_STATUS.MATCHED) {
      return NextResponse.json(
        { error: "완료할 수 없는 상태의 매칭입니다." },
        { status: 400 }
      );
    }

    // 판매건과 구매건 정보 조회
    const sellerRequest = await prisma.sellerRequest.findUnique({
      where: { id: match.sellerRequestId },
    });

    const buyerRequest = await prisma.buyerRequest.findUnique({
      where: { id: match.buyerRequestId },
    });

    if (!sellerRequest || !buyerRequest) {
      return NextResponse.json(
        { error: "판매건 또는 구매건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 트랜잭션으로 완료 처리
    const result = await prisma.$transaction(async (tx) => {
      // Match 레코드의 status를 COMPLETED로 변경
      const updatedMatch = await tx.match.update({
        where: { id: idNum },
        data: {
          status: REQUEST_STATUS.COMPLETED,
        },
      });

      // 판매건과 구매건의 상태 확인 및 업데이트
      // 판매건: remainingAmount가 0이고 status가 LISTED인 경우 COMPLETED로 변경
      if (
        sellerRequest.remainingAmount === 0 &&
        sellerRequest.status === REQUEST_STATUS.LISTED
      ) {
        await tx.sellerRequest.update({
          where: { id: match.sellerRequestId },
          data: {
            status: REQUEST_STATUS.COMPLETED,
          },
        });
      }

      // 구매건: remainingAmount가 0이고 status가 MATCHED인 경우 COMPLETED로 변경
      if (
        buyerRequest.remainingAmount === 0 &&
        buyerRequest.status === REQUEST_STATUS.MATCHED
      ) {
        await tx.buyerRequest.update({
          where: { id: match.buyerRequestId },
          data: {
            status: REQUEST_STATUS.COMPLETED,
          },
        });
      }

      return updatedMatch;
    });

    return NextResponse.json(
      {
        success: true,
        message: "매칭이 완료되었습니다.",
        match: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing match:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "매칭 완료 처리 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
