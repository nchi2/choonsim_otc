import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { escapeAlertHtml, getAlertFromAddress } from "@/lib/alert-email";

// 회원 이메일 인증 — 토큰 발급(원문은 링크로만, DB엔 sha256 해시) + 발송(Resend 기존 패턴).
// RESEND_API_KEY 없으면 조용히 스킵(경고 로그). 발송 실패가 가입을 실패시키지 않게 호출부 try/catch.

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24시간

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 토큰 생성·저장(해시만) 후 원문 반환 — 원문은 메일 링크에만 실린다. */
export async function issueVerificationToken(memberId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: {
      memberId,
      tokenHash: hashVerificationToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

/**
 * 인증 메일 발송 — 링크는 요청 origin 기준(dev/preview/prod 어디서든 동작).
 * 키 없으면 스킵. 실패 시 throw — 호출부가 try/catch로 가입 성공을 보장.
 */
export async function sendVerificationEmail(
  origin: string,
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[member/verify-email] RESEND_API_KEY not set, skip email");
    return;
  }
  const resend = new Resend(apiKey);
  const link = `${origin}/api/member/auth/verify-email?token=${token}`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;color:#111827;margin:0;padding:16px">
  <p style="margin:0 0 12px">${escapeAlertHtml(name)}님, 춘심 허브 가입을 환영합니다.</p>
  <p style="margin:0 0 16px">아래 버튼을 눌러 이메일 주소를 인증해 주세요. 링크는 24시간 동안 유효합니다.</p>
  <p style="margin:0 0 16px"><a href="${link}" style="display:inline-block;padding:10px 20px;background:#6B5FD0;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700">이메일 인증하기</a></p>
  <p style="margin:0;color:#6b7280;font-size:12px">본인이 가입한 적 없다면 이 메일을 무시하세요.</p>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: getAlertFromAddress(),
    to: [to],
    subject: "[춘심] 이메일 인증을 완료해 주세요",
    html,
  });
  if (error) throw new Error(error.message || "Resend send failed");
}
