"use client";

// 행사 개설 신청 폼 — 표시·입력 UI 중심. 제출은 placeholder(콘솔 + 완료 메시지).
// 실제 POST(status=PENDING 생성)·검증·Turnstile·알림은 Step 3~5(Fable).
// 장소: 회관 선택 or 직접 입력. 회차: 다중 세션 추가. 유료 시 입금계좌 안내.

import { useState } from "react";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import { CATEGORY_LABEL, MODE_LABEL, eduColors, eduLayout, media } from "@/components/education/tokens";

const PageTitle = styled.h1`
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: ${eduColors.text};
`;
const PageSub = styled.p`
  margin: 0 0 1.5rem;
  font-size: 0.85rem;
  color: ${eduColors.textMuted};
  line-height: 1.6;
`;

const Form = styled.form`
  max-width: 720px;
`;

const Fieldset = styled.fieldset`
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  padding: 1.1rem 1.25rem 1.3rem;
  margin: 0 0 1.25rem;

  legend {
    padding: 0 0.5rem;
    font-size: 0.9rem;
    font-weight: 800;
    color: ${eduColors.primary};
  }
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  ${media.sm} {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: block;
  margin-bottom: 0.85rem;

  &:last-child {
    margin-bottom: 0;
  }
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

const baseInput = `
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${eduColors.borderInput};
  border-radius: 8px;
  font-size: 0.88rem;
  background: ${eduColors.surface};
  color: ${eduColors.text};
  &:focus { outline: none; border-color: ${eduColors.primary}; }
`;
const Input = styled.input`
  ${baseInput}
`;
const Textarea = styled.textarea`
  ${baseInput}
  min-height: 84px;
  resize: vertical;
`;
const Select = styled.select`
  ${baseInput}
`;

const SessionRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr auto;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;

  ${media.sm} {
    grid-template-columns: 1fr 1fr;
  }
`;

const SmallBtn = styled.button`
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  border: 1px solid ${eduColors.borderInput};
  background: ${eduColors.surface};
  color: ${eduColors.textSub};
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    border-color: ${eduColors.primary};
    color: ${eduColors.primary};
  }
`;

const AddBtn = styled(SmallBtn)`
  margin-top: 0.25rem;
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 10px;
  background: ${eduColors.primary};
  color: ${eduColors.white};
  font-size: 1rem;
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

const AgreeRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: ${eduColors.textMuted};
  line-height: 1.5;
  margin: 0.5rem 0 1rem;
  cursor: pointer;
  input {
    margin-top: 0.15rem;
    accent-color: ${eduColors.primary};
  }
`;

const DoneCard = styled.div`
  max-width: 720px;
  padding: 2rem 1.5rem;
  text-align: center;
  border: 1px solid ${eduColors.primaryBorder};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.primarySofter};

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.15rem;
    color: ${eduColors.text};
  }
  p {
    margin: 0;
    font-size: 0.88rem;
    color: ${eduColors.textMuted};
    line-height: 1.6;
  }
`;

interface SessionInput {
  date: string;
  startTime: string;
  endTime: string;
}

export function HostFormClient({
  offices,
}: {
  offices: { id: number; name: string }[];
}) {
  const [done, setDone] = useState(false);

  // 기본 정보
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("LECTURE");
  const [descriptionMd, setDescriptionMd] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [instructorBio, setInstructorBio] = useState("");

  // 일시·장소·방식
  const [sessions, setSessions] = useState<SessionInput[]>([
    { date: "", startTime: "", endTime: "" },
  ]);
  const [officeId, setOfficeId] = useState<string>(""); // "" = 직접 입력
  const [customLocation, setCustomLocation] = useState("");
  const [mode, setMode] = useState("OFFLINE");
  const [capacity, setCapacity] = useState("");
  const [feeKrw, setFeeKrw] = useState("");

  // 입금·안내
  const [depositBankName, setDepositBankName] = useState("");
  const [depositAccountNo, setDepositAccountNo] = useState("");
  const [depositAccountHolder, setDepositAccountHolder] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [preparation, setPreparation] = useState("");
  const [reward, setReward] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");
  const [notice, setNotice] = useState("");
  const [applyDeadline, setApplyDeadline] = useState("");

  // 신청자(무계정)
  const [hostName, setHostName] = useState("");
  const [hostContact, setHostContact] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [agree, setAgree] = useState(false);

  const paid = Number(feeKrw) > 0;

  const updateSession = (i: number, patch: Partial<SessionInput>) =>
    setSessions((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addSession = () =>
    setSessions((prev) => [...prev, { date: "", startTime: "", endTime: "" }]);
  const removeSession = (i: number) =>
    setSessions((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const canSubmit =
    title.trim() !== "" &&
    (officeId !== "" || customLocation.trim() !== "") &&
    sessions.some((s) => s.date && s.startTime) &&
    hostName.trim() !== "" &&
    hostContact.trim() !== "" &&
    agree;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Step 3에서 POST /api/host/apply (status=PENDING 생성)로 교체 예정.
    // eslint-disable-next-line no-console
    console.log("[host-apply:placeholder]", {
      title: title.trim(),
      category,
      descriptionMd: descriptionMd.trim() || null,
      instructorName: instructorName.trim() || null,
      instructorBio: instructorBio.trim() || null,
      sessions: sessions.filter((s) => s.date && s.startTime),
      officeId: officeId ? Number(officeId) : null,
      customLocation: officeId ? null : customLocation.trim() || null,
      mode,
      capacity: capacity ? Number(capacity) : null,
      feeKrw: Number(feeKrw) || 0,
      depositBankName: depositBankName.trim() || null,
      depositAccountNo: depositAccountNo.trim() || null,
      depositAccountHolder: depositAccountHolder.trim() || null,
      eligibility: eligibility.trim() || null,
      preparation: preparation.trim() || null,
      reward: reward.trim() || null,
      refundPolicy: refundPolicy.trim() || null,
      notice: notice.trim() || null,
      applyDeadline: applyDeadline || null,
      hostName: hostName.trim(),
      hostContact: hostContact.trim(),
      hostEmail: hostEmail.trim() || null,
    });
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <PublicShell>
        <DoneCard>
          <h2>개설 신청이 접수되었습니다 (데모)</h2>
          <p>
            실제 제출·검토 연동은 준비 중입니다(Step 3). 검토 후 승인되면 행사가
            공개됩니다.
          </p>
        </DoneCard>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <PageTitle>행사 개설 신청</PageTitle>
      <PageSub>
        모빅회관에서 강의·워크숍·이벤트를 열고 싶으신가요? 아래 내용을 작성해
        신청하시면 운영팀 검토 후 공개됩니다. (계정 없이 신청 가능)
      </PageSub>

      <Form onSubmit={handleSubmit}>
        <Fieldset>
          <legend>기본 정보</legend>
          <Field>
            <FieldLabel>
              행사 제목 <em>*</em>
            </FieldLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Grid2>
            <Field>
              <FieldLabel>분류</FieldLabel>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <FieldLabel>진행 방식</FieldLabel>
              <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                {Object.entries(MODE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          </Grid2>
          <Field>
            <FieldLabel>행사 소개 (마크다운 지원)</FieldLabel>
            <Textarea
              value={descriptionMd}
              onChange={(e) => setDescriptionMd(e.target.value)}
              placeholder="## 강연 내용&#10;- 다룰 주제…"
            />
          </Field>
          <Grid2>
            <Field>
              <FieldLabel>강사명</FieldLabel>
              <Input
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>강사 소개</FieldLabel>
              <Input
                value={instructorBio}
                onChange={(e) => setInstructorBio(e.target.value)}
              />
            </Field>
          </Grid2>
        </Fieldset>

        <Fieldset>
          <legend>일시 · 장소</legend>
          <FieldLabel>
            회차 <em>*</em>
          </FieldLabel>
          {sessions.map((s, i) => (
            <SessionRow key={i}>
              <Input
                type="date"
                value={s.date}
                onChange={(e) => updateSession(i, { date: e.target.value })}
                aria-label={`${i + 1}회차 날짜`}
              />
              <Input
                type="time"
                value={s.startTime}
                onChange={(e) => updateSession(i, { startTime: e.target.value })}
                aria-label={`${i + 1}회차 시작`}
              />
              <Input
                type="time"
                value={s.endTime}
                onChange={(e) => updateSession(i, { endTime: e.target.value })}
                aria-label={`${i + 1}회차 종료`}
              />
              {sessions.length > 1 ? (
                <SmallBtn type="button" onClick={() => removeSession(i)}>
                  삭제
                </SmallBtn>
              ) : (
                <span />
              )}
            </SessionRow>
          ))}
          <AddBtn type="button" onClick={addSession}>
            + 회차 추가
          </AddBtn>

          <Grid2 style={{ marginTop: "1rem" }}>
            <Field>
              <FieldLabel>
                회관 선택 <em>*</em>
              </FieldLabel>
              <Select value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
                <option value="">직접 입력</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <FieldLabel>직접 입력 장소</FieldLabel>
              <Input
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="회관 미선택 시"
                disabled={officeId !== ""}
              />
            </Field>
          </Grid2>
        </Fieldset>

        <Fieldset>
          <legend>정원 · 비용</legend>
          <Grid2>
            <Field>
              <FieldLabel>정원 (비우면 무제한)</FieldLabel>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="예: 40"
              />
            </Field>
            <Field>
              <FieldLabel>참가비 (원, 0=무료)</FieldLabel>
              <Input
                type="number"
                min="0"
                value={feeKrw}
                onChange={(e) => setFeeKrw(e.target.value)}
                placeholder="예: 10000"
              />
            </Field>
          </Grid2>
          {paid ? (
            <Grid2>
              <Field>
                <FieldLabel>입금 은행</FieldLabel>
                <Input
                  value={depositBankName}
                  onChange={(e) => setDepositBankName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>계좌번호</FieldLabel>
                <Input
                  value={depositAccountNo}
                  onChange={(e) => setDepositAccountNo(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>예금주</FieldLabel>
                <Input
                  value={depositAccountHolder}
                  onChange={(e) => setDepositAccountHolder(e.target.value)}
                />
              </Field>
            </Grid2>
          ) : null}
        </Fieldset>

        <Fieldset>
          <legend>안내 (선택)</legend>
          <Field>
            <FieldLabel>참여 조건</FieldLabel>
            <Input value={eligibility} onChange={(e) => setEligibility(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>준비물</FieldLabel>
            <Input value={preparation} onChange={(e) => setPreparation(e.target.value)} />
          </Field>
          <Grid2>
            <Field>
              <FieldLabel>리워드</FieldLabel>
              <Input value={reward} onChange={(e) => setReward(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>신청 마감일</FieldLabel>
              <Input
                type="date"
                value={applyDeadline}
                onChange={(e) => setApplyDeadline(e.target.value)}
              />
            </Field>
          </Grid2>
          <Field>
            <FieldLabel>환불 규정</FieldLabel>
            <Input value={refundPolicy} onChange={(e) => setRefundPolicy(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>유의사항</FieldLabel>
            <Textarea value={notice} onChange={(e) => setNotice(e.target.value)} />
          </Field>
        </Fieldset>

        <Fieldset>
          <legend>신청자 정보</legend>
          <Grid2>
            <Field>
              <FieldLabel>
                이름 <em>*</em>
              </FieldLabel>
              <Input value={hostName} onChange={(e) => setHostName(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel>
                연락처 <em>*</em>
              </FieldLabel>
              <Input
                value={hostContact}
                onChange={(e) => setHostContact(e.target.value)}
                inputMode="tel"
                placeholder="010-0000-0000"
                required
              />
            </Field>
          </Grid2>
          <Field>
            <FieldLabel>이메일 (선택)</FieldLabel>
            <Input
              type="email"
              value={hostEmail}
              onChange={(e) => setHostEmail(e.target.value)}
            />
          </Field>
        </Fieldset>

        <AgreeRow>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            입력한 정보로 운영팀이 검토·연락하는 데 동의합니다. 신청 정보는 검토
            목적으로만 사용됩니다.
          </span>
        </AgreeRow>

        <SubmitBtn type="submit" disabled={!canSubmit}>
          개설 신청하기
        </SubmitBtn>
      </Form>
    </PublicShell>
  );
}
