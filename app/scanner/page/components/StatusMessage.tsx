"use client";

import * as S from "../styles";

export type StatusMessageState = "loading" | "empty" | "error";

export interface StatusMessageProps {
  state: StatusMessageState;
  message?: string;
}

function EmptyWalletIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

export function StatusMessage({ state, message }: StatusMessageProps) {
  if (state === "loading") {
    return (
      <S.StatusMessageRoot role="status" aria-live="polite">
        <S.StatusSpinner aria-hidden />
        <S.StatusMessageText>조회 중...</S.StatusMessageText>
      </S.StatusMessageRoot>
    );
  }

  if (state === "empty") {
    return (
      <S.StatusMessageRoot role="status">
        <S.StatusEmptyIconWrap aria-hidden>
          <EmptyWalletIcon />
        </S.StatusEmptyIconWrap>
        <S.StatusMessageText>보유 토큰이 없습니다</S.StatusMessageText>
      </S.StatusMessageRoot>
    );
  }

  return (
    <S.StatusMessageRoot role="alert">
      <S.StatusMessageError>
        {message?.trim() ? message : "오류가 발생했습니다."}
      </S.StatusMessageError>
    </S.StatusMessageRoot>
  );
}
