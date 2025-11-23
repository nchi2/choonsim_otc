import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    const { name, phone, amount, price, branch, allowPartial, assetType } =
      body;

    if (
      !name ||
      !phone ||
      !amount ||
      !price ||
      !branch ||
      allowPartial === undefined ||
      !assetType // assetType 필수 필드 추가
    ) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // assetType 유효성 검증 (BMB, MOVL, WBMB, SBMB 중 하나여야 함)
    const validAssetTypes = ["BMB", "MOVL", "WBMB", "SBMB"];
    if (!validAssetTypes.includes(assetType)) {
      return NextResponse.json(
        { error: "유효하지 않은 자산 종류입니다." },
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
        assetType: assetType, // assetType 필드 추가
        status: "PENDING",
      },
    });

    // 신청 상세 정보 반환
    return NextResponse.json(
      {
        id: sellerRequest.id,
        name: sellerRequest.name,
        phone: sellerRequest.phone,
        amount: sellerRequest.amount,
        price: Number(sellerRequest.price),
        allowPartial: sellerRequest.allowPartial,
        branch: sellerRequest.branch,
        assetType: sellerRequest.assetType, // 응답에 assetType 포함
        status: sellerRequest.status,
        createdAt: sellerRequest.createdAt,
      },
      { status: 201 }
    );
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
