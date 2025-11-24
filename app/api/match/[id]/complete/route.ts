import { NextResponse } from "next/server";

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

    // TODO: 12.4에서 구현 예정
    // MATCHED 상태를 COMPLETED로 변경
    // - Match 레코드의 status를 COMPLETED로 변경
    // - 관련된 판매건/구매건 상태 업데이트 (필요시)

    return NextResponse.json(
      { message: "Not implemented yet. Will be implemented in 12.4" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error completing match:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json(
      {
        error: "매칭 완료 처리 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
