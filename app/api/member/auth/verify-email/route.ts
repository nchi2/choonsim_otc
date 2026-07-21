import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/member-emails";

export const runtime = "nodejs";

// 이메일 인증 — 메일 링크(GET). 토큰 해시 대조 → 만료·재사용 검사 → emailVerifiedAt 기록.
// 브라우저 링크이므로 결과는 메인으로 리다이렉트(쿼리로 결과 전달 — B-2 화면에서 안내 배너 가능).

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/?emailVerify=${reason}`, request.url));

  if (!token || token.length > 200) return fail("invalid");

  try {
    const row = await prisma.emailVerificationToken.findFirst({
      where: { tokenHash: hashVerificationToken(token) },
      select: { id: true, memberId: true, expiresAt: true, usedAt: true },
    });
    if (!row) return fail("invalid");
    if (row.usedAt != null) return fail("used");
    if (row.expiresAt.getTime() < Date.now()) return fail("expired");

    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      prisma.member.update({
        where: { id: row.memberId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
    return NextResponse.redirect(new URL("/?emailVerify=ok", request.url));
  } catch (err) {
    console.error("[member/verify-email] failed", err);
    return fail("error");
  }
}
