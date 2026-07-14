"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useAdminSession } from "@/components/admin/AdminSessionContext";
import MonthCalendar, {
  defaultCalendarMaxDate,
  type MonthCalendarDayEvent,
  type MonthCalendarDayMeta,
} from "@/components/admin/MonthCalendar";
import { formatKstYmdLong, monthBoundsKst, todayKst } from "@/lib/kst";
import {
  BUSINESS_TIME_SLOTS,
  isBusinessDayKst,
  isSlotRegistrationAllowed,
  OFFICE_HOURS,
} from "@/lib/work-schedule";
import { InlineError, adminColors } from "@/components/admin/ui";
import {
  STATUS_LABELS,
  type Miracle10Status,
} from "@/lib/miracle10-status";
import {
  ErrorState,
  RefreshingBar,
  Skeleton,
} from "@/components/admin/States";
import { invalidate, useAdminData } from "@/lib/admin-data";
import {
  CALENDAR_TTL,
  OFFICES_KEY,
  OFFICES_TTL,
  calendarFetcher,
  calendarKey,
  officesFetcher,
} from "@/lib/admin-fetchers";

const Page = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 1rem;
  }
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
`;

const Select = styled.select`
  padding: 0.45rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
  min-width: 180px;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  /* 캘린더(상세 표시)를 편집 패널보다 넓게 */
  @media (min-width: 768px) {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    align-items: start;
  }
`;

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 1.25rem;
`;

const PanelTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.75rem;
`;

const PanelSub = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 1rem;
`;

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 0.5rem;
`;

const SlotChip = styled.button<{
  $variant: "empty" | "mine" | "others" | "mixed";
  $active?: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 0.5rem 0.55rem;
  border-radius: 8px;
  border: 1.5px solid
    ${(p) =>
      p.$variant === "mine" || p.$variant === "mixed"
        ? adminColors.primary
        : p.$variant === "others"
          ? adminColors.border
          : adminColors.borderInput};
  background: ${(p) =>
    p.$variant === "mine"
      ? adminColors.primarySoft
      : p.$variant === "mixed"
        ? "#f5f6ff"
        : p.$variant === "others"
          ? adminColors.bgSubtle
          : "#fff"};
  cursor: pointer;
  text-align: left;
  min-height: 56px;

  &:hover:not(:disabled) {
    border-color: ${(p) =>
      p.$variant === "others" ? adminColors.border : adminColors.primaryHover};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const SlotHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem;
  width: 100%;
`;

const SlotTime = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: #111827;
`;

const SlotCount = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
  white-space: nowrap;
`;

const SlotWorkers = styled.div`
  font-size: 0.74rem;
  line-height: 1.4;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const WorkerLine = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const GuestLink = styled(Link)`
  font-size: 0.72rem;
  color: ${adminColors.success};
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const PendingGuestLink = styled(Link)`
  font-size: 0.72rem;
  color: ${adminColors.textMuted};
  font-weight: 500;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 2px;

  &:hover {
    color: ${adminColors.textSub};
  }
`;

const SlotEmptyLabel = styled.span`
  font-size: 0.7rem;
  color: ${adminColors.textFaint};
`;

const SlotName = styled.span<{ $isMe: boolean }>`
  color: ${(p) => (p.$isMe ? adminColors.primary : adminColors.textMuted)};
  font-weight: ${(p) => (p.$isMe ? 700 : 400)};
`;

const SlotMeta = styled.span`
  font-size: 0.72rem;
  color: ${adminColors.textFaint};
  line-height: 1.3;
`;

const BtnRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid
    ${(p) => (p.$primary ? adminColors.primary : adminColors.borderInput)};
  background: ${(p) => (p.$primary ? adminColors.primary : "#fff")};
  color: ${(p) => (p.$primary ? "#fff" : adminColors.textSub)};
  font-size: 0.85rem;
  font-weight: ${(p) => (p.$primary ? 700 : 600)};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$primary ? adminColors.primaryHover : adminColors.bgSubtle};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Hint = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0.75rem 0 0;
  line-height: 1.5;
`;

const ErrorBox = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.85rem;
  margin-bottom: 1rem;
`;

const EmptyPanel = styled.div`
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
`;

const InactiveTag = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.alertTextStrong};
  background: ${adminColors.alertSoft};
  border: 1px solid ${adminColors.alertBorder};
  border-radius: 999px;
  padding: 2px 10px;
`;

const ViewToggle = styled.div`
  display: inline-flex;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
`;

const ViewToggleBtn = styled.button<{ $active: boolean }>`
  padding: 0.45rem 0.8rem;
  border: none;
  background: ${(p) => (p.$active ? adminColors.primary : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : adminColors.textSub)};
  font-size: 0.8rem;
  font-weight: ${(p) => (p.$active ? 700 : 500)};
  cursor: pointer;

  &:not(:last-child) {
    border-right: 1px solid ${adminColors.borderInput};
  }
`;

interface Office {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

interface WorkSlotItem {
  id: number;
  adminUserId: number;
  adminUserName: string;
  adminDisplayName: string;
  officeId: number;
  date: string;
  startTime: string;
}

interface ScheduleReservation {
  id: number;
  visitDate: string;
  reservedStart: string;
  assignedAdminUserId: number | null;
  customerName: string;
  status: string;
  /** true = VERIFIED+배정(정원 차감 대상), false = 미확정(표시만) */
  confirmed: boolean;
  /** 테스트 건 — 숨기지 않고 회색·점선으로 구분 (자리를 실제로 점유 중) */
  isTest: boolean;
}

const DISPLAY_NAME_MAX_LEN = 12;

type WorkerRow = {
  adminUserId: number;
  label: string;
  isMe: boolean;
  reservation?: ScheduleReservation;
};

function operatorLabel(slot: WorkSlotItem): string {
  const dn = slot.adminDisplayName.trim();
  const un = slot.adminUserName.trim();
  if (!dn) return un || "?";
  if (un && dn.length > DISPLAY_NAME_MAX_LEN) return un;
  return dn;
}

function selfOperatorLabel(
  displayName: string | null,
  username: string | null,
): string {
  const dn = displayName?.trim() ?? "";
  const un = username?.trim() ?? "";
  if (!dn) return un || "?";
  if (un && dn.length > DISPLAY_NAME_MAX_LEN) return un;
  return dn;
}

function buildWorkerRows(
  serverSlots: WorkSlotItem[],
  draftMine: Set<string>,
  time: string,
  reservationByAdmin: Map<number, ScheduleReservation>,
  myAdminUserId: number | null,
  myDisplayName: string | null,
  myUsername: string | null,
): WorkerRow[] {
  const byAdmin = new Map<number, WorkerRow>();
  for (const s of serverSlots) {
    byAdmin.set(s.adminUserId, {
      adminUserId: s.adminUserId,
      label: operatorLabel(s),
      isMe: myAdminUserId === s.adminUserId,
      reservation: reservationByAdmin.get(s.adminUserId),
    });
  }
  if (
    draftMine.has(time) &&
    myAdminUserId != null &&
    !byAdmin.has(myAdminUserId)
  ) {
    byAdmin.set(myAdminUserId, {
      adminUserId: myAdminUserId,
      label: selfOperatorLabel(myDisplayName, myUsername),
      isMe: true,
      reservation: reservationByAdmin.get(myAdminUserId),
    });
  }
  return [...byAdmin.values()].sort((a, b) =>
    a.label.localeCompare(b.label, "ko"),
  );
}

export default function AdminSchedulePage() {
  const { adminUserId: myAdminUserId, displayName, username: myUsername } =
    useAdminSession();
  const [officeId, setOfficeId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayKst());
  const [viewMonth, setViewMonth] = useState(() => {
    const t = todayKst();
    return { y: Number(t.slice(0, 4)), m: Number(t.slice(5, 7)) - 1 };
  });
  const [mineOnlyView, setMineOnlyView] = useState(false);
  const [draftMine, setDraftMine] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = todayKst();
  const maxDate = defaultCalendarMaxDate(minDate, 12);

  // 사무실 — 5분 캐시 (상세·프리페치와 공유)
  const officesData = useAdminData<Office[]>(OFFICES_KEY, officesFetcher, {
    ttl: OFFICES_TTL,
  });
  const offices = useMemo(() => officesData.data ?? [], [officesData.data]);

  // 최초 로드 시 기본 사무실 선택 (강남 우선)
  useEffect(() => {
    if (officeId != null || offices.length === 0) return;
    const gangnam = offices.find((o) => o.code === "GANGNAM");
    setOfficeId(gangnam?.id ?? offices[0]?.id ?? null);
  }, [offices, officeId]);

  const handleMonthChange = useCallback((y: number, m: number) => {
    setViewMonth((prev) => (prev.y === y && prev.m === m ? prev : { y, m }));
  }, []);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const isScheduleDateEnabled = useCallback(
    (ymd: string) => isBusinessDayKst(ymd),
    [],
  );

  // 월 데이터 — 근무 슬롯 + 예약 묶음 fetcher, 60초 캐시 (월 왕복 시 즉시 렌더)
  const { from: monthFrom, to: monthTo } = monthBoundsKst(
    viewMonth.y,
    viewMonth.m,
  );
  const ym = `${viewMonth.y}-${String(viewMonth.m + 1).padStart(2, "0")}`;
  const monthData = useAdminData<{
    slots: WorkSlotItem[];
    reservations: ScheduleReservation[];
  }>(
    officeId != null ? calendarKey(officeId, ym) : "admin:calendar:none",
    officeId != null
      ? (calendarFetcher(officeId, monthFrom, monthTo) as () => Promise<{
          slots: WorkSlotItem[];
          reservations: ScheduleReservation[];
        }>)
      : async () => ({ slots: [], reservations: [] }),
    { ttl: CALENDAR_TTL },
  );

  const monthSlots = useMemo(
    () => monthData.data?.slots ?? [],
    [monthData.data],
  );
  const monthReservations = useMemo(
    () => monthData.data?.reservations ?? [],
    [monthData.data],
  );
  const loading = officesData.isLoading;
  const slotsLoading = monthData.isLoading;

  const daySlots = useMemo(
    () => monthSlots.filter((s) => s.date === selectedDate),
    [monthSlots, selectedDate],
  );

  const serverMySlots = useMemo(
    () =>
      daySlots.filter(
        (s) => myAdminUserId != null && s.adminUserId === myAdminUserId,
      ),
    [daySlots, myAdminUserId],
  );

  const serverMyTimes = useMemo(
    () => new Set(serverMySlots.map((s) => s.startTime)),
    [serverMySlots],
  );

  const serverMyTimesKey = useMemo(
    () =>
      [...serverMySlots.map((s) => s.startTime)].sort().join(","),
    [serverMySlots],
  );

  useEffect(() => {
    setDraftMine(
      new Set(serverMyTimesKey ? serverMyTimesKey.split(",") : []),
    );
  }, [selectedDate, officeId, serverMyTimesKey]);

  const confirmedReservations = useMemo(
    () => monthReservations.filter((r) => r.confirmed),
    [monthReservations],
  );

  const pendingReservations = useMemo(
    () => monthReservations.filter((r) => !r.confirmed),
    [monthReservations],
  );

  const dayMeta = useMemo(() => {
    if (myAdminUserId == null) return {};
    const meta: Record<string, MonthCalendarDayMeta> = {};
    const ensure = (date: string): MonthCalendarDayMeta => {
      if (!meta[date]) {
        meta[date] = {
          mySlotCount: 0,
          workerCount: 0,
          myReservationCount: 0,
          pendingReservationCount: 0,
          hideWorkerCount: mineOnlyView,
        };
      }
      return meta[date];
    };

    for (const s of monthSlots) {
      if (mineOnlyView && s.adminUserId !== myAdminUserId) continue;
      const m = ensure(s.date);
      if (s.adminUserId === myAdminUserId) {
        m.mySlotCount = (m.mySlotCount ?? 0) + 1;
      }
    }

    // 예약(확정·미확정)은 셀 안 일정 항목(dayEvents)으로 직접 표시하므로
    // 배지는 근무 정보(내 슬롯·근무자 수)만 유지.

    if (!mineOnlyView) {
      for (const d of Object.keys(meta)) {
        const users = new Set(
          monthSlots.filter((s) => s.date === d).map((s) => s.adminUserId),
        );
        meta[d].workerCount = users.size;
      }
    }

    return meta;
  }, [monthSlots, myAdminUserId, mineOnlyView]);

  // 셀 안 일정 항목 — 확정=진하게 / 미확정=회색·점선. 시간순, 동시간엔 확정 먼저.
  const dayEvents = useMemo(() => {
    const map: Record<string, MonthCalendarDayEvent[]> = {};
    const push = (r: ScheduleReservation, confirmed: boolean) => {
      (map[r.visitDate] ??= []).push({
        key: `${confirmed ? "c" : "p"}-${r.id}`,
        time: r.reservedStart,
        label: r.customerName,
        confirmed,
        isTest: r.isTest,
      });
    };
    for (const r of confirmedReservations) {
      if (mineOnlyView && r.assignedAdminUserId !== myAdminUserId) continue;
      push(r, true);
    }
    // 미확정은 배정 운영자가 없어 "내 것만" 모드에서는 숨긴다.
    if (!mineOnlyView) {
      for (const r of pendingReservations) push(r, false);
    }
    for (const d of Object.keys(map)) {
      map[d].sort(
        (a, b) =>
          a.time.localeCompare(b.time) ||
          Number(b.confirmed) - Number(a.confirmed),
      );
    }
    return map;
  }, [confirmedReservations, pendingReservations, mineOnlyView, myAdminUserId]);

  const canEditDay = isSlotRegistrationAllowed(selectedDate);

  const hasChanges = useMemo(() => {
    if (draftMine.size !== serverMyTimes.size) return true;
    for (const t of draftMine) {
      if (!serverMyTimes.has(t)) return true;
    }
    return false;
  }, [draftMine, serverMyTimes]);

  const toggleSlot = (time: string) => {
    if (!canEditDay) return;
    setDraftMine((prev) => {
      const next = new Set(prev);
      if (next.has(time)) next.delete(time);
      else next.add(time);
      return next;
    });
  };

  const registerAll = () => {
    if (!canEditDay) return;
    setDraftMine(new Set(BUSINESS_TIME_SLOTS));
  };

  const unregisterAll = () => {
    if (!canEditDay) return;
    setDraftMine(new Set());
  };

  const saveDay = async () => {
    if (officeId == null || !canEditDay || !hasChanges) return;
    setSaving(true);
    setError(null);

    const toAdd = [...draftMine].filter((t) => !serverMyTimes.has(t));
    const toRemove = serverMySlots.filter((s) => !draftMine.has(s.startTime));

    try {
      if (toAdd.length > 0) {
        const res = await fetch("/api/admin/work-slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            officeId,
            date: selectedDate,
            startTimes: toAdd,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "슬롯 등록 실패");
        }
      }

      for (const slot of toRemove) {
        const res = await fetch(`/api/admin/work-slots/${slot.id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "슬롯 삭제 실패");
        }
      }

      // 슬롯 변경 → 캘린더·내 근무 요약 캐시 무효화 (마운트된 훅이 재검증)
      invalidate("admin:calendar");
      invalidate("admin:myslots");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  };

  const slotsByTime = useMemo(() => {
    const map = new Map<string, WorkSlotItem[]>();
    for (const s of daySlots) {
      const list = map.get(s.startTime) ?? [];
      list.push(s);
      map.set(s.startTime, list);
    }
    return map;
  }, [daySlots]);

  const reservationsByTimeAdmin = useMemo(() => {
    const map = new Map<string, Map<number, ScheduleReservation>>();
    for (const r of confirmedReservations) {
      if (r.visitDate !== selectedDate || r.assignedAdminUserId == null) {
        continue;
      }
      let inner = map.get(r.reservedStart);
      if (!inner) {
        inner = new Map();
        map.set(r.reservedStart, inner);
      }
      inner.set(r.assignedAdminUserId, r);
    }
    return map;
  }, [confirmedReservations, selectedDate]);

  const pendingByTime = useMemo(() => {
    const map = new Map<string, ScheduleReservation[]>();
    for (const r of pendingReservations) {
      if (r.visitDate !== selectedDate) continue;
      const list = map.get(r.reservedStart) ?? [];
      list.push(r);
      map.set(r.reservedStart, list);
    }
    return map;
  }, [pendingReservations, selectedDate]);

  const visibleTimes = useMemo(() => {
    if (!mineOnlyView || myAdminUserId == null) return BUSINESS_TIME_SLOTS;
    return BUSINESS_TIME_SLOTS.filter((time) => {
      const all = slotsByTime.get(time) ?? [];
      const hasMySlot =
        draftMine.has(time) ||
        all.some((s) => s.adminUserId === myAdminUserId);
      const hasMyReservation =
        reservationsByTimeAdmin.get(time)?.has(myAdminUserId) ?? false;
      return hasMySlot || hasMyReservation;
    });
  }, [
    mineOnlyView,
    myAdminUserId,
    slotsByTime,
    draftMine,
    reservationsByTimeAdmin,
  ]);

  const selectedOffice = offices.find((o) => o.id === officeId);

  return (
    <Page>
      <Toolbar>
        <Label htmlFor="office">사무실</Label>
        <Select
          id="office"
          value={officeId ?? ""}
          onChange={(e) => setOfficeId(Number(e.target.value))}
          disabled={loading || offices.length === 0}
        >
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {!o.isActive ? " (비활성)" : ""}
            </option>
          ))}
        </Select>
        {selectedOffice && !selectedOffice.isActive ? (
          <InactiveTag>손님 노출 전 — 운영자 등록은 가능</InactiveTag>
        ) : null}
        <ViewToggle role="group" aria-label="표시 범위">
          <ViewToggleBtn
            type="button"
            $active={!mineOnlyView}
            onClick={() => setMineOnlyView(false)}
          >
            전체
          </ViewToggleBtn>
          <ViewToggleBtn
            type="button"
            $active={mineOnlyView}
            onClick={() => setMineOnlyView(true)}
          >
            내 근무·예약만
          </ViewToggleBtn>
        </ViewToggle>
      </Toolbar>

      {error ? <ErrorBox>{error}</ErrorBox> : null}
      {monthData.error && !monthData.data ? (
        <ErrorState
          message={
            monthData.error instanceof Error
              ? monthData.error.message
              : undefined
          }
          onRetry={monthData.refresh}
        />
      ) : null}
      <RefreshingBar
        active={monthData.isValidating && monthData.data != null}
      />

      <Layout>
        <Card>
          <PanelTitle>일정 캘린더 (KST)</PanelTitle>
          <PanelSub>
            신청 일정을 한눈에 — 초록 굵게 = 확정 · 회색 점선 = 미확정 ·
            넘치면 +N건. 날짜를 누르면 오른쪽에서 그날 근무·예약을 관리합니다.
          </PanelSub>
          <MonthCalendar
            valueDate={selectedDate}
            minDate={minDate}
            maxDate={maxDate}
            dayMeta={dayMeta}
            dayEvents={dayEvents}
            isDateEnabled={isScheduleDateEnabled}
            onSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />
          {slotsLoading ? (
            <div style={{ marginTop: "0.75rem" }}>
              <Skeleton variant="table" count={2} />
            </div>
          ) : null}
        </Card>

        <Card>
          <PanelTitle>
            {formatKstYmdLong(selectedDate) ?? selectedDate}
            {selectedOffice ? ` · ${selectedOffice.name}` : ""}
          </PanelTitle>
          <PanelSub>
            영업 {OFFICE_HOURS.start}–{OFFICE_HOURS.end} · 30분 단위 — 시간
            칩을 눌러 내 근무를 등록/해제합니다.
          </PanelSub>

          {!isBusinessDayKst(selectedDate) ? (
            <EmptyPanel>휴무일(일요일)입니다.</EmptyPanel>
          ) : (
            <>
              <SlotGrid>
                {visibleTimes.map((time) => {
                  const all = slotsByTime.get(time) ?? [];
                  const reservationByAdmin =
                    reservationsByTimeAdmin.get(time) ??
                    new Map<number, ScheduleReservation>();
                  const rows = buildWorkerRows(
                    all,
                    draftMine,
                    time,
                    reservationByAdmin,
                    myAdminUserId,
                    displayName,
                    myUsername,
                  );
                  const visibleRows = mineOnlyView
                    ? rows.filter((r) => r.isMe)
                    : rows;
                  const pendingItems = mineOnlyView
                    ? []
                    : (pendingByTime.get(time) ?? []);
                  const mine = draftMine.has(time);
                  const others = all.filter(
                    (s) => s.adminUserId !== myAdminUserId,
                  );
                  const confirmedCount = visibleRows.filter(
                    (r) => r.reservation,
                  ).length;
                  const variant =
                    mine && others.length > 0
                      ? "mixed"
                      : mine
                        ? "mine"
                        : others.length > 0
                          ? "others"
                          : "empty";

                  return (
                    <SlotChip
                      key={time}
                      type="button"
                      $variant={variant}
                      disabled={
                        !canEditDay &&
                        visibleRows.length === 0 &&
                        pendingItems.length === 0
                      }
                      onClick={() => {
                        if (!canEditDay) return;
                        toggleSlot(time);
                      }}
                    >
                      <SlotHeader>
                        <SlotTime>{time}</SlotTime>
                        {visibleRows.length > 0 ? (
                          <SlotCount>
                            {confirmedCount}/{visibleRows.length}
                          </SlotCount>
                        ) : null}
                      </SlotHeader>
                      <SlotWorkers>
                        {visibleRows.length === 0 &&
                        pendingItems.length === 0 &&
                        canEditDay ? (
                          <SlotMeta>클릭하여 등록</SlotMeta>
                        ) : (
                          visibleRows.map((row) => (
                            <WorkerLine key={`${time}-${row.adminUserId}`}>
                              <SlotName $isMe={row.isMe}>{row.label}</SlotName>
                              {row.reservation ? (
                                <GuestLink
                                  href={`/admin/miracle10/${row.reservation.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={
                                    row.reservation.isTest
                                      ? { color: adminColors.textFaint }
                                      : undefined
                                  }
                                >
                                  → {row.reservation.customerName} 확정
                                  {row.reservation.isTest ? " [TEST]" : ""}
                                </GuestLink>
                              ) : (
                                <SlotEmptyLabel>예약 없음</SlotEmptyLabel>
                              )}
                            </WorkerLine>
                          ))
                        )}
                        {pendingItems.map((r) => (
                          <WorkerLine key={`${time}-pending-${r.id}`}>
                            <PendingGuestLink
                              href={`/admin/miracle10/${r.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              ⋯ {r.customerName} 미확정
                              {STATUS_LABELS[r.status as Miracle10Status]
                                ? `·${STATUS_LABELS[r.status as Miracle10Status]}`
                                : ""}
                              {r.isTest ? " [TEST]" : ""}
                            </PendingGuestLink>
                          </WorkerLine>
                        ))}
                      </SlotWorkers>
                    </SlotChip>
                  );
                })}
              </SlotGrid>

              {!canEditDay ? (
                <Hint>과거 날짜는 조회만 가능합니다.</Hint>
              ) : (
                <>
                  <BtnRow>
                    <Button type="button" onClick={registerAll} disabled={saving}>
                      전체 등록
                    </Button>
                    <Button type="button" onClick={unregisterAll} disabled={saving}>
                      내 슬롯 전체 해제
                    </Button>
                    <Button
                      type="button"
                      $primary
                      onClick={saveDay}
                      disabled={saving || !hasChanges}
                    >
                      {saving ? "저장 중…" : "저장"}
                    </Button>
                  </BtnRow>
                  {error ? <InlineError role="alert">{error}</InlineError> : null}
                </>
              )}

              <Hint>
                파란 테두리·굵게 = 본인 근무 · 초록 링크 = 확정 손님 · 회색
                점선 = 미확정 신청(자리 차감 없음) · 칩 우측 = 확정/근무자 수
              </Hint>
            </>
          )}
        </Card>
      </Layout>
    </Page>
  );
}
