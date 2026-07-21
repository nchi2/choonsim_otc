"use client";

// /events/[slug] 상세 — 이벤터스 상세 구조 참조. 표시 + 신청 폼 UI(제출은 placeholder).
// 좌: 본문(소개·안내 아코디언·참여정보·입금안내·신청 폼). 우: sticky 요약+신청 버튼(데스크톱).
// 모바일: 요약 인라인 + 하단 고정 신청 바.

import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { todayKst } from "@/lib/kst";
import { PublicShell } from "@/components/education/PublicShell";
import { Markdown } from "@/components/education/Markdown";
import { ApplyForm } from "@/components/education/ApplyForm";
import {
  EventCard,
  EventCardGrid,
} from "@/components/education/EventCard";
import { OfficeOtcCard } from "@/components/education/OfficeOtcCard";
import {
  CapacityBadge,
  CategoryBadge,
  DDayBadge,
  FeeBadge,
  ModeBadge,
} from "@/components/education/Badge";
import { eduColors, eduLayout, media } from "@/components/education/tokens";
import { PosterCard } from "@/components/education/PosterCard";
import {
  dDayFromKstYmd,
  formatFee,
  formatSessionRange,
  type EventCardData,
} from "@/components/education/types";
import type { EventDetailData } from "@/lib/education-public";

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${eduColors.textMuted};
  text-decoration: none;
  margin-bottom: 1rem;
  &:hover {
    color: ${eduColors.primary};
  }
`;

/* Hero */
const Hero = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  align-items: start;

  ${media.md} {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

/* 히어로 포스터 래퍼 — 실제 렌더는 PosterCard(이미지 or 디자인 폴백) */
const Poster = styled.div`
  border-radius: ${eduLayout.radius}px;
  overflow: hidden;
`;

const HeroInfo = styled.div``;

const BadgeRow = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
`;

const Title = styled.h1`
  margin: 0 0 0.9rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: ${eduColors.text};
  line-height: 1.35;

  ${media.sm} {
    font-size: 1.25rem;
  }
`;

const MetaList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 0.5rem 0.75rem;
  font-size: 0.88rem;

  dt {
    color: ${eduColors.textFaint};
    font-weight: 600;
  }
  dd {
    margin: 0;
    color: ${eduColors.textSub};
    font-weight: 600;
  }
`;

const StreamLink = styled.a`
  color: ${eduColors.primary};
  font-weight: 700;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

/* Body 2-column */
const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.75rem;
  margin-top: 2rem;
  align-items: start;

  ${media.md} {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`;

const Main = styled.div`
  min-width: 0;
`;

const Section = styled.section`
  padding: 1.25rem 0;
  border-top: 1px solid ${eduColors.border};

  &:first-child {
    border-top: none;
    padding-top: 0;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 0.7rem;
  font-size: 1.05rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

const InfoText = styled.p`
  margin: 0.4rem 0;
  font-size: 0.9rem;
  line-height: 1.65;
  color: ${eduColors.textSub};
  white-space: pre-wrap;
`;

const InfoGrid = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 0.55rem 0.75rem;
  font-size: 0.88rem;

  dt {
    color: ${eduColors.textFaint};
    font-weight: 700;
  }
  dd {
    margin: 0;
    color: ${eduColors.textSub};
    line-height: 1.6;
    white-space: pre-wrap;
  }
`;

const DepositCard = styled.div`
  background: ${eduColors.primarySofter};
  border: 1px solid ${eduColors.primaryBorder};
  border-radius: 10px;
  padding: 0.9rem 1rem;
`;

/* Accordion */
const AccItem = styled.div`
  border: 1px solid ${eduColors.border};
  border-radius: 10px;
  margin-bottom: 0.6rem;
  overflow: hidden;
`;
const AccHead = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.9rem;
  background: ${eduColors.surface};
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${eduColors.textSub};
  cursor: pointer;
  text-align: left;
`;
const AccBody = styled.div`
  padding: 0 0.9rem 0.85rem;
  font-size: 0.88rem;
  line-height: 1.65;
  color: ${eduColors.textMuted};
  white-space: pre-wrap;
`;

/* Aside */
const Aside = styled.aside`
  position: sticky;
  top: calc(${eduLayout.headerHeight}px + 1rem);
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  padding: 1.1rem;
  background: ${eduColors.surface};
  box-shadow: 0 2px 14px rgba(17, 24, 39, 0.05);

  ${media.md} {
    display: none; /* 모바일은 하단 고정 바 */
  }
`;

const AsideFee = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${eduColors.text};
  margin-bottom: 0.7rem;
`;

const AsideRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.82rem;
  padding: 0.3rem 0;
  color: ${eduColors.textMuted};

  strong {
    color: ${eduColors.textSub};
    font-weight: 600;
    text-align: right;
  }
`;

const ApplyBtn = styled.a<{ $disabled?: boolean }>`
  display: block;
  margin-top: 0.9rem;
  padding: 0.7rem;
  border-radius: 9px;
  text-align: center;
  font-size: 0.92rem;
  font-weight: 800;
  text-decoration: none;
  ${(p) =>
    p.$disabled
      ? `background:${eduColors.bg};color:${eduColors.textFaint};cursor:not-allowed;border:1px solid ${eduColors.border};`
      : `background:${eduColors.primary};color:${eduColors.white};`}
  &:hover {
    ${(p) => (p.$disabled ? "" : `background:${eduColors.primaryHover};`)}
  }
`;

/* Mobile sticky apply bar */
const MobileBar = styled.div`
  display: none;
  ${media.md} {
    display: flex;
  }
  position: fixed;
  left: 0;
  right: 0;
  bottom: ${eduLayout.bottomTabHeight}px;
  z-index: 45;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem calc(0.6rem + env(safe-area-inset-bottom));
  background: ${eduColors.surface};
  border-top: 1px solid ${eduColors.border};
`;
const MobileBarFee = styled.div`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${eduColors.text};
  flex-shrink: 0;
`;
const MobileBarBtn = styled.a<{ $disabled?: boolean }>`
  flex: 1;
  padding: 0.65rem;
  border-radius: 9px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
  ${(p) =>
    p.$disabled
      ? `background:${eduColors.bg};color:${eduColors.textFaint};border:1px solid ${eduColors.border};`
      : `background:${eduColors.primary};color:${eduColors.white};`}
`;

function Accordion({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <AccItem>
      <AccHead type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {title}
        <span>{open ? "▲" : "▼"}</span>
      </AccHead>
      {open ? <AccBody>{body}</AccBody> : null}
    </AccItem>
  );
}

export function EventDetailClient({
  event,
  sameOffice,
}: {
  event: EventDetailData;
  sameOffice: EventCardData[];
}) {
  const today = todayKst();
  const primarySession =
    event.sessions.find((s) => s.date >= today) ??
    event.sessions[event.sessions.length - 1] ??
    null;
  const dDay = dDayFromKstYmd(primarySession?.date ?? null);

  // 신청 가능 여부 — 표시용. 실제 정원 트랜잭션은 Step 3.
  const lastDate = event.sessions.reduce(
    (m, s) => (s.date > m ? s.date : m),
    "0000-00-00",
  );
  const allPast = event.sessions.length > 0 && lastDate < today;
  const deadlinePassed =
    event.applyDeadline != null && Date.parse(event.applyDeadline) < Date.now();
  const full =
    event.capacity != null && event.applicationCount >= event.capacity;
  const closedReason = allPast
    ? "종료된 행사입니다"
    : deadlinePassed
      ? "신청이 마감되었습니다"
      : full
        ? "정원이 마감되었습니다"
        : null;

  const requiresDeposit = event.feeKrw > 0;

  return (
    <PublicShell>
      <BackLink href="/events">← 행사 목록</BackLink>

      <Hero>
        <Poster>
          <PosterCard
            title={event.title}
            subtitle={event.locationName}
            dateLabel={primarySession ? formatSessionRange(primarySession) : null}
            category={event.category}
            posterUrl={event.posterUrl}
          />
        </Poster>
        <HeroInfo>
          <BadgeRow>
            <DDayBadge dDay={dDay} size="md" />
            <CategoryBadge category={event.category} size="md" />
            <FeeBadge feeKrw={event.feeKrw} size="md" />
            <ModeBadge mode={event.mode} size="md" />
            <CapacityBadge
              capacity={event.capacity}
              applied={event.applicationCount}
              size="md"
            />
          </BadgeRow>
          <Title>{event.title}</Title>
          <MetaList>
            <dt>일시</dt>
            <dd>
              {event.sessions.length === 0
                ? "일정 미정"
                : event.sessions.map((s) => (
                    <div key={s.id}>{formatSessionRange(s)}</div>
                  ))}
            </dd>
            <dt>장소</dt>
            <dd>{event.locationName ?? "장소 미정"}</dd>
            {event.instructorName ? (
              <>
                <dt>강사</dt>
                <dd>{event.instructorName}</dd>
              </>
            ) : null}
            <dt>비용</dt>
            <dd>{formatFee(event.feeKrw)}</dd>
            {event.streamUrl ? (
              <>
                <dt>스트림</dt>
                <dd>
                  <StreamLink href={event.streamUrl} target="_blank" rel="noreferrer">
                    온라인 참여 링크 →
                  </StreamLink>
                </dd>
              </>
            ) : null}
          </MetaList>
        </HeroInfo>
      </Hero>

      <Columns>
        <Main>
          {event.instructorBio ? (
            <Section>
              <SectionTitle>강사 소개</SectionTitle>
              <InfoText>{event.instructorBio}</InfoText>
            </Section>
          ) : null}

          {event.descriptionMd ? (
            <Section>
              <SectionTitle>행사 소개</SectionTitle>
              <Markdown source={event.descriptionMd} />
            </Section>
          ) : null}

          {event.notice || event.preparation ? (
            <Section>
              <SectionTitle>안내 사항</SectionTitle>
              {event.preparation ? (
                <Accordion title="준비물" body={event.preparation} />
              ) : null}
              {event.notice ? (
                <Accordion title="유의사항" body={event.notice} />
              ) : null}
            </Section>
          ) : null}

          {event.eligibility || event.reward || event.refundPolicy ? (
            <Section>
              <SectionTitle>참여 정보</SectionTitle>
              <InfoGrid>
                {event.eligibility ? (
                  <>
                    <dt>참여 조건</dt>
                    <dd>{event.eligibility}</dd>
                  </>
                ) : null}
                {event.reward ? (
                  <>
                    <dt>리워드</dt>
                    <dd>{event.reward}</dd>
                  </>
                ) : null}
                {event.refundPolicy ? (
                  <>
                    <dt>환불 규정</dt>
                    <dd>{event.refundPolicy}</dd>
                  </>
                ) : null}
              </InfoGrid>
            </Section>
          ) : null}

          {requiresDeposit &&
          (event.depositBankName || event.depositAccountNo) ? (
            <Section>
              <SectionTitle>입금 안내</SectionTitle>
              <DepositCard>
                <InfoGrid>
                  <dt>참가비</dt>
                  <dd>{formatFee(event.feeKrw)}</dd>
                  {event.depositBankName ? (
                    <>
                      <dt>입금 계좌</dt>
                      <dd>
                        {event.depositBankName} {event.depositAccountNo ?? ""}
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
                <InfoText style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: eduColors.textMuted }}>
                  신청 후 안내된 계좌로 참가비를 입금해 주세요. 입금자명은 신청서에
                  적은 이름과 같게 해주세요.
                </InfoText>
              </DepositCard>
            </Section>
          ) : null}

          <Section id="apply">
            <SectionTitle>수강 신청</SectionTitle>
            <ApplyForm
              eventId={event.id}
              requiresDeposit={requiresDeposit}
              sessions={event.sessions}
              closedReason={closedReason}
              eventSummary={{
                title: event.title,
                locationName: event.locationName,
                feeKrw: event.feeKrw,
                depositBankName: event.depositBankName,
                depositAccountNo: event.depositAccountNo,
                depositAccountHolder: event.depositAccountHolder,
                refundPolicy: event.refundPolicy,
              }}
            />
          </Section>
        </Main>

        <Aside>
          <AsideFee>{formatFee(event.feeKrw)}</AsideFee>
          <AsideRow>
            일시
            <strong>
              {primarySession ? formatSessionRange(primarySession) : "미정"}
            </strong>
          </AsideRow>
          <AsideRow>
            장소<strong>{event.locationName ?? "미정"}</strong>
          </AsideRow>
          <AsideRow>
            정원
            <strong>
              {event.capacity == null
                ? "제한 없음"
                : `${event.applicationCount}/${event.capacity}명`}
            </strong>
          </AsideRow>
          <ApplyBtn href="#apply" $disabled={!!closedReason}>
            {closedReason ?? "신청하기"}
          </ApplyBtn>
        </Aside>
      </Columns>

      {sameOffice.length > 0 ? (
        <Section>
          <SectionTitle>이 회관의 다른 행사</SectionTitle>
          <EventCardGrid>
            {sameOffice.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </EventCardGrid>
        </Section>
      ) : null}

      <div style={{ marginTop: "1.5rem" }}>
        <OfficeOtcCard />
      </div>

      <MobileBar>
        <MobileBarFee>{formatFee(event.feeKrw)}</MobileBarFee>
        <MobileBarBtn href="#apply" $disabled={!!closedReason}>
          {closedReason ?? "신청하기"}
        </MobileBarBtn>
      </MobileBar>
    </PublicShell>
  );
}
