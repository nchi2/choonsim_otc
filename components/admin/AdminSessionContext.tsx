"use client";

import { createContext, useContext } from "react";

export interface AdminSession {
  adminUserId: number | null;
  username: string | null;
  displayName: string | null;
  /** 운영 스코프 (Step 16) — 로딩 전에는 true(기본 전원 true와 일관, 네비 깜빡임 방지) */
  manageOtc: boolean;
  manageEducation: boolean;
  loading: boolean;
}

const AdminSessionContext = createContext<AdminSession>({
  adminUserId: null,
  username: null,
  displayName: null,
  manageOtc: true,
  manageEducation: true,
  loading: true,
});

export function AdminSessionProvider({
  value,
  children,
}: {
  value: AdminSession;
  children: React.ReactNode;
}) {
  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession(): AdminSession {
  return useContext(AdminSessionContext);
}
