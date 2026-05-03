import { NextResponse } from "next/server";
import { lookupSbmbParticipant } from "@/lib/sbmb/lookupParticipant";
import { rateLimitAllow } from "@/lib/sbmb/rateLimit";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("name" in body) ||
    !("phone" in body)
  ) {
    return NextResponse.json(
      { error: "name과 phone 필드가 필요합니다." },
      { status: 400 },
    );
  }

  const { name, phone } = body as { name: unknown; phone: unknown };

  if (typeof name !== "string" || typeof phone !== "string") {
    return NextResponse.json(
      { error: "name과 phone은 문자열이어야 합니다." },
      { status: 400 },
    );
  }

  if (!name.trim() || !phone.trim()) {
    return NextResponse.json(
      { error: "성함과 연락처를 모두 입력해주세요." },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const rateKey = `sbmb:lookup:${ip}`;

  if (!rateLimitAllow(rateKey)) {
    return NextResponse.json(
      { error: "같은 네트워크에서 요청이 너무 많습니다. 1분 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  try {
    const result = await lookupSbmbParticipant(name.trim(), phone.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error("[sbmb/lookup]", error);
    const message =
      error instanceof Error ? error.message : "조회에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
