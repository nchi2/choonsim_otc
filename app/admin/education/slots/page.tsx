"use client";

// /admin/education/slots — 교육 회관 슬롯(EducationSlot) 등록·삭제·조회. WorkSlot과 별개.
// POST /api/admin/education/slots · DELETE /slots/[id] (manageEducation 스코프). (4-B 배선 완료)

import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  InlineError,
  PrimaryButton,
  ToolbarButton,
  adminColors,
} from "@/components/admin/ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/admin/States";
import { useAdminPageHeader } from "@/components/admin/AdminPageHeaderContext";
import { invalidate, useAdminData } from "@/lib/admin-data";
import {
  OFFICES_KEY,
  OFFICES_TTL,
  officesFetcher,
  type DashboardData,
} from "@/lib/admin-fetchers";
import {
  EDU_SLOTS_KEY,
  EDU_SLOTS_TTL,
  eduSlotsFetcher,
  type EduSlotItem,
} from "@/lib/education-admin-fetchers";

const Wrap = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
`;

const Card = styled.section`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  padding: 1.1rem 1.25rem;
  margin-bottom: 1.25rem;
`;

const CardTitle = styled.h2`
  margin: 0 0 0.8rem;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${adminColors.text};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr 1fr;
  gap: 0.6rem;
  align-items: end;

  @media (max-width: 680px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Field = styled.label`
  display: block;
`;

const FieldLabel = styled.span`
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
  margin-bottom: 0.25rem;
`;

const inputCss = `
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  font-size: 0.85rem;
  background: ${adminColors.white};
  color: ${adminColors.text};
  &:focus { outline: none; border-color: ${adminColors.primary}; }
`;
const Input = styled.input`
  ${inputCss}
`;
const Select = styled.select`
  ${inputCss}
`;

const MemoRow = styled.div`
  margin-top: 0.6rem;
`;

const List = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  overflow: hidden;
`;

const SlotRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr 140px 56px;
  gap: 0.6rem;
  align-items: center;
  padding: 0.7rem 1rem;
  border-top: 1px solid ${adminColors.rowDivider};
  font-size: 0.84rem;
  &:first-child {
    border-top: none;
  }

  .office {
    font-weight: 700;
    color: ${adminColors.text};
  }
  .time {
    color: ${adminColors.textSub};
    font-variant-numeric: tabular-nums;
  }
  .memo {
    color: ${adminColors.textMuted};
    font-size: 0.78rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const DeleteBtn = styled.button`
  padding: 0.3rem 0.5rem;
  border-radius: 7px;
  border: 1px solid ${adminColors.dangerBorder};
  background: ${adminColors.white};
  color: ${adminColors.dangerText};
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: ${adminColors.dangerSoft};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function weekday(date: string) {
  return ["일", "월", "화", "수", "목", "금", "토"][
    new Date(`${date}T00:00:00+09:00`).getDay()
  ];
}

export default function AdminEducationSlotsPage() {
  const offices = useAdminData<DashboardData["offices"]>(
    OFFICES_KEY,
    officesFetcher,
    { ttl: OFFICES_TTL },
  );
  const slots = useAdminData<EduSlotItem[]>(EDU_SLOTS_KEY, eduSlotsFetcher, {
    ttl: EDU_SLOTS_TTL,
  });

  const [officeId, setOfficeId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useAdminPageHeader(
    "교육 슬롯",
    useMemo(
      () => (
        <ToolbarButton
          type="button"
          style={{ marginLeft: 0 }}
          onClick={() => slots.refresh()}
        >
          새로고침
        </ToolbarButton>
      ),
      [slots],
    ),
  );

  // Step 16: 교육 슬롯 회관 선택지는 educationActive 기준(OTC isActive와 독립)
  const activeOffices = (offices.data ?? []).filter((o) => o.educationActive);
  const canSubmit =
    !busy && officeId !== "" && date !== "" && startTime !== "" && endTime !== "";

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setErrMsg(null);
    try {
      const res = await fetch("/api/admin/education/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officeId: Number(officeId),
          date,
          startTime,
          endTime,
          memo: memo.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "등록 실패");
      setDate("");
      setStartTime("");
      setEndTime("");
      setMemo("");
      invalidate(EDU_SLOTS_KEY);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "슬롯 등록에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (busy) return;
    if (!window.confirm("이 슬롯을 삭제할까요?")) return;
    setBusy(true);
    setErrMsg(null);
    try {
      const res = await fetch(`/api/admin/education/slots/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "삭제 실패");
      invalidate(EDU_SLOTS_KEY);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Wrap>
      <Card>
        <CardTitle>교육 슬롯 등록</CardTitle>
        <FormGrid>
          <Field>
            <FieldLabel>회관</FieldLabel>
            <Select value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
              <option value="">선택</option>
              {activeOffices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <FieldLabel>날짜</FieldLabel>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>시작</FieldLabel>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>종료</FieldLabel>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>
        </FormGrid>
        <MemoRow>
          <Field>
            <FieldLabel>메모 (선택)</FieldLabel>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 대관 확정" />
          </Field>
        </MemoRow>
        {errMsg ? <InlineError>{errMsg}</InlineError> : null}
        <div style={{ marginTop: "0.85rem" }}>
          <PrimaryButton type="button" disabled={!canSubmit} onClick={() => void submit()}>
            {busy ? "처리 중…" : "슬롯 등록"}
          </PrimaryButton>
        </div>
      </Card>

      <CardTitle as="h2" style={{ margin: "0 0 0.6rem" }}>
        등록된 슬롯
      </CardTitle>
      {slots.isLoading && !slots.data ? (
        <Skeleton variant="table" count={4} />
      ) : slots.error && !slots.data ? (
        <ErrorState message={slots.error instanceof Error ? slots.error.message : undefined} onRetry={slots.refresh} />
      ) : (slots.data ?? []).length === 0 ? (
        <EmptyState
          icon="📅"
          title="등록된 교육 슬롯이 없습니다"
          desc="위에서 회관·날짜·시간을 등록하세요."
        />
      ) : (
        <List>
          {(slots.data ?? []).map((s) => (
            <SlotRow key={s.id}>
              <span className="office">{s.officeName ?? `회관#${s.officeId}`}</span>
              <span className="time">
                {Number(s.date.slice(5, 7))}/{Number(s.date.slice(8, 10))}(
                {weekday(s.date)}) {s.startTime}~{s.endTime}
              </span>
              <span className="memo">{s.memo ?? ""}</span>
              <DeleteBtn
                type="button"
                disabled={busy}
                onClick={() => void remove(s.id)}
              >
                삭제
              </DeleteBtn>
            </SlotRow>
          ))}
        </List>
      )}
    </Wrap>
  );
}
