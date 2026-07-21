"use client";

// 어드민 교육 화면 캐시 key + fetcher + 표시 헬퍼 (기존 admin-fetchers.ts 무접촉, 별도 파일).
// key 규칙: admin:edu:{도메인}[:{식별자}] — invalidate("admin:edu")로 일괄 무효화 가능.

import { fetchAdminJson } from "@/lib/admin-data";
import { adminColors } from "@/components/admin/ui";

export const EDU_LIST_TTL = 30_000;
export const EDU_DETAIL_TTL = 20_000;

/* ── 상태 라벨·색 (개설 승인 워크플로우) ── */

export const EDU_STATUS_LABEL: Record<string, string> = {
  PENDING: "검토 대기",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
  CANCELED: "취소됨",
};

export function eduStatusColor(status: string): string {
  if (status === "PENDING") return adminColors.alert;
  if (status === "APPROVED") return adminColors.success;
  if (status === "REJECTED") return adminColors.textMuted;
  return adminColors.textMuted;
}

export const EDU_CATEGORY_LABEL: Record<string, string> = {
  LECTURE: "강연",
  WORKSHOP: "실습",
  EVENT: "이벤트",
};

export const EDU_MODE_LABEL: Record<string, string> = {
  OFFLINE: "오프라인",
  ONLINE: "온라인",
  HYBRID: "혼합",
};

/* ── 목록 ── */

export interface EduListSession {
  date: string;
  startTime: string;
  endTime: string;
}

export interface EduListItem {
  id: number;
  title: string;
  category: string;
  mode: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  isTest: boolean;
  capacity: number | null;
  feeKrw: number;
  locationName: string | null;
  createdAt: string;
  session: EduListSession | null;
  sessionCount: number;
  applicationCount: number;
}

export interface EduListResponse {
  total: number;
  counts: { PENDING: number; APPROVED: number; REJECTED: number; CANCELED: number; total: number };
  items: EduListItem[];
}

export function eduListKey(status: string, includeTest: boolean) {
  return `admin:edu:list:${status}:${includeTest ? "T" : "F"}`;
}

export function eduListUrl(status: string, includeTest: boolean, offset = 0) {
  const params = new URLSearchParams({ limit: "50", offset: String(offset) });
  if (status !== "ALL") params.set("status", status);
  if (includeTest) params.set("includeTest", "1");
  return `/api/admin/education?${params.toString()}`;
}

/* ── 상세 ── */

export interface EduDetailSession {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface EduDetailEvent {
  id: number;
  title: string;
  slug: string;
  category: string;
  mode: string;
  status: string;
  rejectReason: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  isTest: boolean;
  posterUrl: string | null;
  posterFocus: string;
  descriptionMd: string | null;
  instructorName: string | null;
  instructorBio: string | null;
  officeId: number | null;
  office: { id: number; name: string } | null;
  customLocation: string | null;
  streamUrl: string | null;
  capacity: number | null;
  feeKrw: number;
  depositBankName: string | null;
  depositAccountNo: string | null;
  depositAccountHolder: string | null;
  eligibility: string | null;
  preparation: string | null;
  reward: string | null;
  refundPolicy: string | null;
  notice: string | null;
  applyDeadline: string | null;
  hostName: string | null;
  hostContact: string | null;
  hostEmail: string | null;
  lastEditedByName: string | null;
  lastEditedAt: string | null;
  createdAt: string;
  sessions: EduDetailSession[];
  _count: { applications: number };
}

export function eduDetailKey(id: number) {
  return `admin:edu:detail:${id}`;
}

export function eduDetailFetcher(id: number) {
  return () =>
    fetchAdminJson<{ event: EduDetailEvent }>(`/api/admin/education/${id}`).then(
      (j) => j.event,
    );
}

/* ── 신청자 명단 ── */

export interface EduApplicant {
  id: number;
  sessionId: number | null;
  name: string;
  contact: string;
  email: string | null;
  depositorName: string | null;
  question: string | null;
  status: string;
  paidConfirmedAt: string | null;
  attendedAt: string | null;
  createdAt: string;
}

export interface EduApplicantsResponse {
  event: {
    id: number;
    title: string;
    capacity: number | null;
    feeKrw: number;
    sessions: EduDetailSession[];
  };
  applications: EduApplicant[];
  appliedCount: number;
}

export function eduApplicantsKey(id: number) {
  return `admin:edu:applicants:${id}`;
}

export function eduApplicantsFetcher(id: number) {
  return () =>
    fetchAdminJson<EduApplicantsResponse>(
      `/api/admin/education/${id}/applicants`,
    );
}

/* ── 슬롯 ── */

export interface EduSlotItem {
  id: number;
  officeId: number;
  officeName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  memo: string | null;
}

export const EDU_SLOTS_KEY = "admin:edu:slots";
export const EDU_SLOTS_TTL = 30_000;

export const eduSlotsFetcher = () =>
  fetchAdminJson<{ items: EduSlotItem[] }>("/api/admin/education/slots").then(
    (j) => j.items,
  );

/* ── 교육 대시보드 (Step 16) ── */

export interface EduDashboardData {
  pendingEvents: number;
  pendingEducators: number;
  depositPending: number;
  weekEvents: { id: number; title: string; date: string; startTime: string }[];
  nearFull: {
    id: number;
    title: string;
    capacity: number;
    applied: number;
    full: boolean;
  }[];
}

export const EDU_DASHBOARD_KEY = "admin:edu:dashboard";
export const EDU_DASHBOARD_TTL = 30_000;

export const eduDashboardFetcher = () =>
  fetchAdminJson<EduDashboardData>("/api/admin/education/dashboard");

/* ── 표시 헬퍼 ── */

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export function fmtSessionBrief(
  session: { date: string; startTime: string } | null,
): string {
  if (!session) return "일정 미정";
  const d = session.date;
  const wd = WEEKDAY[new Date(`${d}T00:00:00+09:00`).getDay()];
  return `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}(${wd}) ${session.startTime}`;
}

export function fmtFeeKrw(feeKrw: number): string {
  return feeKrw <= 0 ? "무료" : `${feeKrw.toLocaleString("ko-KR")}원`;
}
