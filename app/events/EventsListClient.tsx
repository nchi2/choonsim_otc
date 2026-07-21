"use client";

// /events 목록 클라이언트 — FilterBar(카테고리·회관·무료유료·온오프) ↔ URL 쿼리 동기화,
// EventCardGrid(데스크톱 3열) / EventCardList(모바일) 전환, 빈 상태 처리.
// 추천 캐러셀은 목록 상단에서 생략(메인과 중복 방지 — 카탈로그 톤). 대신 필터로 탐색.

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import {
  EventCard,
  EventCardGrid,
  EventCardList,
} from "@/components/education/EventCard";
import {
  FilterBar,
  applyEventFilter,
  type EventFilterValue,
} from "@/components/education/FilterBar";
import { OfficeOtcCard } from "@/components/education/OfficeOtcCard";
import { eduColors, media } from "@/components/education/tokens";
import type { EventCardData } from "@/components/education/types";

const PageTitle = styled.h1`
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

const PageSub = styled.p`
  margin: 0 0 1.1rem;
  font-size: 0.85rem;
  color: ${eduColors.textMuted};
`;

const ResultCount = styled.p`
  margin: 1.1rem 0 0.7rem;
  font-size: 0.8rem;
  color: ${eduColors.textFaint};

  strong {
    color: ${eduColors.primary};
    font-weight: 700;
  }
`;

const DesktopOnly = styled.div`
  ${media.sm} {
    display: none;
  }
`;
const MobileOnly = styled.div`
  display: none;
  ${media.sm} {
    display: block;
  }
`;

const Empty = styled.div`
  padding: 3rem 1rem;
  text-align: center;
  border: 1px dashed ${eduColors.border};
  border-radius: 12px;
  color: ${eduColors.textMuted};

  .icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
  }
`;

const OtcWrap = styled.div`
  margin-top: 2rem;
`;

// URL 쿼리 ↔ 필터 매핑
function filterFromParams(p: URLSearchParams): EventFilterValue {
  const officeRaw = p.get("office");
  const feeRaw = p.get("fee");
  return {
    category: p.get("category"),
    officeId: officeRaw != null && officeRaw !== "" ? Number(officeRaw) : null,
    fee: feeRaw === "FREE" || feeRaw === "PAID" ? feeRaw : null,
    mode: p.get("mode"),
  };
}

export function EventsListClient({
  events,
  offices,
}: {
  events: EventCardData[];
  offices: { id: number; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = useMemo(
    () => filterFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const onChange = useCallback(
    (next: EventFilterValue) => {
      const params = new URLSearchParams();
      if (next.category) params.set("category", next.category);
      if (next.officeId != null) params.set("office", String(next.officeId));
      if (next.fee) params.set("fee", next.fee);
      if (next.mode) params.set("mode", next.mode);
      const qs = params.toString();
      router.replace(qs ? `/events?${qs}` : "/events", { scroll: false });
    },
    [router],
  );

  const filtered = useMemo(() => {
    // category/mode/fee는 공용 헬퍼, officeId는 여기서(카드에 officeId 보유)
    let list = applyEventFilter(events, filter);
    if (filter.officeId != null) {
      list =
        filter.officeId === -1
          ? list.filter((e) => e.officeId == null) // 기타 장소
          : list.filter((e) => e.officeId === filter.officeId);
    }
    return list;
  }, [events, filter]);

  return (
    <PublicShell>
      <PageTitle>행사 찾기</PageTitle>
      <PageSub>모빅회관에서 열리는 BMB·SBMB 강연·실습·이벤트</PageSub>

      <FilterBar value={filter} onChange={onChange} offices={offices} />

      <ResultCount>
        총 <strong>{filtered.length}</strong>건
      </ResultCount>

      {filtered.length === 0 ? (
        <Empty>
          <span className="icon">🔍</span>
          조건에 맞는 행사가 없습니다. 필터를 조정해 보세요.
        </Empty>
      ) : (
        <>
          <DesktopOnly>
            <EventCardGrid>
              {filtered.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </EventCardGrid>
          </DesktopOnly>
          <MobileOnly>
            <EventCardList>
              {filtered.map((ev) => (
                <EventCard key={ev.id} event={ev} variant="list" />
              ))}
            </EventCardList>
          </MobileOnly>
        </>
      )}

      <OtcWrap>
        <OfficeOtcCard />
      </OtcWrap>
    </PublicShell>
  );
}
