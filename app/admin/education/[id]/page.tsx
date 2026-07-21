"use client";

// /admin/education/[id] — 행사 상세·관리. 승인/반려 상태머신·공개/추천 토글·내용 편집 저장
// (PATCH /api/admin/education/[id]) + 코멘트(targetType=EDUCATION_EVENT) 통합. (4-B 배선 완료)

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  OFFICES_KEY,
  OFFICES_TTL,
  officesFetcher,
  type DashboardData,
} from "@/lib/admin-fetchers";
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
import {
  AMPM_OPTS,
  HOUR12_OPTS,
  MINUTE_OPTS,
  openDatePicker,
  parse24,
  to24,
} from "@/lib/time-input";
import {
  DEFAULT_DEPOSIT_ACCOUNT_HOLDER,
  DEFAULT_DEPOSIT_ACCOUNT_NO,
  DEFAULT_DEPOSIT_BANK_NAME,
} from "@/lib/education-defaults";

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
  &:disabled { background: ${adminColors.bgSubtle}; color: ${adminColors.textFaint}; }
`;
const Input = styled.input`
  ${inputCss}
`;
const Textarea = styled.textarea`
  ${inputCss}
  min-height: 90px;
  resize: vertical;
`;
const Select = styled.select`
  ${inputCss}
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

/* 세션(회차) 카드 — /host와 동일 UX(Step 20), adminColors로만 재배색 */
const SessionCard = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 9px;
  padding: 0.7rem 0.8rem;
  margin-bottom: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const SessionTop = styled.div`
  display: flex;
  align-items: end;
  gap: 0.5rem;

  label {
    flex: 1;
    min-width: 0;
  }
`;

const SessionTimes = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const TimeGroup = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 0.35rem;
`;

const MiniSelect = styled.select`
  ${inputCss}
  padding: 0.45rem 0.35rem;
  font-size: 0.8rem;
`;

const MiniLabel = styled.span`
  display: block;
  font-size: 0.66rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
  margin-bottom: 0.2rem;
`;

const SmallBtn = styled.button`
  padding: 0.45rem 0.65rem;
  border-radius: 7px;
  border: 1px solid ${adminColors.borderInput};
  background: ${adminColors.white};
  color: ${adminColors.textSub};
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    border-color: ${adminColors.primary};
    color: ${adminColors.primary};
  }
`;

const AddBtn = styled(SmallBtn)`
  align-self: flex-start;
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

/** 시간 피커 — /host(Step 20)와 동일 UX·변환 로직(lib/time-input.ts), adminColors로 재배색만.
 * 부모는 "HH:MM"(또는 "") 하나만 관리. 미완성(오전/오후·시 미선택)은 ""로 emit. */
function AdminTimePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const p0 = parse24(value);
  const [ampm, setAmpm] = useState(p0?.ampm ?? "");
  const [hour, setHour] = useState(p0 ? String(p0.hour) : "");
  const [minute, setMinute] = useState(p0?.minute ?? "00");
  // 우리가 방금 emit한 값 기록 — 외부(행사 전환·회차 삭제로 인덱스 이동) 변경만 재동기화
  const syncedRef = useRef(value);

  useEffect(() => {
    if (value !== syncedRef.current) {
      syncedRef.current = value;
      const p = parse24(value);
      setAmpm(p?.ampm ?? "");
      setHour(p ? String(p.hour) : "");
      setMinute(p?.minute ?? "00");
    }
  }, [value]);

  const update = (a: string, h: string, m: string) => {
    setAmpm(a);
    setHour(h);
    setMinute(m);
    const next = a && h ? to24(a, Number(h), m) : "";
    syncedRef.current = next;
    onChange(next);
  };

  // 기존 데이터가 00/30이 아닌 분(예외)이면 옵션에 포함해 값 유실 방지
  const minuteOptions: readonly string[] = (
    MINUTE_OPTS as readonly string[]
  ).includes(minute)
    ? MINUTE_OPTS
    : [minute, ...MINUTE_OPTS];

  return (
    <TimeGroup role="group" aria-label={label}>
      <MiniSelect
        value={ampm}
        onChange={(e) => update(e.target.value, hour, minute)}
        aria-label={`${label} 오전/오후`}
      >
        <option value="">오전/오후</option>
        {AMPM_OPTS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </MiniSelect>
      <MiniSelect
        value={hour}
        onChange={(e) => update(ampm, e.target.value, minute)}
        aria-label={`${label} 시`}
      >
        <option value="">시</option>
        {HOUR12_OPTS.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </MiniSelect>
      <MiniSelect
        value={minute}
        onChange={(e) => update(ampm, hour, e.target.value)}
        aria-label={`${label} 분`}
      >
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {m}분
          </option>
        ))}
      </MiniSelect>
    </TimeGroup>
  );
}

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
  // Step 21: Step 15에서 "운영자에게 문의" 안내한 항목 전체를 여기서 실제로 수정 가능하게 확장.
  const [title, setTitle] = useState(event.title);
  const [category, setCategory] = useState(event.category);
  const [mode, setMode] = useState(event.mode);
  const [streamUrl, setStreamUrl] = useState(event.streamUrl ?? "");
  const [descriptionMd, setDescriptionMd] = useState(event.descriptionMd ?? "");
  const [instructorName, setInstructorName] = useState(event.instructorName ?? "");
  const [instructorBio, setInstructorBio] = useState(event.instructorBio ?? "");
  const [officeId, setOfficeId] = useState(
    event.officeId == null ? "" : String(event.officeId),
  );
  const [customLocation, setCustomLocation] = useState(event.customLocation ?? "");
  const [sessions, setSessions] = useState(
    event.sessions.length > 0
      ? event.sessions.map((s) => ({ date: s.date, startTime: s.startTime, endTime: s.endTime }))
      : [{ date: "", startTime: "", endTime: "" }],
  );
  const [capacity, setCapacity] = useState(
    event.capacity == null ? "" : String(event.capacity),
  );
  const [feeKrw, setFeeKrw] = useState(String(event.feeKrw));
  const [applyDeadline, setApplyDeadline] = useState(
    event.applyDeadline ? event.applyDeadline.slice(0, 10) : "",
  );
  // 계좌 미등록이면 춘심팀 기본값으로 미리 채움(수정 가능, Step 25) — 기존 값이 있으면 그게 우선.
  const [depositBankName, setDepositBankName] = useState(
    event.depositBankName ?? DEFAULT_DEPOSIT_BANK_NAME,
  );
  const [depositAccountNo, setDepositAccountNo] = useState(
    event.depositAccountNo ?? DEFAULT_DEPOSIT_ACCOUNT_NO,
  );
  const [depositAccountHolder, setDepositAccountHolder] = useState(
    event.depositAccountHolder ?? DEFAULT_DEPOSIT_ACCOUNT_HOLDER,
  );
  const [eligibility, setEligibility] = useState(event.eligibility ?? "");
  const [preparation, setPreparation] = useState(event.preparation ?? "");
  const [reward, setReward] = useState(event.reward ?? "");
  const [refundPolicy, setRefundPolicy] = useState(event.refundPolicy ?? "");
  const [notice, setNotice] = useState(event.notice ?? "");

  const { data: officesData } = useAdminData<DashboardData["offices"]>(
    OFFICES_KEY,
    officesFetcher,
    { ttl: OFFICES_TTL },
  );
  // Step 16: 교육 회관 선택지는 educationActive 기준(OTC isActive와 독립)
  const eduOffices = (officesData ?? []).filter((o) => o.educationActive);

  const updateSession = (i: number, patch: Partial<(typeof sessions)[number]>) =>
    setSessions((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addSession = () =>
    setSessions((prev) => [...prev, { date: "", startTime: "", endTime: "" }]);
  const removeSession = (i: number) =>
    setSessions((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const isPaid = Number(feeKrw) > 0;

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
        category,
        mode,
        streamUrl: streamUrl.trim() || null,
        descriptionMd: descriptionMd.trim() || null,
        instructorName: instructorName.trim() || null,
        instructorBio: instructorBio.trim() || null,
        officeId: officeId === "" ? null : Number(officeId),
        customLocation: officeId === "" ? customLocation.trim() || null : null,
        sessions: sessions.filter((s) => s.date && s.startTime),
        capacity: capacity.trim() === "" ? null : Number(capacity),
        feeKrw: Number(feeKrw) || 0,
        applyDeadline: applyDeadline || null,
        depositBankName: depositBankName.trim() || null,
        depositAccountNo: depositAccountNo.trim() || null,
        depositAccountHolder: depositAccountHolder.trim() || null,
        eligibility: eligibility.trim() || null,
        preparation: preparation.trim() || null,
        reward: reward.trim() || null,
        refundPolicy: refundPolicy.trim() || null,
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

      {/* 편집 폼 — Step 21: Step 15에서 "운영자에게 문의" 안내한 항목 전체를 여기서 실제 수정 */}
      <Card>
        <CardHead>
          <CardTitle>내용 편집</CardTitle>
        </CardHead>
        <Field>
          <FieldLabel>제목</FieldLabel>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Grid2>
          <Field>
            <FieldLabel>분류</FieldLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.entries(EDU_CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <FieldLabel>진행 방식</FieldLabel>
            <Select value={mode} onChange={(e) => setMode(e.target.value)}>
              {Object.entries(EDU_MODE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </Grid2>
        {mode === "ONLINE" || mode === "HYBRID" ? (
          <Field>
            <FieldLabel>스트림 링크</FieldLabel>
            <Input
              type="url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://"
            />
          </Field>
        ) : null}
        <Grid2>
          <Field>
            <FieldLabel>강사명</FieldLabel>
            <Input value={instructorName} onChange={(e) => setInstructorName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>강사 소개</FieldLabel>
            <Input value={instructorBio} onChange={(e) => setInstructorBio(e.target.value)} />
          </Field>
        </Grid2>
        <Field>
          <FieldLabel>소개 (마크다운)</FieldLabel>
          <Textarea
            value={descriptionMd}
            onChange={(e) => setDescriptionMd(e.target.value)}
          />
        </Field>

        {/* 일시 — 회차. 날짜=달력 피커, 시간=오전/오후+시+분(Step 20 UX 재사용) */}
        <FieldLabel>회차</FieldLabel>
        {sessions.map((s, i) => (
          <SessionCard key={i}>
            <SessionTop>
              <label>
                <MiniLabel>날짜</MiniLabel>
                <Input
                  type="date"
                  value={s.date}
                  onClick={openDatePicker}
                  onChange={(e) => updateSession(i, { date: e.target.value })}
                  aria-label={`${i + 1}회차 날짜`}
                />
              </label>
              {sessions.length > 1 ? (
                <SmallBtn type="button" onClick={() => removeSession(i)}>
                  삭제
                </SmallBtn>
              ) : null}
            </SessionTop>
            <SessionTimes>
              <div>
                <MiniLabel>시작</MiniLabel>
                <AdminTimePicker
                  value={s.startTime}
                  onChange={(v) => updateSession(i, { startTime: v })}
                  label={`${i + 1}회차 시작`}
                />
              </div>
              <div>
                <MiniLabel>종료</MiniLabel>
                <AdminTimePicker
                  value={s.endTime}
                  onChange={(v) => updateSession(i, { endTime: v })}
                  label={`${i + 1}회차 종료`}
                />
              </div>
            </SessionTimes>
          </SessionCard>
        ))}
        <AddBtn type="button" onClick={addSession} style={{ marginBottom: "0.85rem" }}>
          + 회차 추가
        </AddBtn>

        {/* 장소 */}
        <Grid2>
          <Field>
            <FieldLabel>회관 선택</FieldLabel>
            <Select value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
              <option value="">직접 입력</option>
              {eduOffices.map((o) => (
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
              disabled={officeId !== ""}
            />
          </Field>
        </Grid2>

        {/* 모집·비용 */}
        <Grid2>
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
            <FieldLabel>참가비 (원, 0=무료)</FieldLabel>
            <Input
              type="number"
              min="0"
              value={feeKrw}
              onChange={(e) => setFeeKrw(e.target.value)}
            />
          </Field>
        </Grid2>
        <Field>
          <FieldLabel>신청 마감일 (비우면 시작 전까지)</FieldLabel>
          <Input
            type="date"
            value={applyDeadline}
            onClick={openDatePicker}
            onChange={(e) => setApplyDeadline(e.target.value)}
          />
        </Field>
        {isPaid ? (
          <>
            <FieldLabel style={{ marginTop: "0.3rem" }}>입금 계좌 안내</FieldLabel>
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
            </Grid2>
            <Field>
              <FieldLabel>예금주</FieldLabel>
              <Input
                value={depositAccountHolder}
                onChange={(e) => setDepositAccountHolder(e.target.value)}
              />
            </Field>
          </>
        ) : null}

        {/* 안내사항 — 여러 줄 입력 가능(Step 25) */}
        <Field>
          <FieldLabel>참여 대상·조건</FieldLabel>
          <Textarea value={eligibility} onChange={(e) => setEligibility(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>준비물</FieldLabel>
          <Textarea value={preparation} onChange={(e) => setPreparation(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>리워드</FieldLabel>
          <Textarea value={reward} onChange={(e) => setReward(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>환불·노쇼 규정</FieldLabel>
          <Textarea value={refundPolicy} onChange={(e) => setRefundPolicy(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>기타 유의사항</FieldLabel>
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
