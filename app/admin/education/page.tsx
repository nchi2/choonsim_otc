"use client";

// /admin/education — 교육 행사·개설 신청 통합 목록. 상태 필터(검토대기/승인/반려/전체).
// 기존 어드민 목록 패턴(useAdminData·States·FilterTab) 그대로. 읽기 전용.

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import {
  FilterTab,
  FilterTabCount,
  StatusBadge,
  ToolbarButton,
  adminColors,
} from "@/components/admin/ui";
import { EmptyState, ErrorState, RefreshingBar, Skeleton } from "@/components/admin/States";
import { EducationTabs } from "@/components/admin/EducationTabs";
import { useAdminPageHeader } from "@/components/admin/AdminPageHeaderContext";
import { invalidate, useAdminData } from "@/lib/admin-data";
import {
  EDU_CATEGORY_LABEL,
  EDU_LIST_TTL,
  EDU_STATUS_LABEL,
  eduListKey,
  eduListUrl,
  eduStatusColor,
  fmtFeeKrw,
  fmtSessionBrief,
  type EduListItem,
  type EduListResponse,
} from "@/lib/education-admin-fetchers";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED" | "ALL";
const TAB_ORDER: StatusFilter[] = ["PENDING", "APPROVED", "REJECTED", "CANCELED", "ALL"];
const TAB_LABEL: Record<StatusFilter, string> = {
  PENDING: "검토 대기",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
  CANCELED: "취소됨",
  ALL: "전체",
};

const Wrap = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const Table = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  overflow: hidden;
`;

const Head = styled.div`
  display: grid;
  grid-template-columns: 1fr 88px 120px 110px 96px 92px;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  background: ${adminColors.bgSubtle};
  border-bottom: 1px solid ${adminColors.border};
  font-size: 0.72rem;
  font-weight: 700;
  color: ${adminColors.textMuted};

  @media (max-width: 720px) {
    display: none;
  }
`;

const Row = styled(Link)`
  display: grid;
  grid-template-columns: 1fr 88px 120px 110px 96px 92px;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid ${adminColors.rowDivider};
  font-size: 0.83rem;
  color: ${adminColors.text};
  text-decoration: none;

  &:hover {
    background: ${adminColors.bgHoverRow};
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr auto;
    gap: 0.35rem 0.6rem;
  }
`;

const TitleCell = styled.div`
  min-width: 0;
  .t {
    font-weight: 700;
    color: ${adminColors.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    margin-top: 0.15rem;
    font-size: 0.74rem;
    color: ${adminColors.textMuted};
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
`;

const Cell = styled.div<{ $muted?: boolean }>`
  font-size: 0.8rem;
  color: ${(p) => (p.$muted ? adminColors.textMuted : adminColors.textSub)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 720px) {
    &[data-hide-mobile="true"] {
      display: none;
    }
  }
`;

const Flags = styled.div`
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
`;

const Flag = styled.span<{ $tone: "pub" | "feat" | "test" }>`
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 0.66rem;
  font-weight: 800;
  ${(p) =>
    p.$tone === "pub"
      ? `background:${adminColors.successSoft};color:${adminColors.successDeep};`
      : p.$tone === "feat"
        ? `background:${adminColors.primarySoft};color:${adminColors.primary};`
        : `background:${adminColors.bgHover};color:${adminColors.textMuted};`}
`;

const CapCell = styled.div<{ $full?: boolean }>`
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${(p) => (p.$full ? adminColors.danger : adminColors.textSub)};
  white-space: nowrap;
`;

function EducationListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusRaw = searchParams.get("status");
  const filter: StatusFilter =
    statusRaw === "APPROVED" ||
    statusRaw === "REJECTED" ||
    statusRaw === "CANCELED" ||
    statusRaw === "ALL"
      ? statusRaw
      : "PENDING";
  const [includeTest] = useState(false);

  const cacheKey = eduListKey(filter, includeTest);
  const { data, error, isLoading, isValidating, refresh } =
    useAdminData<EduListResponse>(
      cacheKey,
      () => fetch(eduListUrl(filter, includeTest)).then((r) => r.json()).then((j) => {
        if (!j.ok) throw new Error(j.error || "목록을 불러오지 못했습니다.");
        return j as EduListResponse;
      }),
      { ttl: EDU_LIST_TTL },
    );

  const doRefresh = useCallback(() => invalidate("admin:edu:list"), []);
  // Step 28: "교육자 신청" 진입은 헤더 버튼 대신 상단 탭(EducationTabs)으로 이동
  const headerActions = useMemo(
    () => (
      <ToolbarButton type="button" style={{ marginLeft: 0 }} onClick={doRefresh}>
        새로고침
      </ToolbarButton>
    ),
    [doRefresh],
  );
  useAdminPageHeader("이벤트 관리", headerActions);

  const counts = data?.counts;
  const tabCount = (t: StatusFilter) =>
    t === "ALL" ? (counts?.total ?? 0) : (counts?.[t] ?? 0);

  const setFilter = (t: StatusFilter) =>
    router.replace(`/admin/education?status=${t}`, { scroll: false });

  const items: EduListItem[] = data?.items ?? [];

  return (
    <Wrap>
      <EducationTabs active="events" />
      <Toolbar>
        {TAB_ORDER.map((t) => (
          <FilterTab
            key={t}
            type="button"
            $active={filter === t}
            onClick={() => setFilter(t)}
          >
            {TAB_LABEL[t]}
            <FilterTabCount $active={filter === t}>{tabCount(t)}</FilterTabCount>
          </FilterTab>
        ))}
      </Toolbar>

      <RefreshingBar active={isValidating && !isLoading} />

      {isLoading && !data ? (
        <Skeleton variant="table" count={6} />
      ) : error && !data ? (
        <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={refresh} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="행사가 없습니다"
          desc="이 상태의 교육 행사가 아직 없습니다."
        />
      ) : (
        <Table>
          <Head>
            <span>제목 · 장소</span>
            <span>분류</span>
            <span>일시</span>
            <span>정원</span>
            <span>상태</span>
            <span style={{ textAlign: "right" }}>표시</span>
          </Head>
          {items.map((it) => {
            const full = it.capacity != null && it.applicationCount >= it.capacity;
            return (
              <Row key={it.id} href={`/admin/education/${it.id}`}>
                <TitleCell>
                  <div className="t">{it.title}</div>
                  <div className="sub">
                    <span>{it.locationName ?? "장소 미정"}</span>
                    <span>· {fmtFeeKrw(it.feeKrw)}</span>
                  </div>
                </TitleCell>
                <Cell data-hide-mobile="true" $muted>
                  {EDU_CATEGORY_LABEL[it.category] ?? it.category}
                </Cell>
                <Cell data-hide-mobile="true">
                  {fmtSessionBrief(it.session)}
                  {it.sessionCount > 1 ? ` 외 ${it.sessionCount - 1}` : ""}
                </Cell>
                <CapCell $full={full} data-hide-mobile="true">
                  {it.capacity == null
                    ? `${it.applicationCount}명`
                    : `${it.applicationCount}/${it.capacity}`}
                </CapCell>
                <div>
                  <StatusBadge $color={eduStatusColor(it.status)}>
                    {EDU_STATUS_LABEL[it.status] ?? it.status}
                  </StatusBadge>
                </div>
                <Flags>
                  {it.isPublished ? <Flag $tone="pub">공개</Flag> : null}
                  {it.isFeatured ? <Flag $tone="feat">추천</Flag> : null}
                  {it.isTest ? <Flag $tone="test">TEST</Flag> : null}
                </Flags>
              </Row>
            );
          })}
        </Table>
      )}
    </Wrap>
  );
}

export default function AdminEducationPage() {
  return (
    <Suspense fallback={<Wrap><Skeleton variant="table" count={6} /></Wrap>}>
      <EducationListInner />
    </Suspense>
  );
}
