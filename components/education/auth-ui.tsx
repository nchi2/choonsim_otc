"use client";

// 로그인/회원가입 공용 폼 프리미티브 — 교육 톤(tokens.ts). 새 hex 없음.

import styled from "styled-components";
import { eduColors, eduLayout, media } from "./tokens";

export const AuthWrap = styled.div`
  max-width: 420px;
  margin: 2rem auto;
  padding: 0 1rem;

  ${media.sm} {
    margin: 1rem auto;
  }
`;

export const AuthCard = styled.div`
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.surface};
  padding: 1.75rem 1.5rem;
`;

export const AuthTitle = styled.h1`
  margin: 0 0 0.35rem;
  font-size: 1.35rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

export const AuthSub = styled.p`
  margin: 0 0 1.4rem;
  font-size: 0.85rem;
  color: ${eduColors.textMuted};
  line-height: 1.5;
`;

export const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const Field = styled.label`
  display: block;
`;

export const FieldLabel = styled.span`
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${eduColors.textSub};
  margin-bottom: 0.3rem;

  em {
    color: ${eduColors.danger};
    font-style: normal;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid ${eduColors.borderInput};
  border-radius: 8px;
  font-size: 0.9rem;
  background: ${eduColors.surface};
  color: ${eduColors.text};
  &:focus {
    outline: none;
    border-color: ${eduColors.primary};
  }
`;

export const SubmitBtn = styled.button`
  margin-top: 0.3rem;
  padding: 0.72rem;
  border: none;
  border-radius: 9px;
  background: ${eduColors.primary};
  color: ${eduColors.white};
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${eduColors.primaryHover};
  }
  &:disabled {
    background: ${eduColors.textFaint};
    cursor: not-allowed;
  }
`;

export const ErrorNote = styled.div`
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: ${eduColors.dangerSoft};
  border: 1px solid ${eduColors.danger}33;
  color: ${eduColors.danger};
  font-size: 0.83rem;
  font-weight: 600;
  text-align: center;
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 1.1rem 0;
  color: ${eduColors.textFaint};
  font-size: 0.75rem;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${eduColors.border};
  }
`;

/* 구글 버튼 — 키 있을 때만 노출. 링크로 OAuth 시작(/api/member/auth/google). */
export const GoogleBtn = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem;
  border-radius: 9px;
  border: 1px solid ${eduColors.borderInput};
  background: ${eduColors.surface};
  color: ${eduColors.textSub};
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  &:hover {
    background: ${eduColors.bg};
  }
`;

export const AuthFootLink = styled.p`
  margin: 1.2rem 0 0;
  text-align: center;
  font-size: 0.83rem;
  color: ${eduColors.textMuted};

  a {
    color: ${eduColors.primary};
    font-weight: 700;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

/** 구글 활성 여부 조회 — 키 없으면 버튼 숨김용. */
export async function fetchGoogleEnabled(): Promise<boolean> {
  try {
    const res = await fetch("/api/member/auth/config");
    if (!res.ok) return false;
    const json = (await res.json()) as { googleEnabled?: boolean };
    return json.googleEnabled === true;
  } catch {
    return false;
  }
}
