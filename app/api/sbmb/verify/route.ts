import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/sbmb/clientIp";
import { rateLimitAllow } from "@/lib/sbmb/rateLimit";
import { verifySbmbParticipant } from "@/lib/sbmb/verifyParticipant";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const rec = body as Record<string, unknown>;
  const nameRaw = rec.name;
  const phoneRaw = rec.phone;
  const walletNoRaw = rec.walletNo;

  if (typeof nameRaw !== "string") {
    return NextResponse.json(
      { error: "name은 문자열이어야 합니다." },
      { status: 400 },
    );
  }

  if (typeof phoneRaw !== "string") {
    return NextResponse.json(
      { error: "phone은 문자열이어야 합니다." },
      { status: 400 },
    );
  }

  if (typeof walletNoRaw !== "number" || !Number.isFinite(walletNoRaw)) {
    return NextResponse.json(
      { error: "walletNo는 숫자여야 합니다." },
      { status: 400 },
    );
  }

  if (!nameRaw.trim() || !phoneRaw.trim()) {
    return NextResponse.json(
      { error: "성함과 연락처를 입력해주세요." },
      { status: 400 },
    );
  }

  const walletNo = Math.floor(walletNoRaw);

  const ip = getClientIp(request);
  if (!rateLimitAllow(`sbmb:verify:${ip}`)) {
    return NextResponse.json(
      { error: "같은 네트워크에서 요청이 너무 많습니다. 1분 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  try {
    const result = await verifySbmbParticipant(
      nameRaw.trim(),
      phoneRaw.trim(),
      walletNo,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[sbmb/verify]", error);
    const message =
      error instanceof Error ? error.message : "확인에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
