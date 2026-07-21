"use client";

// 신청자 명단·출석 (Step 18) — 교육자 본인 행사 전용.
// 열람 + 입금확인(paidConfirmedAt)·출석(attendedAt) 토글만. 내보내기 없음.
// 개인정보 고지: "참여 확인 목적 외 사용 금지" 안내 표시.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import { formatPhone } from "@/lib/format-phone";

interface Applicant {
  id: number;
  name: string;
  contact: string;
  depositorName: string | null;
  status: string;
  paidConfirmedAt: string | null;
  attendedAt: string | null;
  createdAt: string;
}

const Wrap = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
`;

const Top = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.35rem;
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
`;

const BackLink = styled(Link)`
  font-size: 0.85rem;
  font-weight: 600;
  color: #4338ca;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const CountLine = styled.p`
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: #4b5563;
  font-weight: 600;
`;

const Notice = styled.p`
  margin: 0 0 1rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: #fef9c3;
  border: 1px solid #fde68a;
  font-size: 0.8rem;
  color: #713f12;
  line-height: 1.5;
`;

const ErrBar = styled.p`
  margin: 0 0 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 0.85rem;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  min-width: 640px;

  th,
  td {
    padding: 0.6rem 0.7rem;
    text-align: left;
    border-bottom: 1px solid #f3f4f6;
    white-space: nowrap;
  }
  th {
    background: #f9fafb;
    font-weight: 700;
    color: #374151;
    font-size: 0.78rem;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const Idx = styled.td`
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
`;

const CanceledRow = styled.tr`
  opacity: 0.5;
`;

const StatusTag = styled.span<{ $canceled: boolean }>`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${(p) => (p.$canceled ? "#9ca3af" : "#059669")};
`;

const CheckBtn = styled.button<{ $on: boolean }>`
  min-width: 3.6rem;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$on ? "#059669" : "#d1d5db")};
  background: ${(p) => (p.$on ? "#059669" : "#fff")};
  color: ${(p) => (p.$on ? "#fff" : "#6b7280")};
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const Empty = styled.div`
  padding: 2.5rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
`;

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RosterClient({
  eventId,
  title,
  isPaid,
}: {
  eventId: number;
  title: string;
  isPaid: boolean;
}) {
  const [rows, setRows] = useState<Applicant[] | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch(
        `/api/member/hosted-events/${eventId}/applicants`,
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "불러오지 못했습니다.");
      setRows(json.applications);
      setAppliedCount(json.appliedCount ?? 0);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "불러오지 못했습니다.");
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (
    app: Applicant,
    field: "paidConfirmed" | "attended",
  ) => {
    const key = `${app.id}:${field}`;
    if (busyKey) return;
    const current =
      field === "paidConfirmed" ? app.paidConfirmedAt : app.attendedAt;
    setBusyKey(key);
    setErr(null);
    try {
      const res = await fetch(
        `/api/member/hosted-events/${eventId}/applicants/${app.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: current == null }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "저장에 실패했습니다.");
      setRows((prev) =>
        prev
          ? prev.map((r) =>
              r.id === app.id
                ? {
                    ...r,
                    paidConfirmedAt: json.application.paidConfirmedAt,
                    attendedAt: json.application.attendedAt,
                  }
                : r,
            )
          : prev,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <PublicShell showTicker={false}>
      <Wrap>
        <Top>
          <Title>{title}</Title>
          <BackLink href="/mypage">← 마이페이지</BackLink>
        </Top>
        <CountLine>신청 {appliedCount}명 (취소 제외)</CountLine>
        <Notice>
          이 명단은 <strong>참여 확인(출석·입금) 목적</strong>으로만 사용해 주세요.
          연락처 등 개인정보를 그 외 용도로 이용·공유·저장하는 것은 금지됩니다.
        </Notice>

        {err ? <ErrBar>{err}</ErrBar> : null}

        {rows == null ? (
          <Empty>불러오는 중…</Empty>
        ) : rows.length === 0 ? (
          <Empty>아직 신청자가 없습니다.</Empty>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>이름</th>
                  <th>연락처</th>
                  {isPaid ? <th>입금자명</th> : null}
                  <th>신청일시</th>
                  <th>상태</th>
                  {isPaid ? <th>입금확인</th> : null}
                  <th>출석</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((app, i) => {
                  const canceled = app.status === "CANCELED";
                  const RowTag = canceled ? CanceledRow : "tr";
                  return (
                    <RowTag key={app.id}>
                      <Idx as="td">{i + 1}</Idx>
                      <td>{app.name}</td>
                      <td>{formatPhone(app.contact)}</td>
                      {isPaid ? <td>{app.depositorName || "-"}</td> : null}
                      <td>{fmtDateTime(app.createdAt)}</td>
                      <td>
                        <StatusTag $canceled={canceled}>
                          {canceled ? "취소" : "신청"}
                        </StatusTag>
                      </td>
                      {isPaid ? (
                        <td>
                          <CheckBtn
                            type="button"
                            $on={app.paidConfirmedAt != null}
                            disabled={canceled || busyKey != null}
                            onClick={() => void toggle(app, "paidConfirmed")}
                          >
                            {app.paidConfirmedAt != null ? "확인됨" : "확인"}
                          </CheckBtn>
                        </td>
                      ) : null}
                      <td>
                        <CheckBtn
                          type="button"
                          $on={app.attendedAt != null}
                          disabled={canceled || busyKey != null}
                          onClick={() => void toggle(app, "attended")}
                        >
                          {app.attendedAt != null ? "출석" : "체크"}
                        </CheckBtn>
                      </td>
                    </RowTag>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Wrap>
    </PublicShell>
  );
}
