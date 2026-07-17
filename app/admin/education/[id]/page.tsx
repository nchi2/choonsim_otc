"use client";

// /admin/education/[id] — 행사 상세·관리. 전체 정보 표시 + 편집 폼 + 승인/반려/노출/추천 UI.
// ★ 상태 전환·편집 저장·코멘트 실제 통합은 4-B(Fable). 여기선 UI + placeholder 핸들러만.

import { use, useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import {
  InlineError,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  ToolbarButton,
  adminColors,
} from "@/components/admin/ui";
import { ErrorState, Skeleton } from "@/components/admin/States";
import { useAdminPageHeader } from "@/components/admin/AdminPageHeaderContext";
import { useAdminData } from "@/lib/admin-data";
import {
  EDU_CATEGORY_LABEL,
  EDU_DETAIL_TTL,
  EDU_MODE_LABEL,
  EDU_STATUS_LABEL,
  eduDetailFetcher,
  eduDetailKey,
  eduStatusColor,
  fmtFeeKrw,
  type EduDetailEvent,
} from "@/lib/education-admin-fetchers";

const Wrap = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const BackLink = styled(Link)`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${adminColors.textMuted};
  text-decoration: none;
  &:hover {
    color: ${adminColors.primary};
  }
`;

const Card = styled.section`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  padding: 1.1rem 1.25rem;
  margin-bottom: 1rem;
`;

const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${adminColors.text};
`;

const NoteBanner = styled.p`
  margin: 0 0 1rem;
  padding: 0.55rem 0.8rem;
  border: 1px dashed ${adminColors.warnBorder};
  border-radius: 8px;
  background: ${adminColors.warnSoft};
  color: ${adminColors.warnText};
  font-size: 0.76rem;
  font-weight: 600;
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  align-items: center;
`;

const EventTitle = styled.h1`
  margin: 0.5rem 0 0.6rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: ${adminColors.text};
`;

const Grid = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 0.5rem 0.85rem;
  font-size: 0.85rem;

  dt {
    color: ${adminColors.textMuted};
    font-weight: 700;
  }
  dd {
    margin: 0;
    color: ${adminColors.textSub};
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const SessionList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const SessionItem = styled.li`
  display: flex;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid ${adminColors.rowDivider};
  border-radius: 8px;
  font-size: 0.84rem;
  color: ${adminColors.textSub};
  font-variant-numeric: tabular-nums;
`;

const Field = styled.label`
  display: block;
  margin-bottom: 0.8rem;
  &:last-child {
    margin-bottom: 0;
  }
`;

const FieldLabel = styled.span`
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
  margin-bottom: 0.3rem;
`;

const inputCss = `
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  font-size: 0.86rem;
  background: ${adminColors.white};
  color: ${adminColors.text};
  &:focus { outline: none; border-color: ${adminColors.primary}; }
`;
const Input = styled.input`
  ${inputCss}
`;
const Textarea = styled.textarea`
  ${inputCss}
  min-height: 90px;
  resize: vertical;
`;

const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  font-size: 0.86rem;
  color: ${adminColors.textSub};
  cursor: pointer;
  input {
    width: 1.05rem;
    height: 1.05rem;
    accent-color: ${adminColors.primary};
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`;

const RejectBtn = styled(SecondaryButton)`
  border-color: ${adminColors.dangerBorder};
  color: ${adminColors.dangerText};
  &:hover {
    background: ${adminColors.dangerSoft};
  }
`;

const CommentPlaceholder = styled.div`
  border: 1px dashed ${adminColors.border};
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
  color: ${adminColors.textFaint};
  font-size: 0.82rem;
`;

function fmtSessionFull(s: { date: string; startTime: string; endTime: string }) {
  const wd = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(`${s.date}T00:00:00+09:00`).getDay()
  ];
  return `${s.date} (${wd}) ${s.startTime}~${s.endTime}`;
}

export default function AdminEducationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = Number(id);

  const { data: event, error, isLoading, refresh } = useAdminData<EduDetailEvent>(
    eduDetailKey(eventId),
    eduDetailFetcher(eventId),
    { ttl: EDU_DETAIL_TTL },
  );

  useAdminPageHeader(
    "행사 상세",
    useMemo(
      () => (
        <ToolbarButton type="button" style={{ marginLeft: 0 }} onClick={() => refresh()}>
          새로고침
        </ToolbarButton>
      ),
      [refresh],
    ),
  );

  if (isLoading && !event) {
    return (
      <Wrap>
        <Skeleton variant="card" count={3} />
      </Wrap>
    );
  }
  if ((error && !event) || !event) {
    return (
      <Wrap>
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={refresh} />
      </Wrap>
    );
  }

  return <DetailBody event={event} />;
}

function DetailBody({ event }: { event: EduDetailEvent }) {
  // 편집 폼 — 로컬 상태만(저장 배선은 4-B). 초기값=현재 값.
  const [title, setTitle] = useState(event.title);
  const [descriptionMd, setDescriptionMd] = useState(event.descriptionMd ?? "");
  const [capacity, setCapacity] = useState(
    event.capacity == null ? "" : String(event.capacity),
  );
  const [notice, setNotice] = useState(event.notice ?? "");

  // 승인/반려/노출/추천 — UI 상태만
  const [rejectReason, setRejectReason] = useState(event.rejectReason ?? "");
  const [isPublished, setIsPublished] = useState(event.isPublished);
  const [isFeatured, setIsFeatured] = useState(event.isFeatured);
  const [placeholderMsg, setPlaceholderMsg] = useState<string | null>(null);

  const notWired = (label: string) =>
    setPlaceholderMsg(`[준비 중] ${label}은(는) 다음 단계(4-B)에서 저장 배선됩니다.`);

  const locationName = event.office?.name ?? event.customLocation ?? "장소 미정";

  return (
    <Wrap>
      <TopRow>
        <BackLink href="/admin/education">← 교육 관리 목록</BackLink>
        <BadgeRow>
          <StatusBadge $color={eduStatusColor(event.status)}>
            {EDU_STATUS_LABEL[event.status] ?? event.status}
          </StatusBadge>
          {event.isPublished ? (
            <StatusBadge $color={adminColors.success}>공개 중</StatusBadge>
          ) : null}
        </BadgeRow>
      </TopRow>

      <NoteBanner>
        이 화면의 편집·승인/반려·노출/추천은 현재 화면(UI)만 배치돼 있습니다. 실제
        저장은 4-B에서 배선됩니다.
      </NoteBanner>

      {placeholderMsg ? <InlineError>{placeholderMsg}</InlineError> : null}

      {/* 승인 워크플로우 */}
      <Card>
        <CardHead>
          <CardTitle>개설 승인</CardTitle>
        </CardHead>
        <Grid>
          <dt>개설 신청자</dt>
          <dd>
            {event.hostName ?? "-"}
            {event.hostContact ? ` · ${event.hostContact}` : ""}
            {event.hostEmail ? ` · ${event.hostEmail}` : ""}
          </dd>
          <dt>현재 상태</dt>
          <dd>{EDU_STATUS_LABEL[event.status] ?? event.status}</dd>
        </Grid>
        <Field style={{ marginTop: "0.85rem" }}>
          <FieldLabel>반려 사유 (반려 시 필수)</FieldLabel>
          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="반려 시 신청자에게 전달할 사유"
          />
        </Field>
        <ActionRow>
          <PrimaryButton type="button" onClick={() => notWired("승인")}>
            승인 (자동 공개)
          </PrimaryButton>
          <RejectBtn type="button" onClick={() => notWired("반려")}>
            반려
          </RejectBtn>
        </ActionRow>
        <div style={{ marginTop: "0.85rem" }}>
          <ToggleRow>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => {
                setIsPublished(e.target.checked);
                notWired("공개 여부 변경");
              }}
            />
            공개(isPublished) — 목록·공개 페이지 노출
          </ToggleRow>
          <ToggleRow>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => {
                setIsFeatured(e.target.checked);
                notWired("추천 여부 변경");
              }}
            />
            추천(isFeatured) — 메인 캐러셀 노출
          </ToggleRow>
        </div>
      </Card>

      {/* 요약 */}
      <Card>
        <BadgeRow>
          <StatusBadge $color={adminColors.primary}>
            {EDU_CATEGORY_LABEL[event.category] ?? event.category}
          </StatusBadge>
          <StatusBadge $color={adminColors.info}>
            {EDU_MODE_LABEL[event.mode] ?? event.mode}
          </StatusBadge>
          <StatusBadge
            $color={event.feeKrw > 0 ? adminColors.warnAmber : adminColors.success}
          >
            {fmtFeeKrw(event.feeKrw)}
          </StatusBadge>
        </BadgeRow>
        <EventTitle>{event.title}</EventTitle>
        <Grid>
          <dt>장소</dt>
          <dd>{locationName}</dd>
          <dt>강사</dt>
          <dd>
            {event.instructorName ?? "-"}
            {event.instructorBio ? `\n${event.instructorBio}` : ""}
          </dd>
          <dt>정원</dt>
          <dd>
            {event.capacity == null
              ? `제한 없음 (신청 ${event._count.applications}명)`
              : `${event._count.applications} / ${event.capacity}명`}
          </dd>
          <dt>신청 마감</dt>
          <dd>
            {event.applyDeadline
              ? new Date(event.applyDeadline).toLocaleString("ko-KR")
              : "미지정"}
          </dd>
          {event.streamUrl ? (
            <>
              <dt>스트림</dt>
              <dd>{event.streamUrl}</dd>
            </>
          ) : null}
          {event.feeKrw > 0 ? (
            <>
              <dt>입금 계좌</dt>
              <dd>
                {[event.depositBankName, event.depositAccountNo, event.depositAccountHolder]
                  .filter(Boolean)
                  .join(" · ") || "-"}
              </dd>
            </>
          ) : null}
        </Grid>
      </Card>

      {/* 세션 */}
      <Card>
        <CardHead>
          <CardTitle>회차 ({event.sessions.length})</CardTitle>
          <Link
            href={`/admin/education/${event.id}/applicants`}
            style={{ fontSize: "0.8rem", fontWeight: 700, color: adminColors.primary, textDecoration: "none" }}
          >
            신청자 명단 →
          </Link>
        </CardHead>
        {event.sessions.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.84rem", color: adminColors.textFaint }}>
            등록된 회차가 없습니다.
          </p>
        ) : (
          <SessionList>
            {event.sessions.map((s) => (
              <SessionItem key={s.id}>{fmtSessionFull(s)}</SessionItem>
            ))}
          </SessionList>
        )}
      </Card>

      {/* 편집 폼 */}
      <Card>
        <CardHead>
          <CardTitle>내용 편집</CardTitle>
        </CardHead>
        <Field>
          <FieldLabel>제목</FieldLabel>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>정원 (비우면 무제한)</FieldLabel>
          <Input
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>소개 (마크다운)</FieldLabel>
          <Textarea
            value={descriptionMd}
            onChange={(e) => setDescriptionMd(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>유의사항</FieldLabel>
          <Textarea value={notice} onChange={(e) => setNotice(e.target.value)} />
        </Field>
        <ActionRow>
          <PrimaryButton type="button" onClick={() => notWired("내용 저장")}>
            저장
          </PrimaryButton>
        </ActionRow>
      </Card>

      {/* 코멘트 자리 */}
      <Card>
        <CardHead>
          <CardTitle>운영자 코멘트</CardTitle>
        </CardHead>
        <CommentPlaceholder>
          코멘트 통합(targetType=&quot;EDUCATION_EVENT&quot;)은 4-B에서 배선됩니다.
        </CommentPlaceholder>
      </Card>
    </Wrap>
  );
}
