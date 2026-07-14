"use client";

// 페이지 → 셸 하단 헤더줄로 제목(ReactNode)·액션 버튼을 전달.
// 셸이 유일한 제목 소유자 — 페이지 본문에 자체 h1을 그리지 말 것 (이중 제목 금지).

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

export interface AdminPageHeader {
  /** 제목 — 배지 등을 포함할 수 있게 ReactNode. 미지정 시 셸의 경로 기반 기본 제목. */
  title?: ReactNode;
  /** 우측 액션 슬롯 (새로고침 버튼 등) */
  actions?: ReactNode;
}

interface AdminPageHeaderApi {
  setHeader: (header: AdminPageHeader | null) => void;
}

const Ctx = createContext<AdminPageHeaderApi | null>(null);

export const AdminPageHeaderProvider = Ctx.Provider;

/** 페이지에서 호출 — 언마운트 시 자동 해제되어 기본 제목으로 복귀. */
export function useAdminPageHeader(title?: ReactNode, actions?: ReactNode) {
  const api = useContext(Ctx);
  useEffect(() => {
    api?.setHeader({ title, actions });
    return () => api?.setHeader(null);
  }, [api, title, actions]);
}
