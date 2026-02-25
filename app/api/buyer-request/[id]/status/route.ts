import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";
import { matchBuyerRequest } from "@/lib/match-requests";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // 상태 값 검증
    const validStatuses = Object.values(REQUEST_STATUS);
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "유효하지 않은 상태 값입니다." },
        { status: 400 }
      );
    }

    // ID 검증
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    // 기존 요청 정보 조회
    const existingRequest = await prisma.buyerRequest.findUnique({
      where: { id: idNum },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "해당 신청건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 상태 업데이트
    const updatedRequest = await prisma.buyerRequest.update({
      where: { id: idNum },
      data: { status },
    });

    // 상태가 LISTED로 변경될 때 자동 매칭 로직 실행
    if (status === REQUEST_STATUS.LISTED) {
      try {
        const matchResult = await matchBuyerRequest(idNum);

        if (matchResult.success) {
          // 매칭 성공 시 업데이트된 구매건 정보 다시 조회
          const updatedAfterMatch = await prisma.buyerRequest.findUnique({
            where: { id: idNum },
          });

          return NextResponse.json(
            {
              ...updatedAfterMatch,
              matchMessage: matchResult.message,
              matches: matchResult.matches,
            },
            { status: 200 }
          );
        } else {
          // 매칭 실패해도 상태 변경은 성공한 것으로 처리
          // (매칭 대기 상태로 LISTED 유지)
          console.log(`매칭 실패: ${matchResult.message}`);
          return NextResponse.json(
            {
              ...updatedRequest,
              matchMessage: matchResult.message,
            },
            { status: 200 }
          );
        }
      } catch (matchError) {
        // 매칭 실패해도 상태 변경은 성공한 것으로 처리
        console.error("매칭 처리 중 오류:", matchError);
        return NextResponse.json(
          {
            ...updatedRequest,
            matchMessage: "매칭 처리 중 오류가 발생했습니다.",
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    console.error("Error updating buyer request status:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "상태 변경 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
