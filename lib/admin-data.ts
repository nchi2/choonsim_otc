"use client";

// 어드민 경량 stale-while-revalidate 캐시 — react-query/SWR 대체 (라이브러리 설치 금지).
//
// key 규칙: `admin:{도메인}[:{식별자}]`
//   admin:stats · admin:dashboard · admin:list:miracle10:{status}:{T|F}
//   admin:list:otc:{status}:{T|F} · admin:inventory · admin:offices
//   admin:calendar:{officeId}:{YYYY-MM} · admin:myslots:{from}
//
// ★ 상태를 바꾸는 모든 액션(PATCH/POST) 후 invalidate() 필수 — 매핑은 HANDOFF 참조.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface CacheEntry {
  data: unknown;
  ts: number; // 마지막 성공 시각
  promise: Promise<unknown> | null; // in-flight 공유 (중복 요청 제거)
  error: unknown;
}

const cache = new Map<string, CacheEntry>();
const listeners = new Map<string, Set<() => void>>();

const DEFAULT_TTL_MS = 30_000;

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

function entryOf(key: string): CacheEntry {
  let e = cache.get(key);
  if (!e) {
    e = { data: undefined, ts: 0, promise: null, error: null };
    cache.set(key, e);
  }
  return e;
}

export function isFresh(key: string, ttlMs = DEFAULT_TTL_MS): boolean {
  const e = cache.get(key);
  return !!e && e.data !== undefined && Date.now() - e.ts < ttlMs;
}

/** 캐시 조회 (없으면 undefined) — prefetch 판단 등에 사용. */
export function peek<T>(key: string): T | undefined {
  return cache.get(key)?.data as T | undefined;
}

/** 마지막 성공 시각(ms) — "N초 전 갱신" 표시용. 없으면 0. */
export function cacheTimestamp(key: string): number {
  return cache.get(key)?.ts ?? 0;
}

/**
 * 캐시에 값을 직접 주입 (낙관적 업데이트 / 다른 응답의 부산물 채움).
 * data 생략 시 = 강제 재검증 표시(ts=0)만 하고 구독자에게 알림.
 */
export function mutate<T>(key: string, data?: T) {
  const e = entryOf(key);
  if (data !== undefined) {
    e.data = data;
    e.ts = Date.now();
    e.error = null;
  } else {
    e.ts = 0; // stale 처리 → 다음 구독자 revalidate
  }
  notify(key);
}

/** prefix 일치 key 전부 무효화 — 액션(PATCH/POST) 후 반드시 호출. */
export function invalidate(keyPrefix: string) {
  for (const [key, e] of cache) {
    if (key.startsWith(keyPrefix)) {
      e.ts = 0;
      notify(key);
    }
  }
}

/** fetch 실행 — in-flight 공유. 성공 시 캐시 갱신. */
function revalidate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const e = entryOf(key);
  if (e.promise) return e.promise as Promise<T>;
  const p = fetcher()
    .then((data) => {
      e.data = data;
      e.ts = Date.now();
      e.error = null;
      return data;
    })
    .catch((err) => {
      e.error = err;
      throw err;
    })
    .finally(() => {
      e.promise = null;
      notify(key);
    });
  e.promise = p;
  notify(key); // isValidating 반영
  return p;
}

/** prefetch — 캐시가 stale일 때만 백그라운드로 채움 (내비 hover/touchstart). */
export function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
) {
  if (isFresh(key, ttlMs) || cache.get(key)?.promise) return;
  revalidate(key, fetcher).catch(() => {
    /* prefetch 실패는 무시 — 실제 진입 시 재시도 */
  });
}

export interface AdminDataResult<T> {
  data: T | undefined;
  error: unknown;
  /** 캐시가 아예 없어 첫 로드 중 (→ 스켈레톤) */
  isLoading: boolean;
  /** 캐시를 그대로 보여주며 백그라운드 갱신 중 (→ RefreshingBar) */
  isValidating: boolean;
  /** 강제 재조회 (새로고침 버튼) */
  refresh: () => Promise<void>;
  /** 마지막 성공 시각(ms) — "N초 전 갱신" 표시용. 0이면 아직 없음. */
  dataUpdatedAt: number;
}

/**
 * stale-while-revalidate 훅.
 * - hit: data 즉시 반환(isLoading=false) + TTL 지났으면 백그라운드 revalidate
 * - miss: isLoading=true
 * - 같은 key 동시 사용 컴포넌트는 하나의 fetch를 공유하고 함께 갱신된다
 * - visibilitychange 복귀 시 stale이면 revalidate
 * - ttl: 0이면 항상 재검증(캐시는 즉시 그리되 매 마운트 갱신)
 */
export function useAdminData<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts?: { ttl?: number },
): AdminDataResult<T> {
  const ttl = opts?.ttl ?? DEFAULT_TTL_MS;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const subscribe = useCallback(
    (onChange: () => void) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onChange);
      return () => {
        set!.delete(onChange);
        if (set!.size === 0) listeners.delete(key);
      };
    },
    [key],
  );

  // 스냅샷 = entry 버전 문자열 — notify 시 리렌더 유도 (ts/promise/error 조합)
  const getSnapshot = useCallback(() => {
    const e = cache.get(key);
    if (!e) return "empty";
    return `${e.ts}:${e.promise ? 1 : 0}:${e.error ? 1 : 0}`;
  }, [key]);

  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const entry = cache.get(key);
  const hasData = entry?.data !== undefined;

  // 마운트/키 변경/invalidate(snap 변경) 시 stale이면 재검증.
  // 에러 상태에선 자동 재시도하지 않음(무한 루프 방지) — refresh()로만 재시도.
  useEffect(() => {
    const e = cache.get(key);
    if (!isFresh(key, ttl) && !e?.promise && !e?.error) {
      revalidate(key, () => fetcherRef.current()).catch(() => {});
    }
  }, [key, ttl, snap]);

  // 포커스 복귀 시 stale이면 재검증
  useEffect(() => {
    const onVisibility = () => {
      const e = cache.get(key);
      if (!document.hidden && !isFresh(key, ttl) && !e?.promise && !e?.error) {
        revalidate(key, () => fetcherRef.current()).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, [key, ttl]);

  const refresh = useCallback(async () => {
    const e = entryOf(key);
    e.error = null; // 에러 상태에서도 명시 재시도 가능
    await revalidate(key, () => fetcherRef.current()).catch(() => {});
  }, [key]);

  return {
    data: entry?.data as T | undefined,
    error: hasData ? null : (entry?.error ?? null),
    // 데이터가 아직 한 번도 없으면 로딩(스켈레톤) — 에러면 ErrorState로 전환
    isLoading: !hasData && !entry?.error,
    isValidating: !!entry?.promise,
    refresh,
    dataUpdatedAt: entry?.ts ?? 0,
  };
}

/** 표준 fetcher — /api/admin/* JSON GET (ok:false·HTTP 오류를 throw로 통일). */
export async function fetchAdminJson<T = Record<string, unknown>>(
  url: string,
): Promise<T> {
  const res = await fetch(url);
  if (res.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("unauthorized");
  }
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error || "불러오지 못했습니다.");
  }
  return json as T;
}
