import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    const { name, phone, amount, price, branch, allowPartial } = body;

    if (
      !name ||
      !phone ||
      !amount ||
      !price ||
      !branch ||
      allowPartial === undefined
    ) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 타입 변환 및 추가 검증
    const amountNum = parseFloat(amount);
    const priceNum = parseFloat(price);

    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "수량은 0보다 큰 숫자여야 합니다." },
        { status: 400 }
      );
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: "가격은 0보다 큰 숫자여야 합니다." },
        { status: 400 }
      );
    }

    // allowPartial 변환 (string "yes"/"no", "true"/"false" 또는 boolean 모두 처리)
    const allowPartialBool =
      allowPartial === "yes" ||
      allowPartial === "true" ||
      allowPartial === true;

    // Prisma로 데이터 삽입
    const sellerRequest = await prisma.sellerRequest.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        amount: Math.floor(amountNum), // Int 필드이므로 정수로 변환 (소수점 버림)
        price: priceNum, // Decimal 타입은 자동으로 변환됨
        allowPartial: allowPartialBool,
        branch: branch.trim(),
        status: "PENDING",
      },
    });

    return NextResponse.json({ id: sellerRequest.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating seller request:", error);

    // 더 자세한 에러 정보 반환
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "신청 처리 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
