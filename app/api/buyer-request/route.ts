import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    const {
      name,
      phone,
      amount,
      price,
      branch,
      assetType,
      agreedRisk,
      agreedPrivacy,
    } = body;

    if (
      !name ||
      !phone ||
      !amount ||
      !price ||
      !branch ||
      !assetType ||
      agreedRisk === undefined ||
      agreedPrivacy === undefined
    ) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 동의 필드 검증
    if (agreedRisk !== true && agreedRisk !== "true") {
      return NextResponse.json(
        { error: "보이스피싱 안내 동의는 필수입니다." },
        { status: 400 }
      );
    }

    if (agreedPrivacy !== true && agreedPrivacy !== "true") {
      return NextResponse.json(
        { error: "개인정보 수집 동의는 필수입니다." },
        { status: 400 }
      );
    }

    // assetType 유효성 검증
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

    // 동의 필드 boolean 변환
    const agreedRiskBool =
      agreedRisk === "true" || agreedRisk === true;
    const agreedPrivacyBool =
      agreedPrivacy === "true" || agreedPrivacy === true;

    // Prisma로 데이터 삽입
    const buyerRequest = await prisma.buyerRequest.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        amount: Math.floor(amountNum), // Int 필드이므로 정수로 변환
        remainingAmount: Math.floor(amountNum), // 남은 수량 = 신청 수량
        price: priceNum, // Decimal 타입은 자동으로 변환됨
        branch: branch.trim(),
        assetType: assetType,
        status: "PENDING",
        agreedRisk: agreedRiskBool,
        agreedPrivacy: agreedPrivacyBool,
      },
    });

    // 신청 상세 정보 반환
    return NextResponse.json(
      {
        id: buyerRequest.id,
        name: buyerRequest.name,
        phone: buyerRequest.phone,
        amount: buyerRequest.amount,
        remainingAmount: buyerRequest.remainingAmount, // remainingAmount 추가
        price: Number(buyerRequest.price),
        branch: buyerRequest.branch,
        assetType: buyerRequest.assetType,
        status: buyerRequest.status,
        createdAt: buyerRequest.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating buyer request:", error);

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
