"use client";

// 운영자 권한 관리 (Step 16) — 운영자 목록 + manageOtc/manageEducation 체크박스.
// 체크 즉시 저장(PATCH). ★자기 자신 마지막 권한은 클라에서도 비활성 + API에서도 거부(이중 방어).
// 감사 기록: AdminUser에 lastEdited* 필드가 없어 남기지 않음(스키마 무변경).

import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { adminColors, CardSub, InlineError } from "@/components/admin/ui";
import { ErrorState, Skeleton } from "@/components/admin/States";

interface OperatorRow {
  id: number;
  username: string;
  displayName: string;
  manageOtc: boolean;
  manageEducation: boolean;
}

const Page = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1.5rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 2rem;
  }
`;

const Card = styled.section`
  border: 1px solid ${adminColors.border};
  border-radius: 14px;
  background: ${adminColors.white};
  padding: 1.1rem 1.25rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${adminColors.rowDivider};

  &:last-child {
    border-bottom: none;
  }
`;

const NameCol = styled.div`
  flex: 1;
  min-width: 10rem;
`;

const Name = styled.div`
  font-size: 0.92rem;
  font-weight: 800;
  color: ${adminColors.text};
`;

const Username = styled.div`
  font-size: 0.75rem;
  color: ${adminColors.textMuted};
`;

const SelfTag = styled.span`
  margin-left: 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${adminColors.primary};
`;

const CheckLabel = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.84rem;
  font-weight: 600;
  color: ${(p) => (p.$disabled ? adminColors.textFaint : adminColors.textSub)};
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  white-space: nowrap;

  input {
    width: 1rem;
    height: 1rem;
    accent-color: ${adminColors.primary};
    cursor: inherit;
  }
`;

export default function AdminOperatorsPage() {
  const [rows, setRows] = useState<OperatorRow[] | null>(null);
  const [selfId, setSelfId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/operators");
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "불러오기에 실패했습니다.");
      }
      setRows(json.operators);
      setSelfId(json.selfId ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "불러오기에 실패했습니다.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (
    row: OperatorRow,
    field: "manageOtc" | "manageEducation",
  ) => {
    const key = `${row.id}:${field}`;
    if (busyKey) return;
    setBusyKey(key);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/operators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: row.id, [field]: !row[field] }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "저장에 실패했습니다.");
      }
      setRows((prev) =>
        prev
          ? prev.map((r) => (r.id === row.id ? { ...r, ...json.operator } : r))
          : prev,
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setBusyKey(null);
    }
  };

  if (loadError && !rows) {
    return (
      <Page>
        <ErrorState message={loadError} onRetry={load} />
      </Page>
    );
  }
  if (!rows) {
    return (
      <Page>
        <Skeleton variant="table" count={4} />
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <CardSub style={{ marginTop: 0 }}>
          권한을 끄면 해당 화면·API 접근이 즉시 차단됩니다. 자기 자신의 마지막
          권한은 끌 수 없습니다(잠금 방지 — 다른 운영자가 조정).
        </CardSub>
        {saveError ? <InlineError>{saveError}</InlineError> : null}
        <List>
          {rows.map((row) => {
            const isSelf = row.id === selfId;
            // ★자기 잠금 방지 — 자기 자신이면서 해당 권한이 마지막 남은 하나면 비활성
            const lockOtc =
              isSelf && row.manageOtc && !row.manageEducation;
            const lockEducation =
              isSelf && row.manageEducation && !row.manageOtc;
            return (
              <Row key={row.id}>
                <NameCol>
                  <Name>
                    {row.displayName}
                    {isSelf ? <SelfTag>(나)</SelfTag> : null}
                  </Name>
                  <Username>@{row.username}</Username>
                </NameCol>
                <CheckLabel
                  $disabled={lockOtc || busyKey !== null}
                  title={
                    lockOtc
                      ? "자기 자신의 마지막 권한은 끌 수 없습니다."
                      : undefined
                  }
                >
                  <input
                    type="checkbox"
                    checked={row.manageOtc}
                    disabled={lockOtc || busyKey !== null}
                    onChange={() => toggle(row, "manageOtc")}
                  />
                  OTC 운영
                </CheckLabel>
                <CheckLabel
                  $disabled={lockEducation || busyKey !== null}
                  title={
                    lockEducation
                      ? "자기 자신의 마지막 권한은 끌 수 없습니다."
                      : undefined
                  }
                >
                  <input
                    type="checkbox"
                    checked={row.manageEducation}
                    disabled={lockEducation || busyKey !== null}
                    onChange={() => toggle(row, "manageEducation")}
                  />
                  교육 관리
                </CheckLabel>
              </Row>
            );
          })}
        </List>
      </Card>
    </Page>
  );
}
