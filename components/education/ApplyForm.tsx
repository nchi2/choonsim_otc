"use client";

// 수강 신청 1단계(입력) — ApplyModal(Step 24)의 1단계 콘텐츠로 쓰이는 필드+제출 컴포넌트.
// POST /api/education/apply 로 제출(정원·중복은 서버 트랜잭션이 원자 처리) — API 로직 무접촉.
// 마감/정원초과 등은 모달을 여는 버튼 쪽에서 이미 막으므로 여기서는 서버 거절만 에러로 표시.
// 로그인 시 이름·연락처·입금자명 자동입력(수정 가능). 비로그인도 그대로 신청 가능.
// 전화 자동 포맷(formatPhone). 개인정보 동의는 제출 시 강조 안내.
// 제출 성공 시 onSubmitted로 입력값을 부모(ApplyModal)에 넘기고, 이후 화면(2·3단계)은
// 모달이 담당한다 — 이 컴포넌트는 접수 이후 상태를 갖지 않는다.

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { formatPhone } from "@/lib/format-phone";
import { useMemberSession } from "@/lib/member-client";
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

const FieldHint = styled.span`
  display: block;
  font-size: 0.72rem;
  color: ${eduColors.textFaint};
  margin-top: 0.25rem;
  line-height: 1.45;
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

/* 개인정보 동의 — 눈에 띄게 박스로, 미동의 강조 시 빨강 테두리 */
const AgreeBox = styled.label<{ $highlight?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.7rem 0.8rem;
  border-radius: 9px;
  border: 1.5px solid
    ${(p) => (p.$highlight ? eduColors.danger : eduColors.primaryBorder)};
  background: ${(p) => (p.$highlight ? eduColors.dangerSoft : eduColors.primarySofter)};
  font-size: 0.82rem;
  color: ${eduColors.textSub};
  line-height: 1.5;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  input {
    margin-top: 0.1rem;
    width: 1.25rem;
    height: 1.25rem;
    accent-color: ${eduColors.primary};
    flex-shrink: 0;
    cursor: pointer;
  }

  strong {
    color: ${eduColors.text};
    font-weight: 700;
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

const ErrorNote = styled.div`
  padding: 0.7rem 0.85rem;
  border-radius: 9px;
  background: ${eduColors.dangerSoft};
  border: 1px solid ${eduColors.danger}33;
  color: ${eduColors.danger};
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

/** 제출 성공 시 부모(ApplyModal)에 넘기는 입력값 — 2·3단계 표시에 그대로 재사용. */
export interface ApplySubmittedData {
  name: string;
  contact: string;
  email: string | null;
  depositorName: string | null;
  sessionId: number | null;
}

export function ApplyForm({
  eventId,
  requiresDeposit,
  sessions,
  onSubmitted,
}: {
  eventId: number;
  requiresDeposit: boolean;
  sessions: ApplyFormSession[];
  /** 신청 API 성공 시 호출 — 모달이 2/3단계로 전환한다 */
  onSubmitted: (data: ApplySubmittedData) => void;
}) {
  const { member } = useMemberSession();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState(""); // 선택 — 이메일 안내 수신용
  const [depositorName, setDepositorName] = useState("");
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<number | "">(
    sessions.length === 1 ? sessions[0].id : "",
  );
  const [agree, setAgree] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const agreeRef = useRef<HTMLLabelElement>(null);
  const prefilled = useRef(false);

  // 로그인 회원 정보로 이름·연락처·입금자명 1회 자동입력(이후 사용자가 자유 수정)
  useEffect(() => {
    if (member && !prefilled.current) {
      prefilled.current = true;
      setName((prev) => prev || member.name);
      if (member.phone) setContact((prev) => prev || formatPhone(member.phone!));
      setDepositorName((prev) => prev || member.name);
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // 개인정보 동의 — 미동의 시 제출 막고 체크박스로 시선 유도(비활성 대신 안내)
    if (!agree) {
      setAgreeError(true);
      setError("개인정보 수집·이용에 동의해 주세요.");
      agreeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (
      name.trim() === "" ||
      contact.trim() === "" ||
      (requiresDeposit && depositorName.trim() === "") ||
      (sessions.length > 1 && sessionId === "")
    ) {
      setError("필수 항목을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/education/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          sessionId: sessionId === "" ? null : sessionId,
          name: name.trim(),
          contact: contact.trim(),
          email: email.trim() || null,
          depositorName: requiresDeposit ? depositorName.trim() : null,
          question: question.trim() || null,
          agreePrivacy: agree,
          // [TURNSTILE 위젯 자리] NEXT_PUBLIC_TURNSTILE_SITE_KEY 장착 시
          // 위젯 token을 여기(turnstileToken)에 실어 보내면 서버 검증이 켜진다.
          turnstileToken: null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "신청 접수에 실패했습니다.");
      }
      onSubmitted({
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim() || null,
        depositorName: requiresDeposit ? depositorName.trim() : null,
        sessionId: sessionId === "" ? null : sessionId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "신청 접수에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
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
        />
      </Field>

      <Field>
        <FieldLabel>
          전화번호 <em>*</em>
        </FieldLabel>
        <Input
          value={contact}
          onChange={(e) => setContact(formatPhone(e.target.value))}
          inputMode="tel"
          placeholder="010-0000-0000"
        />
      </Field>

      <Field>
        <FieldLabel>이메일 (선택)</FieldLabel>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <FieldHint>안내를 이메일로 받으시려면 입력해 주세요.</FieldHint>
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

      <AgreeBox ref={agreeRef} $highlight={agreeError && !agree}>
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => {
            setAgree(e.target.checked);
            if (e.target.checked) setAgreeError(false);
          }}
        />
        <span>
          <strong>개인정보 수집·이용에 동의합니다. (필수)</strong>
          <br />
          신청 정보(이름·전화·입금자명, 선택 입력한 이메일)는 행사 운영·안내
          목적으로만 사용되며, 행사 종료 후 30일 이내 파기됩니다.
        </span>
      </AgreeBox>

      {error ? <ErrorNote role="alert">{error}</ErrorNote> : null}

      <SubmitBtn type="submit" disabled={submitting}>
        {submitting ? "접수 중…" : "신청하기"}
      </SubmitBtn>
    </Form>
  );
}
