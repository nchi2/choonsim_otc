"use client";

// 캐시 key + fetcher 중앙 정의 — 셸 prefetch와 각 화면이 반드시 같은 key를 쓰게 한다.
// key 규칙: admin:{도메인}[:{식별자}] (lib/admin-data.ts 참조)

import { fetchAdminJson, mutate } from "@/lib/admin-data";

/* ── stats (셸 배지·벨) ── */

export const STATS_KEY = "admin:stats";
export const STATS_TTL = 45_000;

export interface AdminStatsData {
  total: number;
  pending: number;
  contacted: number;
  verified: number;
  completed: number;
  canceled: number;
  active: number;
  otc: {
    total: number;
    pending: number;
    contacted: number;
    agreed: number;
    completed: number;
    canceled: number;
  };
  otcPending: number;
  commentUnread: number;
  walletStock: number;
  walletIn: number;
  walletOut: number;
  wallet: { stock: number; onOrder: number; reserved: number };
}

export const statsFetcher = () =>
  fetchAdminJson<{ stats: AdminStatsData }>("/api/admin/stats").then(
    (j) => j.stats,
  );

/* ── dashboard — 성공 시 stats 캐시를 부산물로 채움 (셸 중복 호출 제거) ── */

export const DASHBOARD_KEY = "admin:dashboard";
export const DASHBOARD_TTL = 30_000;

export interface DashboardData {
  stats: AdminStatsData;
  offices: {
    id: number;
    code: string;
    name: string;
    address: string | null;
    isActive: boolean;
    sortOrder: number;
  }[];
  todayMySchedule: {
    orderId: number;
    time: string;
    name: string;
    officeName: string | null;
    isTest: boolean;
  }[];
}

export const dashboardFetcher = () =>
  fetchAdminJson<DashboardData>("/api/admin/dashboard").then((j) => {
    mutate(STATS_KEY, j.stats);
    return j;
  });

/* ── 신청 목록 (첫 페이지만 캐시 — 더 보기는 컴포넌트 로컬) ── */

export const LIST_TTL = 30_000;

/** includeTest 포함/제외가 같은 key를 쓰면 데이터가 섞인다 — 반드시 T/F 분리. */
export function miracle10ListKey(status: string, includeTest: boolean) {
  return `admin:list:miracle10:${status}:${includeTest ? "T" : "F"}`;
}

export function miracle10ListUrl(
  status: string,
  includeTest: boolean,
  offset = 0,
) {
  const params = new URLSearchParams({ limit: "50", offset: String(offset) });
  if (status !== "ALL") params.set("status", status);
  if (includeTest) params.set("includeTest", "1");
  return `/api/admin/miracle10?${params.toString()}`;
}

export function otcListKey(status: string, includeTest: boolean) {
  return `admin:list:otc:${status}:${includeTest ? "T" : "F"}`;
}

export function otcListUrl(status: string, includeTest: boolean, offset = 0) {
  const params = new URLSearchParams({ limit: "50", offset: String(offset) });
  if (status !== "ALL") params.set("status", status);
  if (includeTest) params.set("includeTest", "1");
  return `/api/admin/otc-requests?${params.toString()}`;
}

/* ── 재고 ── */

export const INVENTORY_KEY = "admin:inventory";
export const INVENTORY_TTL = 30_000;
export const inventoryFetcher = () =>
  fetchAdminJson("/api/admin/wallet-inventory");

/* ── 사무실 (상세·캘린더 공용) ── */

export const OFFICES_KEY = "admin:offices";
export const OFFICES_TTL = 300_000;
export const officesFetcher = () =>
  fetchAdminJson<{ offices: DashboardData["offices"] }>(
    "/api/admin/offices",
  ).then((j) => j.offices);

/* ── 캘린더 (근무 슬롯 + 예약 묶음) ── */

export const CALENDAR_TTL = 60_000;

export function calendarKey(officeId: number, ym: string) {
  return `admin:calendar:${officeId}:${ym}`;
}

export function calendarFetcher(officeId: number, from: string, to: string) {
  return async () => {
    const [slots, reservations] = await Promise.all([
      fetchAdminJson<{ items: unknown[] }>(
        `/api/admin/work-slots?officeId=${officeId}&from=${from}&to=${to}`,
      ),
      fetchAdminJson<{ items: unknown[] }>(
        `/api/admin/schedule/reservations?officeId=${officeId}&from=${from}&to=${to}`,
      ),
    ]);
    return { slots: slots.items, reservations: reservations.items };
  };
}

/* ── 내 근무 슬롯 (프로필 주간 요약 — mine=1 확장 API 1회) ── */

export const MYSLOTS_TTL = 60_000;

export function myslotsKey(from: string) {
  return `admin:myslots:${from}`;
}

export function myslotsFetcher(from: string, to: string) {
  return () =>
    fetchAdminJson<{
      items: { date: string; startTime: string; officeName: string }[];
    }>(`/api/admin/work-slots?mine=1&from=${from}&to=${to}`).then(
      (j) => j.items,
    );
}
