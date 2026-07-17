"use client";

// 수강 신청 폼 — 표시·입력 UI만. 실제 제출(POST·정원 트랜잭션·검증)은 Step 3(Fable).
// 지금은 제출 시 placeholder(콘솔 + 완료 메시지). 마감/정원초과면 비활성 + 사유.
// 필드: 세션(다회차 시)·이름·전화·입금자명(유료)·사전질문(선택)·개인정보 동의(30일 파기).

import { useState } from "react";
import styled from "styled-components";
import { eduColors } from "./tokens";
import { formatSessionRange } from "./types";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const Field = styled.label`
  display: block;
`;

const FieldLabel = styled.span`
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${eduColors.textSub};
  margin-bottom: 0.3rem;

  em {
    color: ${eduColors.danger};
    font-style: normal;
  }
`;

const inputCss = `
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid ${eduColors.borderInput};
  border-radius: 8px;
  font-size: 0.9rem;
  background: ${eduColors.surface};
  color: ${eduColors.text};
  &:focus {
    outline: none;
    border-color: ${eduColors.primary};
  }
`;

const Input = styled.input`
  ${inputCss}
`;
const Textarea = styled.textarea`
  ${inputCss}
  min-height: 72px;
  resize: vertical;
`;
const Select = styled.select`
  ${inputCss}
`;

const AgreeRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${eduColors.textMuted};
  line-height: 1.5;
  cursor: pointer;

  input {
    margin-top: 0.15rem;
    width: 1rem;
    height: 1rem;
    accent-color: ${eduColors.primary};
    flex-shrink: 0;
  }
`;

const SubmitBtn = styled.button`
  padding: 0.75rem;
  border: none;
  border-radius: 9px;
  background: ${eduColors.primary};
  color: ${eduColors.white};
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${eduColors.primaryHover};
  }
  &:disabled {
    background: ${eduColors.textFaint};
    cursor: not-allowed;
  }
`;

const ClosedNote = styled.div`
  padding: 0.7rem 0.85rem;
  border-radius: 9px;
  background: ${eduColors.dangerSoft};
  border: 1px solid ${eduColors.danger}33;
  color: ${eduColors.danger};
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
`;

const DoneNote = styled.div`
  padding: 0.7rem 0.85rem;
  border-radius: 9px;
  background: ${eduColors.successSoft};
  border: 1px solid ${eduColors.success}33;
  color: ${eduColors.success};
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
`;

export interface ApplyFormSession {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
}

export function ApplyForm({
  eventSlug,
  requiresDeposit,
  sessions,
  closedReason,
}: {
  eventSlug: string;
  requiresDeposit: boolean;
  sessions: ApplyFormSession[];
  /** 마감/정원초과/종료 사유 — 있으면 폼 비활성 */
  closedReason?: string | null;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<number | "">(
    sessions.length === 1 ? sessions[0].id : "",
  );
  const [agree, setAgree] = useState(false);
  const [done, setDone] = useState(false);

  if (closedReason) {
    return <ClosedNote>{closedReason}</ClosedNote>;
  }
  if (done) {
    return (
      <DoneNote>
        신청 정보가 확인되었습니다. (제출 연동은 준비 중 — Step 3)
      </DoneNote>
    );
  }

  const canSubmit =
    name.trim() !== "" &&
    contact.trim() !== "" &&
    agree &&
    (!requiresDeposit || depositorName.trim() !== "") &&
    (sessions.length <= 1 || sessionId !== "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Step 3에서 POST /api/events/[slug]/apply 로 교체 예정. 지금은 placeholder.
    // eslint-disable-next-line no-console
    console.log("[apply:placeholder]", {
      eventSlug,
      sessionId: sessionId || null,
      name: name.trim(),
      contact: contact.trim(),
      depositorName: requiresDeposit ? depositorName.trim() : null,
      question: question.trim() || null,
      agreePrivacy: agree,
    });
    setDone(true);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {sessions.length > 1 ? (
        <Field>
          <FieldLabel>
            참여 회차 <em>*</em>
          </FieldLabel>
          <Select
            value={sessionId}
            onChange={(e) =>
              setSessionId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">회차 선택</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {formatSessionRange(s)}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field>
        <FieldLabel>
          이름 <em>*</em>
        </FieldLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="실명"
          required
        />
      </Field>

      <Field>
        <FieldLabel>
          전화번호 <em>*</em>
        </FieldLabel>
        <Input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          inputMode="tel"
          placeholder="010-0000-0000"
          required
        />
      </Field>

      {requiresDeposit ? (
        <Field>
          <FieldLabel>
            입금자명 <em>*</em>
          </FieldLabel>
          <Input
            value={depositorName}
            onChange={(e) => setDepositorName(e.target.value)}
            placeholder="입금하실 분 성함"
            required
          />
        </Field>
      ) : null}

      <Field>
        <FieldLabel>사전 질문 (선택)</FieldLabel>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="강사에게 미리 묻고 싶은 내용이 있다면 적어주세요."
        />
      </Field>

      <AgreeRow>
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <span>
          개인정보 수집·이용에 동의합니다. 신청 정보(이름·전화·입금자명)는 행사
          운영 목적으로만 사용되며, 행사 종료 후 30일 이내 파기됩니다.
        </span>
      </AgreeRow>

      <SubmitBtn type="submit" disabled={!canSubmit}>
        신청하기
      </SubmitBtn>
    </Form>
  );
}
