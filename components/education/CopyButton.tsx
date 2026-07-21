"use client";

// 클립보드 복사 버튼 (Step 21) — 계좌번호 등 모바일 타이핑이 번거로운 값 복사용.
// Clipboard API 우선, 미지원 환경은 execCommand 폴백. 신청 완료 화면·마이페이지가 공유.

import { useState } from "react";
import styled from "styled-components";
import { eduColors } from "./tokens";

const Btn = styled.button`
  flex-shrink: 0;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  border: 1px solid ${eduColors.primaryBorder};
  background: ${eduColors.surface};
  color: ${eduColors.primaryText};
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: ${eduColors.primary};
  }
`;

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // 복사 실패해도 값은 화면에 이미 보이므로 조용히 무시
    }
  };

  return (
    <Btn type="button" onClick={() => void copy()}>
      {copied ? "복사됨" : "복사"}
    </Btn>
  );
}
