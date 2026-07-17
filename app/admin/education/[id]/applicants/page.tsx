"use client";

// /admin/education/[id]/applicants — 신청자 명단. 입금 확인·출석 체크 UI(저장은 4-B).
// 회차별 필터, 정원 대비 현황. 연락처는 운영 업무상 전체 표시.

import { use, useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import {
  FilterTab,
  InlineError,
  StatusBadge,
  ToolbarButton,
  adminColors,
} from "@/components/admin/ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/admin/States";
import { useAdminPageHeader } from "@/components/admin/AdminPageHeaderContext";
import { useAdminData } from "@/lib/admin-data";
import {
  EDU_LIST_TTL,
  eduApplicantsFetcher,
  eduApplicantsKey,
  type EduApplicantsResponse,
} from "@/lib/education-admin-fetchers";

const Wrap = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 0.8rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${adminColors.textMuted};
  text-decoration: none;
  &:hover {
    color: ${adminColors.primary};
  }
`;

const Summary = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;

  .title {
    font-size: 1.05rem;
    font-weight: 800;
    color: ${adminColors.text};
  }
  .count {
    font-size: 0.9rem;
    font-weight: 700;
    color: ${adminColors.primary};
    font-variant-numeric: tabular-nums;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
`;

const Table = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  overflow: hidden;
`;

const Head = styled.div`
  display: grid;
  grid-template-columns: 1fr 130px 96px 72px 72px;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  background: ${adminColors.bgSubtle};
  border-bottom: 1px solid ${adminColors.border};
  font-size: 0.72rem;
  font-weight: 700;
  color: ${adminColors.textMuted};

  @media (max-width: 680px) {
    grid-template-columns: 1fr 72px 72px;
    span[data-hide="true"] {
      display: none;
    }
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 130px 96px 72px 72px;
  gap: 0.5rem;
  align-items: center;
  padding: 0.7rem 1rem;
  border-top: 1px solid ${adminColors.rowDivider};
  font-size: 0.83rem;

  @media (max-width: 680px) {
    grid-template-columns: 1fr 72px 72px;
    div[data-hide="true"] {
      display: none;
    }
  }
`;

const Who = styled.div`
  min-width: 0;
  .name {
    font-weight: 700;
    color: ${adminColors.text};
  }
  .sub {
    margin-top: 0.15rem;
    font-size: 0.74rem;
    color: ${adminColors.textMuted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Cell = styled.div`
  font-size: 0.8rem;
  color: ${adminColors.textSub};
`;

const CheckBtn = styled.button<{ $on: boolean }>`
  width: 100%;
  padding: 0.35rem 0.3rem;
  border-radius: 7px;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid
    ${(p) => (p.$on ? adminColors.success : adminColors.borderInput)};
  background: ${(p) => (p.$on ? adminColors.successSoft : adminColors.white)};
  color: ${(p) => (p.$on ? adminColors.successDeep : adminColors.textMuted)};
`;

export default function AdminEducationApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = Number(id);
  const [sessionFilter, setSessionFilter] = useState<number | "ALL">("ALL");
  const [placeholderMsg, setPlaceholderMsg] = useState<string | null>(null);
  // 로컬 체크 상태(저장 배선은 4-B) — 표시 토글만
  const [localPaid, setLocalPaid] = useState<Record<number, boolean>>({});
  const [localAttended, setLocalAttended] = useState<Record<number, boolean>>({});

  const { data, error, isLoading, refresh } = useAdminData<EduApplicantsResponse>(
    eduApplicantsKey(eventId),
    eduApplicantsFetcher(eventId),
    { ttl: EDU_LIST_TTL },
  );

  useAdminPageHeader(
    "신청자 명단",
    useMemo(
      () => (
        <ToolbarButton type="button" style={{ marginLeft: 0 }} onClick={() => refresh()}>
          새로고침
        </ToolbarButton>
      ),
      [refresh],
    ),
  );

  const notWired = (label: string) =>
    setPlaceholderMsg(`[준비 중] ${label}은(는) 4-B에서 저장 배선됩니다.`);

  if (isLoading && !data) {
    return (
      <Wrap>
        <Skeleton variant="table" count={6} />
      </Wrap>
    );
  }
  if ((error && !data) || !data) {
    return (
      <Wrap>
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={refresh} />
      </Wrap>
    );
  }

  const { event, applications, appliedCount } = data;
  const hasSessions = event.sessions.length > 1;
  const visible =
    sessionFilter === "ALL"
      ? applications
      : applications.filter((a) => a.sessionId === sessionFilter);

  const paidOn = (a: { id: number; paidConfirmedAt: string | null }) =>
    localPaid[a.id] ?? a.paidConfirmedAt != null;
  const attendedOn = (a: { id: number; attendedAt: string | null }) =>
    localAttended[a.id] ?? a.attendedAt != null;

  return (
    <Wrap>
      <BackLink href={`/admin/education/${eventId}`}>← 행사 상세</BackLink>
      <Summary>
        <span className="title">{event.title}</span>
        <span className="count">
          신청 {appliedCount}
          {event.capacity != null ? ` / 정원 ${event.capacity}` : "명"}
        </span>
      </Summary>

      {placeholderMsg ? <InlineError>{placeholderMsg}</InlineError> : null}

      {hasSessions ? (
        <Tabs>
          <FilterTab
            type="button"
            $active={sessionFilter === "ALL"}
            onClick={() => setSessionFilter("ALL")}
          >
            전체 회차
          </FilterTab>
          {event.sessions.map((s) => (
            <FilterTab
              key={s.id}
              type="button"
              $active={sessionFilter === s.id}
              onClick={() => setSessionFilter(s.id)}
            >
              {Number(s.date.slice(5, 7))}/{Number(s.date.slice(8, 10))} {s.startTime}
            </FilterTab>
          ))}
        </Tabs>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState icon="🗒️" title="신청자가 없습니다" desc="아직 이 행사에 신청한 사람이 없습니다." />
      ) : (
        <Table>
          <Head>
            <span>신청자</span>
            <span data-hide="true">신청일시</span>
            <span data-hide="true">상태</span>
            <span>입금</span>
            <span>출석</span>
          </Head>
          {visible.map((a) => (
            <Row key={a.id}>
              <Who>
                <div className="name">
                  {a.name}
                  {a.status === "CANCELED" ? (
                    <StatusBadge
                      $color={adminColors.textMuted}
                      style={{ marginLeft: "0.4rem" }}
                    >
                      취소
                    </StatusBadge>
                  ) : null}
                </div>
                <div className="sub">
                  {a.contact}
                  {a.depositorName ? ` · 입금자 ${a.depositorName}` : ""}
                  {a.question ? ` · Q: ${a.question}` : ""}
                </div>
              </Who>
              <Cell data-hide="true">
                {new Date(a.createdAt).toLocaleString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Cell>
              <Cell data-hide="true">
                {a.status === "APPLIED" ? "신청" : "취소"}
              </Cell>
              <div>
                <CheckBtn
                  type="button"
                  $on={paidOn(a)}
                  onClick={() => {
                    setLocalPaid((p) => ({ ...p, [a.id]: !paidOn(a) }));
                    notWired("입금 확인");
                  }}
                >
                  {paidOn(a) ? "확인" : "미확인"}
                </CheckBtn>
              </div>
              <div>
                <CheckBtn
                  type="button"
                  $on={attendedOn(a)}
                  onClick={() => {
                    setLocalAttended((p) => ({ ...p, [a.id]: !attendedOn(a) }));
                    notWired("출석 체크");
                  }}
                >
                  {attendedOn(a) ? "출석" : "-"}
                </CheckBtn>
              </div>
            </Row>
          ))}
        </Table>
      )}
    </Wrap>
  );
}
