"use client";

// /admin/education/educators — 교육자 자격 신청 목록·승인/반려. 기존 어드민 패턴
// (useAdminData·States·FilterTab·StatusBadge) 재사용. 쓰기는 manageEducation 스코프(API 게이트).
// 신청 소개·계획 텍스트는 미저장(알림 메일 참조) — 회원 프로필 기준 검토.

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import {
  FilterTab,
  FilterTabCount,
  InlineError,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  ToolbarButton,
  adminColors,
} from "@/components/admin/ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/admin/States";
import { useAdminPageHeader } from "@/components/admin/AdminPageHeaderContext";
import { invalidate, useAdminData, fetchAdminJson } from "@/lib/admin-data";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";
const TAB_ORDER: StatusFilter[] = ["PENDING", "APPROVED", "REJECTED", "ALL"];
const TAB_LABEL: Record<StatusFilter, string> = {
  PENDING: "검토 대기",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
  ALL: "전체",
};

function statusColor(s: string): string {
  if (s === "PENDING") return adminColors.alert;
  if (s === "APPROVED") return adminColors.success;
  return adminColors.textMuted;
}

interface EducatorItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  joinedAt: string;
  educatorStatus: string;
  educatorRejectReason: string | null;
  educatorAppliedAt: string | null;
  educatorApprovedAt: string | null;
  hostedEventCount: number;
}

interface ListResponse {
  counts: { PENDING: number; APPROVED: number; REJECTED: number; total: number };
  items: EducatorItem[];
}

const Wrap = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const BackLink = styled(Link)`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${adminColors.textMuted};
  text-decoration: none;
  margin-right: auto;
  &:hover {
    color: ${adminColors.primary};
  }
`;

const Card = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  padding: 0.9rem 1rem;
  margin-bottom: 0.7rem;
`;

const Row1 = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  .name {
    font-weight: 800;
    color: ${adminColors.text};
  }
  .meta {
    font-size: 0.78rem;
    color: ${adminColors.textMuted};
  }
`;

const Detail = styled.p`
  margin: 0.4rem 0 0;
  font-size: 0.78rem;
  color: ${adminColors.textMuted};
  line-height: 1.5;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.7rem;
`;

const ReasonInput = styled.input`
  flex: 1;
  min-width: 180px;
  padding: 0.45rem 0.6rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  font-size: 0.82rem;
  &:focus {
    outline: none;
    border-color: ${adminColors.primary};
  }
`;

const RejectBtn = styled(SecondaryButton)`
  border-color: ${adminColors.dangerBorder};
  color: ${adminColors.dangerText};
  &:hover {
    background: ${adminColors.dangerSoft};
  }
`;

function EducatorsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("status");
  const filter: StatusFilter =
    raw === "APPROVED" || raw === "REJECTED" || raw === "ALL" ? raw : "PENDING";

  const cacheKey = `admin:edu:educators:${filter}`;
  const { data, error, isLoading, refresh } = useAdminData<ListResponse>(
    cacheKey,
    () =>
      fetchAdminJson<ListResponse>(
        `/api/admin/education/educators${filter === "ALL" ? "" : `?status=${filter}`}`,
      ),
    { ttl: 20_000 },
  );

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const doRefresh = useCallback(() => invalidate("admin:edu:educators"), []);
  useAdminPageHeader(
    "교육자 신청",
    useMemo(
      () => (
        <ToolbarButton type="button" style={{ marginLeft: 0 }} onClick={doRefresh}>
          새로고침
        </ToolbarButton>
      ),
      [doRefresh],
    ),
  );

  const decide = async (memberId: string, status: "APPROVED" | "REJECTED") => {
    if (busyId) return;
    const rejectReason = reasons[memberId]?.trim() ?? "";
    if (status === "REJECTED" && !rejectReason) {
      setActionErr("반려 사유를 입력해 주세요.");
      return;
    }
    setBusyId(memberId);
    setActionErr(null);
    try {
      const res = await fetch(`/api/admin/education/educators/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectReason: rejectReason || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "저장 실패");
      invalidate("admin:edu:educators");
      refresh();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const counts = data?.counts;
  const tabCount = (t: StatusFilter) =>
    t === "ALL" ? (counts?.total ?? 0) : (counts?.[t] ?? 0);

  return (
    <Wrap>
      <TopRow>
        <BackLink href="/admin/education">← 교육 관리</BackLink>
        {TAB_ORDER.map((t) => (
          <FilterTab
            key={t}
            type="button"
            $active={filter === t}
            onClick={() =>
              router.replace(`/admin/education/educators?status=${t}`, {
                scroll: false,
              })
            }
          >
            {TAB_LABEL[t]}
            <FilterTabCount $active={filter === t}>{tabCount(t)}</FilterTabCount>
          </FilterTab>
        ))}
      </TopRow>

      {actionErr ? <InlineError style={{ marginBottom: "0.8rem" }}>{actionErr}</InlineError> : null}

      {isLoading && !data ? (
        <Skeleton variant="table" count={4} />
      ) : error && !data ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={refresh}
        />
      ) : (data?.items ?? []).length === 0 ? (
        <EmptyState
          icon="🧑‍🏫"
          title="신청이 없습니다"
          desc="이 상태의 교육자 신청이 아직 없습니다."
        />
      ) : (
        (data?.items ?? []).map((m) => (
          <Card key={m.id}>
            <Row1>
              <span className="name">{m.name}</span>
              <StatusBadge $color={statusColor(m.educatorStatus)}>
                {TAB_LABEL[m.educatorStatus as StatusFilter] ?? m.educatorStatus}
              </StatusBadge>
              <span className="meta">
                {m.email}
                {m.phone ? ` · ${m.phone}` : " · 전화 미등록"}
                {m.emailVerified ? " · ✉인증됨" : " · ✉미인증"}
              </span>
            </Row1>
            <Detail>
              가입 {new Date(m.joinedAt).toLocaleDateString("ko-KR")}
              {m.educatorAppliedAt
                ? ` · 신청 ${new Date(m.educatorAppliedAt).toLocaleString("ko-KR")}`
                : ""}
              {m.hostedEventCount > 0 ? ` · 개설 행사 ${m.hostedEventCount}건` : ""}
              {m.educatorStatus === "REJECTED" && m.educatorRejectReason
                ? ` · 반려 사유: ${m.educatorRejectReason}`
                : ""}
              {" · 신청 소개는 알림 메일 참조"}
            </Detail>
            <ActionRow>
              {m.educatorStatus !== "APPROVED" ? (
                <PrimaryButton
                  type="button"
                  disabled={busyId != null}
                  onClick={() => void decide(m.id, "APPROVED")}
                >
                  승인
                </PrimaryButton>
              ) : null}
              {m.educatorStatus !== "REJECTED" ? (
                <>
                  <ReasonInput
                    value={reasons[m.id] ?? ""}
                    onChange={(e) =>
                      setReasons((p) => ({ ...p, [m.id]: e.target.value }))
                    }
                    placeholder="반려 사유 (반려 시 필수)"
                  />
                  <RejectBtn
                    type="button"
                    disabled={busyId != null}
                    onClick={() => void decide(m.id, "REJECTED")}
                  >
                    {m.educatorStatus === "APPROVED" ? "자격 철회" : "반려"}
                  </RejectBtn>
                </>
              ) : null}
            </ActionRow>
          </Card>
        ))
      )}
    </Wrap>
  );
}

export default function AdminEducatorsPage() {
  return (
    <Suspense fallback={<Wrap><Skeleton variant="table" count={4} /></Wrap>}>
      <EducatorsInner />
    </Suspense>
  );
}
