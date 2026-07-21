import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 공개 설정 — 프런트가 구글 로그인 버튼 노출 여부를 판단(키 없으면 숨김).
// 민감정보 없음(불리언만). /api/member/auth/* 라 미들웨어 예외(무인증 접근 가능).

export async function GET() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
  return NextResponse.json({ ok: true, googleEnabled });
}
