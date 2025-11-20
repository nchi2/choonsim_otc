import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sellerRequests = await prisma.sellerRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(sellerRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching seller requests:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "신청 내역을 불러오는 중 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
