"use client";

// 수강 신청 완료 확인 화면 (Step 21) — 행사명·일시·장소 + 신청자가 입력한 정보 요약 +
// 유료 행사면 입금 안내(계좌 복사 버튼 포함) + 환불·노쇼 규정. API 무접촉(이미 로드된
// event 정보 + 폼 제출값만으로 구성). 로그인 회원은 마이페이지에서도 동일 정보 재확인 가능.

import styled from "styled-components";
import { eduColors, eduLayout } from "./tokens";
import { formatFee, formatSessionRange } from "./types";
import { CopyButton } from "./CopyButton";

export interface ApplyEventSummary {
  title: string;
  locationName: string | null;
  feeKrw: number;
  depositBankName: string | null;
  depositAccountNo: string | null;
  depositAccountHolder: string | null;
  refundPolicy: string | null;
}

interface DoneSession {
  date: string;
  startTime: string;
  endTime: string;
}

const Card = styled.div`
  border: 1px solid ${eduColors.primaryBorder};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.primarySofter};
  padding: 1.25rem 1.3rem;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.9rem;
`;

const CheckIcon = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 999px;
  background: ${eduColors.success};
  color: ${eduColors.white};
  font-size: 0.9rem;
  font-weight: 800;
`;

const HeadText = styled.div`
  h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    color: ${eduColors.text};
  }
  p {
    margin: 0.15rem 0 0;
    font-size: 0.78rem;
    color: ${eduColors.textMuted};
  }
`;

const Section = styled.div`
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid ${eduColors.primaryBorder};

  &:first-of-type {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
`;

const SectionTitle = styled.h4`
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

const NoAccountNote = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${eduColors.textMuted};
  line-height: 1.55;
`;

export function ApplyDoneCard({
  event,
  session,
  name,
  contact,
  depositorName,
}: {
  event: ApplyEventSummary;
  session: DoneSession | null;
  name: string;
  contact: string;
  depositorName: string | null;
}) {
  const requiresDeposit = event.feeKrw > 0;
  const hasAccount = Boolean(event.depositBankName || event.depositAccountNo);

  return (
    <Card>
      <Head>
        <CheckIcon aria-hidden>✓</CheckIcon>
        <HeadText>
          <h3>신청이 접수되었습니다</h3>
          <p>안내된 연락처로 확인 연락을 드립니다.</p>
        </HeadText>
      </Head>

      <Section>
        <SectionTitle>신청 행사</SectionTitle>
        <InfoGrid>
          <dt>행사명</dt>
          <dd>{event.title}</dd>
          <dt>일시</dt>
          <dd>{session ? formatSessionRange(session) : "미정"}</dd>
          <dt>장소</dt>
          <dd>{event.locationName ?? "미정"}</dd>
        </InfoGrid>
      </Section>

      <Section>
        <SectionTitle>신청 정보</SectionTitle>
        <InfoGrid>
          <dt>이름</dt>
          <dd>{name}</dd>
          <dt>연락처</dt>
          <dd>{contact}</dd>
          {requiresDeposit && depositorName ? (
            <>
              <dt>입금자명</dt>
              <dd>{depositorName}</dd>
            </>
          ) : null}
        </InfoGrid>
      </Section>

      {requiresDeposit ? (
        <Section>
          <SectionTitle>입금 안내</SectionTitle>
          {hasAccount ? (
            <>
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
            </>
          ) : (
            <NoAccountNote>
              참가비 {formatFee(event.feeKrw)} — 입금 계좌는 별도로 안내됩니다.
            </NoAccountNote>
          )}
        </Section>
      ) : null}

      {event.refundPolicy ? (
        <Section>
          <SectionTitle>환불·노쇼 규정</SectionTitle>
          <NoAccountNote>{event.refundPolicy}</NoAccountNote>
        </Section>
      ) : null}
    </Card>
  );
}
