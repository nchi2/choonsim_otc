"use client";

// 인증/구글 결과 배너 — verify-email·google OAuth가 홈으로 리다이렉트하며 붙이는 쿼리
// (?emailVerify=... / ?google=...)를 읽어 안내. 닫기 가능. useSearchParams라 Suspense로 감싸 사용.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { eduColors, eduLayout } from "./tokens";

const Banner = styled.div<{ $tone: "ok" | "warn" | "error" }>`
  max-width: ${eduLayout.maxWidth}px;
  margin: 0.9rem auto 0;
  padding: 0.7rem 0.95rem;
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.84rem;
  font-weight: 600;
  ${(p) =>
    p.$tone === "ok"
      ? `background:${eduColors.successSoft};border:1px solid #bbf7d0;color:${eduColors.success};`
      : p.$tone === "warn"
        ? `background:${eduColors.warnSoft};border:1px solid #fde68a;color:${eduColors.warn};`
        : `background:${eduColors.dangerSoft};border:1px solid #fecaca;color:${eduColors.danger};`}

  button {
    margin-left: auto;
    border: none;
    background: none;
    color: inherit;
    font-size: 1rem;
    cursor: pointer;
    opacity: 0.7;
  }
`;

const EMAIL_MSG: Record<string, { tone: "ok" | "warn" | "error"; text: string }> = {
  ok: { tone: "ok", text: "이메일 인증이 완료되었습니다. 감사합니다!" },
  used: { tone: "warn", text: "이미 사용된 인증 링크입니다." },
  expired: { tone: "warn", text: "인증 링크가 만료되었습니다. 마이페이지에서 재발송해 주세요." },
  invalid: { tone: "error", text: "잘못된 인증 링크입니다." },
  error: { tone: "error", text: "인증 처리 중 오류가 발생했습니다." },
};

const GOOGLE_MSG: Record<string, { tone: "ok" | "warn" | "error"; text: string }> = {
  disabled: { tone: "warn", text: "구글 로그인은 현재 사용할 수 없습니다." },
  state: { tone: "error", text: "구글 로그인 검증에 실패했습니다. 다시 시도해 주세요." },
  token: { tone: "error", text: "구글 인증에 실패했습니다. 다시 시도해 주세요." },
  profile: { tone: "error", text: "구글 계정 정보를 가져오지 못했습니다." },
  unverified: { tone: "warn", text: "구글 계정 이메일이 인증되지 않아 연결할 수 없습니다." },
  suspended: { tone: "error", text: "이용이 제한된 계정입니다." },
  error: { tone: "error", text: "구글 로그인 중 오류가 발생했습니다." },
};

function BannerInner() {
  const params = useSearchParams();
  const [closed, setClosed] = useState(false);

  const emailKey = params.get("emailVerify");
  const googleKey = params.get("google");
  const info =
    (emailKey && EMAIL_MSG[emailKey]) || (googleKey && GOOGLE_MSG[googleKey]) || null;

  if (!info || closed) return null;
  return (
    <Banner $tone={info.tone} role="status">
      {info.text}
      <button type="button" aria-label="닫기" onClick={() => setClosed(true)}>
        ✕
      </button>
    </Banner>
  );
}

export function AuthNoticeBanner() {
  return (
    <Suspense fallback={null}>
      <BannerInner />
    </Suspense>
  );
}
