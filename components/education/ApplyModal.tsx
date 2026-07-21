"use client";

// 수강 신청 3단계 모달 (Step 24) — [신청하기] 클릭 시 열림.
// 1단계 입력(ApplyForm) → 2단계 접수확인+입금안내(유료만, 무료는 건너뜀) → 3단계 완료.
// ★ 배경 클릭·ESC로 안 닫힘 — 우측 상단 X로만. 실수로 닫혀 입력 중이던 내용이 날아가는 걸 막기 위함.
// ★ 2·3단계에서 X로 닫아도 신청은 이미 접수된 상태로 유효 — 닫기가 취소를 뜻하지 않는다(문구로 안내).
// API 로직 무접촉 — 신청 자체는 ApplyForm이 기존 그대로 처리, 이 모달은 화면 전환·표시만 담당.

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import styled from "styled-components";
import { useMemberSession } from "@/lib/member-client";
import { eduBadgeTones, eduColors, eduLayout, media } from "./tokens";
import { formatFee, formatSessionRange } from "./types";
import { CopyButton } from "./CopyButton";
import {
  ApplyForm,
  type ApplyFormSession,
  type ApplySubmittedData,
} from "./ApplyForm";

export interface ApplyEventSummary {
  title: string;
  locationName: string | null;
  feeKrw: number;
  depositBankName: string | null;
  depositAccountNo: string | null;
  depositAccountHolder: string | null;
  refundPolicy: string | null;
}

interface ModalSession {
  date: string;
  startTime: string;
  endTime: string;
}

/* ── 모달 뼈대 ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(17, 24, 39, 0.5);
`;

const Panel = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 201;
  width: 100%;
  max-width: 480px;
  max-height: 88vh;
  background: ${eduColors.surface};
  border-radius: ${eduLayout.radius}px;
  box-shadow: 0 20px 50px rgba(17, 24, 39, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  ${media.sm} {
    top: 0;
    left: 0;
    transform: none;
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }
`;

const HeaderBar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid ${eduColors.border};
`;

const HeaderTitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

const StepDots = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const Dot = styled.span<{ $active: boolean; $done: boolean }>`
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: ${(p) =>
    p.$active || p.$done ? eduColors.primary : eduColors.border};
`;

const CloseBtn = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${eduColors.textMuted};
  font-size: 1.1rem;
  cursor: pointer;

  &:hover {
    background: ${eduColors.bg};
    color: ${eduColors.text};
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.1rem;
`;

/* ── 2단계: 접수확인 + 입금안내 ── */

const ReceivedNote = styled.p`
  margin: 0 0 1rem;
  font-size: 0.84rem;
  color: ${eduColors.textMuted};
  line-height: 1.6;
`;

const KeepOpenNote = styled.p`
  margin: -0.5rem 0 1rem;
  font-size: 0.74rem;
  color: ${eduColors.textFaint};
  line-height: 1.5;
`;

const InfoSection = styled.div`
  margin-bottom: 1rem;
`;

const InfoSectionTitle = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${eduColors.textMuted};
`;

const InfoGrid = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 5.2rem 1fr;
  gap: 0.4rem 0.6rem;
  font-size: 0.86rem;

  dt {
    color: ${eduColors.textMuted};
    font-weight: 600;
  }
  dd {
    margin: 0;
    color: ${eduColors.text};
    font-weight: 700;
    word-break: break-word;
  }
`;

/* 입금 미확인 시 수강 불가 — 눈에 확 들어오게 강조(Step 24 핵심 요구) */
const UrgentBox = styled.div`
  display: flex;
  gap: 0.65rem;
  padding: 0.9rem 1rem;
  margin-bottom: 1rem;
  border-radius: 10px;
  background: ${eduColors.warnSoft};
  border: 1.5px solid ${eduBadgeTones.amber.border};
`;

const UrgentIcon = styled.span`
  flex-shrink: 0;
  font-size: 1.3rem;
  line-height: 1;
`;

const UrgentText = styled.div`
  min-width: 0;
  strong {
    display: block;
    margin-bottom: 0.2rem;
    font-size: 0.92rem;
    font-weight: 800;
    color: ${eduColors.warn};
  }
  span {
    font-size: 0.82rem;
    color: ${eduColors.textSub};
    line-height: 1.5;
  }
`;

const DepositCard = styled.div`
  background: ${eduColors.primarySofter};
  border: 1px solid ${eduColors.primaryBorder};
  border-radius: 10px;
  padding: 0.9rem 1rem;
  margin-bottom: 1rem;
`;

const AccountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const DepositNote = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.78rem;
  color: ${eduColors.textMuted};
  line-height: 1.55;
`;

const RefundText = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${eduColors.textMuted};
  line-height: 1.55;
`;

const PrimaryBtn = styled.button`
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 9px;
  background: ${eduColors.primary};
  color: ${eduColors.white};
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${eduColors.primaryHover};
  }
`;

/* ── 3단계: 완료 ── */

const DoneWrap = styled.div`
  text-align: center;
  padding: 1rem 0.5rem;
`;

const CheckCircle = styled.div`
  width: 3.2rem;
  height: 3.2rem;
  margin: 0 auto 0.9rem;
  border-radius: 999px;
  background: ${eduColors.successSoft};
  color: ${eduColors.success};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 800;
`;

const DoneTitle = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

const DoneText = styled.p`
  margin: 0 0 0.4rem;
  font-size: 0.88rem;
  color: ${eduColors.textMuted};
  line-height: 1.6;
`;

const MypageLink = styled(Link)`
  display: inline-block;
  margin-top: 0.6rem;
  font-size: 0.86rem;
  font-weight: 700;
  color: ${eduColors.primary};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const SignupNudge = styled.div`
  margin-top: 1.1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 9px;
  background: ${eduColors.bg};
  border: 1px solid ${eduColors.border};
  font-size: 0.8rem;
  color: ${eduColors.textMuted};
  line-height: 1.55;

  a {
    color: ${eduColors.primary};
    font-weight: 700;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const DoneCloseBtn = styled.button`
  width: 100%;
  margin-top: 1.3rem;
  padding: 0.75rem;
  border: 1px solid ${eduColors.borderInput};
  border-radius: 9px;
  background: ${eduColors.surface};
  color: ${eduColors.textSub};
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: ${eduColors.primary};
    color: ${eduColors.primary};
  }
`;

function DepositStep({
  event,
  session,
  submitted,
  onConfirm,
}: {
  event: ApplyEventSummary;
  session: ModalSession | null;
  submitted: ApplySubmittedData;
  onConfirm: () => void;
}) {
  const hasAccount = Boolean(event.depositBankName || event.depositAccountNo);

  return (
    <>
      <ReceivedNote>
        신청이 접수되었습니다.
        {submitted.email ? " 입력하신 이메일로 안내를 보내드립니다." : ""}
      </ReceivedNote>
      <KeepOpenNote>
        지금 이 창을 닫으셔도 신청 내용은 이미 접수되어 그대로 유지됩니다.
      </KeepOpenNote>

      <UrgentBox>
        <UrgentIcon aria-hidden>⚠️</UrgentIcon>
        <UrgentText>
          <strong>아직 수강 확정 전입니다</strong>
          <span>
            접수만 완료된 상태이며, 아래 계좌로 입금이 확인되어야 수강하실 수
            있습니다.
          </span>
        </UrgentText>
      </UrgentBox>

      <InfoSection>
        <InfoSectionTitle>신청 행사</InfoSectionTitle>
        <InfoGrid>
          <dt>행사명</dt>
          <dd>{event.title}</dd>
          <dt>일시</dt>
          <dd>{session ? formatSessionRange(session) : "미정"}</dd>
          <dt>장소</dt>
          <dd>{event.locationName ?? "미정"}</dd>
        </InfoGrid>
      </InfoSection>

      <InfoSection>
        <InfoSectionTitle>신청 정보</InfoSectionTitle>
        <InfoGrid>
          <dt>이름</dt>
          <dd>{submitted.name}</dd>
          <dt>연락처</dt>
          <dd>{submitted.contact}</dd>
          {submitted.depositorName ? (
            <>
              <dt>입금자명</dt>
              <dd>{submitted.depositorName}</dd>
            </>
          ) : null}
          {submitted.email ? (
            <>
              <dt>이메일</dt>
              <dd>{submitted.email}</dd>
            </>
          ) : null}
        </InfoGrid>
      </InfoSection>

      <InfoSection>
        <InfoSectionTitle>입금 안내</InfoSectionTitle>
        {hasAccount ? (
          <DepositCard>
            <InfoGrid>
              <dt>참가비</dt>
              <dd>{formatFee(event.feeKrw)}</dd>
              {event.depositBankName ? (
                <>
                  <dt>입금 계좌</dt>
                  <dd>
                    <AccountRow>
                      <span>
                        {event.depositBankName} {event.depositAccountNo ?? ""}
                      </span>
                      {event.depositAccountNo ? (
                        <CopyButton text={event.depositAccountNo} />
                      ) : null}
                    </AccountRow>
                  </dd>
                </>
              ) : null}
              {event.depositAccountHolder ? (
                <>
                  <dt>예금주</dt>
                  <dd>{event.depositAccountHolder}</dd>
                </>
              ) : null}
            </InfoGrid>
            <DepositNote>
              입금자명을 위 신청 정보와 동일하게 입금해 주세요. 확인까지 다소
              시간이 걸릴 수 있습니다.
            </DepositNote>
          </DepositCard>
        ) : (
          <DepositCard>
            <InfoGrid>
              <dt>참가비</dt>
              <dd>{formatFee(event.feeKrw)}</dd>
            </InfoGrid>
            <DepositNote>입금 계좌는 별도로 안내됩니다.</DepositNote>
          </DepositCard>
        )}
      </InfoSection>

      {event.refundPolicy ? (
        <InfoSection>
          <InfoSectionTitle>환불·노쇼 규정</InfoSectionTitle>
          <RefundText>{event.refundPolicy}</RefundText>
        </InfoSection>
      ) : null}

      <PrimaryBtn type="button" onClick={onConfirm}>
        입금 완료했습니다
      </PrimaryBtn>
    </>
  );
}

function DoneStep({
  submitted,
  isMember,
  onClose,
}: {
  submitted: ApplySubmittedData;
  isMember: boolean;
  onClose: () => void;
}) {
  return (
    <DoneWrap>
      <CheckCircle aria-hidden>✓</CheckCircle>
      <DoneTitle>접수되었습니다</DoneTitle>
      {isMember ? (
        <>
          <DoneText>마이페이지에서 내 수강 현황을 확인하실 수 있습니다.</DoneText>
          <MypageLink href="/mypage">마이페이지로 이동 →</MypageLink>
        </>
      ) : (
        <>
          {submitted.email ? (
            <DoneText>입력하신 이메일로 안내가 발송됩니다.</DoneText>
          ) : null}
          <SignupNudge>
            회원가입하시면 신청 내역을 언제든 확인하실 수 있습니다.{" "}
            <Link href="/signup">회원가입 →</Link>
          </SignupNudge>
        </>
      )}
      <DoneCloseBtn type="button" onClick={onClose}>
        닫기
      </DoneCloseBtn>
    </DoneWrap>
  );
}

export function ApplyModal({
  open,
  step,
  onStepChange,
  onClose,
  eventId,
  requiresDeposit,
  sessions,
  submitted,
  onSubmitted,
  eventSummary,
}: {
  open: boolean;
  /** 1=입력, 2=접수확인+입금안내(유료만), 3=완료 */
  step: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
  onClose: () => void;
  eventId: number;
  requiresDeposit: boolean;
  sessions: ApplyFormSession[];
  submitted: ApplySubmittedData | null;
  onSubmitted: (data: ApplySubmittedData) => void;
  eventSummary: ApplyEventSummary;
}) {
  const { member } = useMemberSession();

  // 열려 있는 동안 배경 스크롤 잠금(ESC/배경 클릭 닫기는 의도적으로 없음 — X만 닫기 수단)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const selectedSession =
    submitted != null
      ? sessions.find((s) => s.id === submitted.sessionId) ?? sessions[0] ?? null
      : null;

  const totalSteps = requiresDeposit ? 3 : 2;
  const dotStep = requiresDeposit ? step : step === 3 ? 2 : 1;

  return createPortal(
    <>
      <Overlay role="presentation" aria-hidden />
      <Panel role="dialog" aria-modal="true" aria-label="수강 신청">
        <HeaderBar>
          <HeaderTitleWrap>
            <HeaderTitle>수강 신청</HeaderTitle>
            <StepDots aria-hidden>
              {Array.from({ length: totalSteps }, (_, i) => (
                <Dot
                  key={i}
                  $active={i + 1 === dotStep}
                  $done={i + 1 < dotStep}
                />
              ))}
            </StepDots>
          </HeaderTitleWrap>
          <CloseBtn type="button" onClick={onClose} aria-label="닫기">
            ✕
          </CloseBtn>
        </HeaderBar>
        <Body>
          {step === 1 ? (
            <ApplyForm
              eventId={eventId}
              requiresDeposit={requiresDeposit}
              sessions={sessions}
              onSubmitted={(data) => {
                onSubmitted(data);
                onStepChange(requiresDeposit ? 2 : 3);
              }}
            />
          ) : null}
          {step === 2 && submitted ? (
            <DepositStep
              event={eventSummary}
              session={selectedSession}
              submitted={submitted}
              onConfirm={() => onStepChange(3)}
            />
          ) : null}
          {step === 3 && submitted ? (
            <DoneStep
              submitted={submitted}
              isMember={Boolean(member)}
              onClose={onClose}
            />
          ) : null}
        </Body>
      </Panel>
    </>,
    document.body,
  );
}
