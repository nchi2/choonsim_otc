"use client";

import { createContext, useContext } from "react";

export interface AdminSession {
  adminUserId: number | null;
  username: string | null;
  displayName: string | null;
  loading: boolean;
}

const AdminSessionContext = createContext<AdminSession>({
  adminUserId: null,
  username: null,
  displayName: null,
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
