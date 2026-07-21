"use client";

// 운영자 관리 (Step 27) — ★총괄 전용. 목록(role 배지·활성 상태) + role 드롭다운 + 활성 토글 + 계정 생성.
// role = manageOtc/manageEducation 조합의 표현(게이트는 여전히 두 불리언). API가 실제 게이트·잠김방지·해싱 담당.
// 이 화면은 API가 403이면 "총괄 전용" 안내만 보여주고 데이터를 노출하지 않는다(화면·API 이중 게이트).

import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  adminColors,
  CardSub,
  CardTitle,
  InlineError,
  PrimaryButton,
  StatusBadge,
} from "@/components/admin/ui";
import { ErrorState, Skeleton } from "@/components/admin/States";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_LABEL,
  roleFromScopes,
  type AdminRole,
} from "@/lib/admin-role";

interface OperatorRow {
  id: number;
  username: string;
  displayName: string;
  manageOtc: boolean;
  manageEducation: boolean;
  isActive: boolean;
}

const Page = styled.div`
  max-width: 760px;
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
  margin-bottom: 1.1rem;
`;

const Denied = styled.div`
  border: 1px solid ${adminColors.warnBorder};
  background: ${adminColors.warnSoft};
  border-radius: 14px;
  padding: 1.5rem 1.25rem;
  text-align: center;
  color: ${adminColors.warnText};
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.6;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div<{ $inactive?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${adminColors.rowDivider};
  opacity: ${(p) => (p.$inactive ? 0.6 : 1)};

  &:last-child {
    border-bottom: none;
  }
`;

const NameCol = styled.div`
  flex: 1;
  min-width: 9rem;
`;

const Name = styled.div`
  font-size: 0.92rem;
  font-weight: 800;
  color: ${adminColors.text};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

const Username = styled.div`
  font-size: 0.75rem;
  color: ${adminColors.textMuted};
`;

const SelfTag = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${adminColors.primary};
`;

const Select = styled.select`
  padding: 0.4rem 0.55rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  font-size: 0.84rem;
  background: ${adminColors.white};
  color: ${adminColors.text};
  cursor: pointer;

  &:disabled {
    background: ${adminColors.bgSubtle};
    color: ${adminColors.textFaint};
    cursor: not-allowed;
  }
  &:focus {
    outline: none;
    border-color: ${adminColors.primary};
  }
`;

const RowBtn = styled.button<{ $danger?: boolean }>`
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  border: 1px solid
    ${(p) => (p.$danger ? adminColors.dangerBorder : adminColors.borderInput)};
  background: ${adminColors.white};
  color: ${(p) => (p.$danger ? adminColors.dangerText : adminColors.textSub)};
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: ${(p) => (p.$danger ? adminColors.danger : adminColors.primary)};
    color: ${(p) => (p.$danger ? adminColors.danger : adminColors.primary)};
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Field = styled.label`
  display: block;
  margin-bottom: 0.8rem;
`;
const FieldLabel = styled.span`
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
  margin-bottom: 0.3rem;
`;
const Input = styled.input`
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  font-size: 0.88rem;
  background: ${adminColors.white};
  color: ${adminColors.text};
  &:focus {
    outline: none;
    border-color: ${adminColors.primary};
  }
`;
const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;
const Hint = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.78rem;
  color: ${adminColors.textMuted};
  line-height: 1.55;
`;
const OkNote = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${adminColors.successStrong};
`;

const ROLE_TONE: Record<AdminRole, string> = {
  super: adminColors.primary,
  otc: adminColors.info,
  education: adminColors.successStrong,
};

function roleBadge(row: OperatorRow) {
  const r = roleFromScopes(row.manageOtc, row.manageEducation);
  if (r == null) {
    return <StatusBadge $color={adminColors.textMuted}>권한 없음</StatusBadge>;
  }
  return <StatusBadge $color={ROLE_TONE[r]}>{ADMIN_ROLE_LABEL[r]}</StatusBadge>;
}

export default function AdminOperatorsPage() {
  const [rows, setRows] = useState<OperatorRow[] | null>(null);
  const [selfId, setSelfId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // 계정 생성 폼
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("otc");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setDenied(false);
    try {
      const res = await fetch("/api/admin/operators");
      if (res.status === 403) {
        setDenied(true);
        setRows([]);
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "불러오기에 실패했습니다.");
      setRows(json.operators);
      setSelfId(json.selfId ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "불러오기에 실패했습니다.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 활성 총괄 수(잠김 방지 클라 미러) — 마지막 활성 총괄이면 강등·비활성 비활성화
  const activeSuperCount = (rows ?? []).filter(
    (r) => r.manageOtc && r.manageEducation && r.isActive,
  ).length;

  const isLastActiveSuper = (row: OperatorRow) =>
    row.manageOtc && row.manageEducation && row.isActive && activeSuperCount <= 1;

  const patch = async (id: number, payload: Record<string, unknown>) => {
    if (busyId != null) return;
    setBusyId(id);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/operators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: id, ...payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "저장에 실패했습니다.");
      setRows((prev) =>
        prev ? prev.map((r) => (r.id === id ? { ...r, ...json.operator } : r)) : prev,
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const create = async () => {
    if (creating) return;
    setCreating(true);
    setCreateMsg(null);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          displayName: newDisplayName.trim(),
          password: newPassword,
          role: newRole,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "생성에 실패했습니다.");
      setRows((prev) => (prev ? [...prev, json.operator] : [json.operator]));
      setCreateMsg(
        `@${json.operator.username} 계정을 만들었습니다. 첫 로그인 후 /admin/profile에서 비밀번호를 변경하도록 안내해 주세요.`,
      );
      setNewUsername("");
      setNewDisplayName("");
      setNewPassword("");
      setNewRole("otc");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  if (denied) {
    return (
      <Page>
        <Denied>
          운영자 관리 화면은 <strong>총괄 운영자</strong>만 접근할 수 있습니다.
          <br />
          권한이 필요하면 다른 총괄 운영자에게 요청해 주세요.
        </Denied>
      </Page>
    );
  }
  if (loadError && (!rows || rows.length === 0)) {
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

  const canCreate =
    newUsername.trim().length >= 2 &&
    newDisplayName.trim().length >= 1 &&
    newPassword.length >= 8;

  return (
    <Page>
      <Card>
        <CardTitle>운영자 목록</CardTitle>
        <CardSub style={{ marginTop: "0.25rem" }}>
          역할을 바꾸면 해당 화면·API 권한이 즉시 반영됩니다. 마지막 총괄은 강등·비활성화할 수 없습니다.
        </CardSub>
        {saveError ? <InlineError>{saveError}</InlineError> : null}
        <List>
          {rows.map((row) => {
            const isSelf = row.id === selfId;
            const currentRole = roleFromScopes(row.manageOtc, row.manageEducation);
            const lastSuper = isLastActiveSuper(row);
            const rowBusy = busyId === row.id;
            return (
              <Row key={row.id} $inactive={!row.isActive}>
                <NameCol>
                  <Name>
                    {row.displayName}
                    {isSelf ? <SelfTag>(나)</SelfTag> : null}
                    {roleBadge(row)}
                    {!row.isActive ? (
                      <StatusBadge $color={adminColors.textMuted}>비활성</StatusBadge>
                    ) : null}
                  </Name>
                  <Username>@{row.username}</Username>
                </NameCol>

                <Select
                  aria-label={`${row.displayName} 역할`}
                  value={currentRole ?? ""}
                  disabled={rowBusy || !row.isActive}
                  onChange={(e) => patch(row.id, { role: e.target.value })}
                  title={
                    lastSuper ? "마지막 총괄이라 다른 역할로 바꿀 수 없습니다." : undefined
                  }
                >
                  {currentRole == null ? <option value="">권한 없음</option> : null}
                  {ADMIN_ROLES.map((r) => (
                    <option
                      key={r}
                      value={r}
                      // 마지막 활성 총괄은 super 외 다른 role 선택 불가(잠김 방지)
                      disabled={lastSuper && r !== "super"}
                    >
                      {ADMIN_ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>

                {row.isActive ? (
                  <RowBtn
                    type="button"
                    $danger
                    disabled={rowBusy || lastSuper}
                    title={lastSuper ? "마지막 총괄은 비활성화할 수 없습니다." : undefined}
                    onClick={() => patch(row.id, { isActive: false })}
                  >
                    비활성화
                  </RowBtn>
                ) : (
                  <RowBtn
                    type="button"
                    disabled={rowBusy}
                    onClick={() => patch(row.id, { isActive: true })}
                  >
                    다시 활성화
                  </RowBtn>
                )}
              </Row>
            );
          })}
        </List>
      </Card>

      <Card>
        <CardTitle>운영자 계정 만들기</CardTitle>
        <CardSub style={{ marginTop: "0.25rem" }}>
          초기 비밀번호는 생성자가 정해 본인에게 직접 전달하세요.
        </CardSub>
        <FieldRow>
          <Field>
            <FieldLabel>사용자명 (로그인 ID)</FieldLabel>
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="영문·숫자 2~30자"
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel>표시 이름</FieldLabel>
            <Input
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="예: 홍길동"
              autoComplete="off"
            />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field>
            <FieldLabel>초기 비밀번호 (최소 8자)</FieldLabel>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="본인에게 직접 전달"
              autoComplete="new-password"
            />
          </Field>
          <Field>
            <FieldLabel>역할</FieldLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              style={{ width: "100%" }}
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ADMIN_ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
        </FieldRow>
        <PrimaryButton type="button" disabled={creating || !canCreate} onClick={create}>
          {creating ? "생성 중…" : "계정 생성"}
        </PrimaryButton>
        <Hint>
          생성 후 본인이 첫 로그인 하면 <strong>/admin/profile</strong>에서 비밀번호를 바꾸도록 안내해 주세요.
        </Hint>
        {createMsg ? <OkNote>{createMsg}</OkNote> : null}
      </Card>
    </Page>
  );
}
