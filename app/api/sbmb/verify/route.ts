import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/sbmb/clientIp";
import { sanitizeParticipantFacingError } from "@/lib/sbmb/participantFacingMessage";
import { rateLimitAllow } from "@/lib/sbmb/rateLimit";
import { verifySbmbParticipant } from "@/lib/sbmb/verifyParticipant";

const VERIFY_MAX_FAILS = 10;
const VERIFY_BLOCK_MS = 30 * 60 * 1000;

const verifyFailMap = new Map<string, { count: number; blockedUntil?: number }>();

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

  const failState = verifyFailMap.get(ip);
  if (failState?.blockedUntil && failState.blockedUntil > Date.now()) {
    return NextResponse.json(
      { blocked: true, message: "잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }
  if (failState?.blockedUntil && failState.blockedUntil <= Date.now()) {
    verifyFailMap.delete(ip);
  }

  try {
    const result = await verifySbmbParticipant(
      nameRaw.trim(),
      phoneRaw.trim(),
      walletNo,
    );
    const success =
      result.found === true &&
      Array.isArray(result.entries) &&
      result.entries.length > 0;

    if (success) {
      verifyFailMap.delete(ip);
      return NextResponse.json(result);
    }

    const nextCount = (verifyFailMap.get(ip)?.count ?? 0) + 1;
    if (nextCount >= VERIFY_MAX_FAILS) {
      verifyFailMap.set(ip, {
        count: nextCount,
        blockedUntil: Date.now() + VERIFY_BLOCK_MS,
      });
      return NextResponse.json(
        { blocked: true, message: "잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }

    verifyFailMap.set(ip, { count: nextCount });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[sbmb/verify]", error);
    const raw =
      error instanceof Error ? error.message : "확인에 실패했습니다.";
    const message = sanitizeParticipantFacingError(raw);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
