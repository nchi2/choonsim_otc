"use client";

// /admin/education/[id] — 행사 상세·관리. 승인/반려 상태머신·공개/추천 토글·내용 편집 저장
// (PATCH /api/admin/education/[id]) + 코멘트(targetType=EDUCATION_EVENT) 통합. (4-B 배선 완료)

import { use, useCallback, useEffect, useMemo, useState } from "react";
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
import { useAdminSession } from "@/components/admin/AdminSessionContext";
import { CommentsSection } from "@/components/admin/CommentsSection";
import { invalidate, useAdminData } from "@/lib/admin-data";
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

  return <DetailBody event={event} refresh={refresh} />;
}

function DetailBody({
  event,
  refresh,
}: {
  event: EduDetailEvent;
  refresh: () => void;
}) {
  // 편집 폼 — 초기값=현재 값. 저장 시 PATCH.
  const [title, setTitle] = useState(event.title);
  const [descriptionMd, setDescriptionMd] = useState(event.descriptionMd ?? "");
  const [capacity, setCapacity] = useState(
    event.capacity == null ? "" : String(event.capacity),
  );
  const [notice, setNotice] = useState(event.notice ?? "");

  // 승인/반려/노출/추천
  const [rejectReason, setRejectReason] = useState(event.rejectReason ?? "");
  const [isPublished, setIsPublished] = useState(event.isPublished);
  const [isFeatured, setIsFeatured] = useState(event.isFeatured);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // 공통 PATCH — 성공 시 교육 캐시 무효화 + 상세 재조회
  const patch = useCallback(
    async (body: Record<string, unknown>, doneLabel: string): Promise<boolean> => {
      if (busy) return false;
      setBusy(true);
      setActionErr(null);
      setSavedMsg(null);
      try {
        const res = await fetch(`/api/admin/education/${event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || "저장 실패");
        invalidate("admin:edu");
        refresh();
        setSavedMsg(`${doneLabel} 완료`);
        return true;
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "저장에 실패했습니다.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [busy, event.id, refresh],
  );

  const approve = () => patch({ status: "APPROVED" }, "승인 (자동 공개)");
  const reject = () => {
    if (!rejectReason.trim()) {
      setActionErr("반려 사유를 입력해 주세요.");
      return;
    }
    void patch({ status: "REJECTED", rejectReason: rejectReason.trim() }, "반려");
  };
  const togglePublished = async (next: boolean) => {
    setIsPublished(next);
    const ok = await patch({ isPublished: next }, next ? "공개" : "비공개");
    if (!ok) setIsPublished(!next); // 실패 시 되돌림
  };
  const toggleFeatured = async (next: boolean) => {
    setIsFeatured(next);
    const ok = await patch({ isFeatured: next }, next ? "추천 설정" : "추천 해제");
    if (!ok) setIsFeatured(!next);
  };
  const saveEdit = () =>
    patch(
      {
        title: title.trim(),
        capacity: capacity.trim() === "" ? null : Number(capacity),
        descriptionMd: descriptionMd.trim() || null,
        notice: notice.trim() || null,
      },
      "내용 저장",
    );

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

      {actionErr ? <InlineError>{actionErr}</InlineError> : null}
      {savedMsg ? <NoteBanner as="p">{savedMsg}</NoteBanner> : null}

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
          <PrimaryButton
            type="button"
            disabled={busy || event.status === "APPROVED"}
            onClick={approve}
          >
            승인 (자동 공개)
          </PrimaryButton>
          <RejectBtn
            type="button"
            disabled={busy || event.status === "REJECTED"}
            onClick={reject}
          >
            반려
          </RejectBtn>
        </ActionRow>
        <div style={{ marginTop: "0.85rem" }}>
          <ToggleRow>
            <input
              type="checkbox"
              checked={isPublished}
              disabled={busy}
              onChange={(e) => void togglePublished(e.target.checked)}
            />
            공개(isPublished) — 목록·공개 페이지 노출
          </ToggleRow>
          <ToggleRow>
            <input
              type="checkbox"
              checked={isFeatured}
              disabled={busy}
              onChange={(e) => void toggleFeatured(e.target.checked)}
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
          <PrimaryButton type="button" disabled={busy} onClick={() => void saveEdit()}>
            {busy ? "저장 중…" : "저장"}
          </PrimaryButton>
        </ActionRow>
      </Card>

      {/* 운영자 코멘트 — 기존 코멘트 시스템(targetType=EDUCATION_EVENT) */}
      <EducationComments eventId={event.id} />
    </Wrap>
  );
}

/** 코멘트 로더 — 교육 상세는 병합 GET이 없어 여기서 markRead=1로 1회 로드 후
 *  기존 CommentsSection(작성·수정·삭제·배지 무효화)에 initialComments로 전달. */
function EducationComments({ eventId }: { eventId: number }) {
  const session = useAdminSession();
  const [comments, setComments] = useState<
    | {
        id: number;
        createdAt: string;
        editedAt: string | null;
        authorId: number | null;
        authorName: string;
        body: string;
      }[]
    | null
  >(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/comments?targetType=EDUCATION_EVENT&targetId=${eventId}&markRead=1`,
        );
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "코멘트를 불러오지 못했습니다.");
        }
        if (!cancelled) {
          setComments(json.comments);
          // 읽음 처리됨 — 벨·집계 배지 갱신
          invalidate("admin:unread");
          invalidate("admin:stats");
        }
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : "오류가 발생했습니다.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loadErr) {
    return (
      <Card>
        <CardHead>
          <CardTitle>운영자 코멘트</CardTitle>
        </CardHead>
        <InlineError>{loadErr}</InlineError>
      </Card>
    );
  }
  if (comments == null) {
    return (
      <Card>
        <CardHead>
          <CardTitle>운영자 코멘트</CardTitle>
        </CardHead>
        <CommentPlaceholder>불러오는 중…</CommentPlaceholder>
      </Card>
    );
  }
  return (
    <CommentsSection
      targetType="EDUCATION_EVENT"
      targetId={eventId}
      initialComments={comments}
      myAdminUserId={session.adminUserId}
    />
  );
}
