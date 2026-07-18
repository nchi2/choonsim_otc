"use client";

// 회원 세션 클라이언트 훅 — /api/member/auth/me를 모듈 캐시로 1회 조회, 전 컴포넌트 공유.
// 로그인/로그아웃 후 refresh()로 갱신. B-1 API 배선 전용(인증 로직은 서버가 소유).

import { useCallback, useEffect, useSyncExternalStore } from "react";

export interface MemberMe {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  provider: string;
  educatorStatus: string;
  status: string;
  createdAt: string;
}

interface State {
  member: MemberMe | null;
  loading: boolean;
  loaded: boolean;
}

let state: State = { member: null, loading: false, loaded: false };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  emit();
}

async function load(): Promise<void> {
  if (inflight) return inflight;
  setState({ loading: true });
  inflight = (async () => {
    try {
      const res = await fetch("/api/member/auth/me");
      if (res.ok) {
        const json = (await res.json()) as { ok: boolean; member?: MemberMe };
        setState({ member: json.ok ? (json.member ?? null) : null });
      } else {
        setState({ member: null });
      }
    } catch {
      setState({ member: null });
    } finally {
      setState({ loading: false, loaded: true });
      inflight = null;
    }
  })();
  return inflight;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useMemberSession() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );

  useEffect(() => {
    if (!state.loaded && !state.loading) void load();
  }, []);

  const refresh = useCallback(() => load(), []);
  const setMember = useCallback((m: MemberMe | null) => {
    setState({ member: m, loaded: true });
  }, []);

  return {
    member: snapshot.member,
    loading: snapshot.loading,
    loaded: snapshot.loaded,
    refresh,
    setMember,
  };
}

/** 로그아웃 — API 호출 후 캐시 비움. */
export async function memberLogout(): Promise<void> {
  try {
    await fetch("/api/member/auth/logout", { method: "POST" });
  } catch {
    /* 무시 — 어차피 캐시 비움 */
  }
  setState({ member: null, loaded: true });
}
