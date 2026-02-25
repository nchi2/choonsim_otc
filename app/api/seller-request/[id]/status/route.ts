import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REQUEST_STATUS } from "@/lib/constants";
import { syncOrderBookLevels } from "@/lib/orderbook-sync";

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

    // 기존 요청 정보 조회 (assetType 확인용)
    const existingRequest = await prisma.sellerRequest.findUnique({
      where: { id: idNum },
      select: { assetType: true, allowPartial: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "해당 신청건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 상태 업데이트
    const updatedRequest = await prisma.sellerRequest.update({
      where: { id: idNum },
      data: { status },
    });

    // allowPartial = true인 경우에만 OrderBookLevel 동기화
    // 상태가 LISTED로 변경되거나 LISTED에서 다른 상태로 변경될 때 동기화 필요
    if (existingRequest.allowPartial) {
      try {
        await syncOrderBookLevels(existingRequest.assetType);
      } catch (syncError) {
        // 동기화 실패해도 상태 변경은 성공한 것으로 처리 (로그만 남김)
        console.error("OrderBookLevel sync failed:", syncError);
      }
    }

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    console.error("Error updating status:", error);

    // 레코드가 없는 경우
    if (error instanceof Error && error.message.includes("Record")) {
      return NextResponse.json(
        { error: "해당 신청건을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

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
