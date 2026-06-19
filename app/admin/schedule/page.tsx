"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useAdminSession } from "@/components/admin/AdminSessionContext";
import MonthCalendar, {
  defaultCalendarMaxDate,
  type MonthCalendarDayMeta,
} from "@/components/admin/MonthCalendar";
import { formatKstYmdLong, monthBoundsKst, todayKst } from "@/lib/kst";
import {
  BUSINESS_TIME_SLOTS,
  isBusinessDayKst,
  isSlotRegistrationAllowed,
  OFFICE_HOURS,
} from "@/lib/work-schedule";

const Page = styled.div`
  max-width: 960px;
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
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
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
      p.$variant === "mine"
        ? "#7c3aed"
        : p.$variant === "mixed"
          ? "#7c3aed"
          : p.$variant === "others"
            ? "#e5e7eb"
            : "#d1d5db"};
  background: ${(p) =>
    p.$variant === "mine"
      ? "#ede9fe"
      : p.$variant === "mixed"
        ? "#f5f3ff"
        : p.$variant === "others"
          ? "#f9fafb"
          : "#fff"};
  cursor: pointer;
  text-align: left;
  min-height: 56px;

  &:hover:not(:disabled) {
    border-color: ${(p) =>
      p.$variant === "others" ? "#e5e7eb" : "#6d28d9"};
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
  font-size: 0.62rem;
  font-weight: 600;
  color: #9ca3af;
  white-space: nowrap;
`;

const SlotWorkers = styled.div`
  font-size: 0.68rem;
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
  font-size: 0.64rem;
  color: #0f766e;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const SlotEmptyLabel = styled.span`
  font-size: 0.62rem;
  color: #9ca3af;
`;

const SlotName = styled.span<{ $isMe: boolean }>`
  color: ${(p) => (p.$isMe ? "#6d28d9" : "#6b7280")};
  font-weight: ${(p) => (p.$isMe ? 700 : 400)};
`;

const SlotMeta = styled.span`
  font-size: 0.68rem;
  color: #9ca3af;
  line-height: 1.3;
`;

const BtnRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$primary ? "#4338ca" : "#d1d5db")};
  background: ${(p) => (p.$primary ? "#4338ca" : "#fff")};
  color: ${(p) => (p.$primary ? "#fff" : "#374151")};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    opacity: 0.92;
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
  font-size: 0.7rem;
  color: #9ca3af;
  margin-left: 4px;
`;

const ViewToggle = styled.div`
  display: inline-flex;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
`;

const ViewToggleBtn = styled.button<{ $active: boolean }>`
  padding: 0.4rem 0.75rem;
  border: none;
  background: ${(p) => (p.$active ? "#4338ca" : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : "#4b5563")};
  font-size: 0.8rem;
  font-weight: ${(p) => (p.$active ? 700 : 500)};
  cursor: pointer;

  &:not(:last-child) {
    border-right: 1px solid #d1d5db;
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
  assignedAdminUserId: number;
  customerName: string;
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
  const router = useRouter();
  const { adminUserId: myAdminUserId, displayName, username: myUsername } =
    useAdminSession();
  const [offices, setOffices] = useState<Office[]>([]);
  const [officeId, setOfficeId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayKst());
  const [viewMonth, setViewMonth] = useState(() => {
    const t = todayKst();
    return { y: Number(t.slice(0, 4)), m: Number(t.slice(5, 7)) - 1 };
  });
  const [monthSlots, setMonthSlots] = useState<WorkSlotItem[]>([]);
  const [monthReservations, setMonthReservations] = useState<
    ScheduleReservation[]
  >([]);
  const [mineOnlyView, setMineOnlyView] = useState(false);
  const [draftMine, setDraftMine] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = todayKst();
  const maxDate = defaultCalendarMaxDate(minDate, 12);

  useEffect(() => {
    fetch("/api/admin/offices")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error);
        const list = json.offices as Office[];
        setOffices(list);
        const gangnam = list.find((o) => o.code === "GANGNAM");
        setOfficeId(gangnam?.id ?? list[0]?.id ?? null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "사무실 목록 오류");
      })
      .finally(() => setLoading(false));
  }, [router]);

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

  const fetchMonthData = useCallback(async () => {
    if (officeId == null) return;
    setSlotsLoading(true);
    setError(null);
    const { from, to } = monthBoundsKst(viewMonth.y, viewMonth.m);
    try {
      const [slotsRes, resRes] = await Promise.all([
        fetch(`/api/admin/work-slots?officeId=${officeId}&from=${from}&to=${to}`),
        fetch(
          `/api/admin/schedule/reservations?officeId=${officeId}&from=${from}&to=${to}`,
        ),
      ]);
      if (slotsRes.status === 401 || resRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      const slotsJson = await slotsRes.json();
      const resJson = await resRes.json();
      if (!slotsRes.ok || !slotsJson.ok) {
        throw new Error(slotsJson.error || "슬롯을 불러오지 못했습니다.");
      }
      if (!resRes.ok || !resJson.ok) {
        throw new Error(resJson.error || "확정 예약을 불러오지 못했습니다.");
      }
      setMonthSlots(slotsJson.items as WorkSlotItem[]);
      setMonthReservations(resJson.items as ScheduleReservation[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터 조회 오류");
    } finally {
      setSlotsLoading(false);
    }
  }, [officeId, viewMonth.y, viewMonth.m, router]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

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

  const dayMeta = useMemo(() => {
    if (myAdminUserId == null) return {};
    const meta: Record<string, MonthCalendarDayMeta> = {};

    for (const s of monthSlots) {
      if (mineOnlyView && s.adminUserId !== myAdminUserId) continue;
      if (!meta[s.date]) {
        meta[s.date] = {
          mySlotCount: 0,
          workerCount: 0,
          myReservationCount: 0,
          hideWorkerCount: mineOnlyView,
        };
      }
      if (s.adminUserId === myAdminUserId) {
        meta[s.date].mySlotCount = (meta[s.date].mySlotCount ?? 0) + 1;
      }
    }

    for (const r of monthReservations) {
      if (mineOnlyView && r.assignedAdminUserId !== myAdminUserId) continue;
      if (!meta[r.visitDate]) {
        meta[r.visitDate] = {
          mySlotCount: 0,
          workerCount: 0,
          myReservationCount: 0,
          hideWorkerCount: mineOnlyView,
        };
      }
      if (r.assignedAdminUserId === myAdminUserId) {
        meta[r.visitDate].myReservationCount =
          (meta[r.visitDate].myReservationCount ?? 0) + 1;
      }
    }

    if (!mineOnlyView) {
      for (const d of Object.keys(meta)) {
        const users = new Set(
          monthSlots.filter((s) => s.date === d).map((s) => s.adminUserId),
        );
        meta[d].workerCount = users.size;
      }
    }

    return meta;
  }, [monthSlots, monthReservations, myAdminUserId, mineOnlyView]);

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

      await fetchMonthData();
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
    for (const r of monthReservations) {
      if (r.visitDate !== selectedDate) continue;
      let inner = map.get(r.reservedStart);
      if (!inner) {
        inner = new Map();
        map.set(r.reservedStart, inner);
      }
      inner.set(r.assignedAdminUserId, r);
    }
    return map;
  }, [monthReservations, selectedDate]);

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

      <Layout>
        <Card>
          <PanelTitle>캘린더 (KST)</PanelTitle>
          <PanelSub>날짜를 선택하면 슬롯을 편집합니다.</PanelSub>
          <MonthCalendar
            valueDate={selectedDate}
            minDate={minDate}
            maxDate={maxDate}
            dayMeta={dayMeta}
            isDateEnabled={isScheduleDateEnabled}
            onSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />
          {slotsLoading ? (
            <Hint>슬롯 불러오는 중…</Hint>
          ) : null}
        </Card>

        <Card>
          <PanelTitle>
            {formatKstYmdLong(selectedDate) ?? selectedDate}
            {selectedOffice ? ` · ${selectedOffice.name}` : ""}
          </PanelTitle>
          <PanelSub>
            영업 {OFFICE_HOURS.start}–{OFFICE_HOURS.end} · 30분 단위
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
                      disabled={!canEditDay && visibleRows.length === 0}
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
                        {visibleRows.length === 0 && canEditDay ? (
                          <SlotMeta>클릭하여 등록</SlotMeta>
                        ) : (
                          visibleRows.map((row) => (
                            <WorkerLine key={`${time}-${row.adminUserId}`}>
                              <SlotName $isMe={row.isMe}>{row.label}</SlotName>
                              {row.reservation ? (
                                <GuestLink
                                  href={`/admin/miracle10/${row.reservation.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  → {row.reservation.customerName} 확정
                                </GuestLink>
                              ) : (
                                <SlotEmptyLabel>예약 없음</SlotEmptyLabel>
                              )}
                            </WorkerLine>
                          ))
                        )}
                      </SlotWorkers>
                    </SlotChip>
                  );
                })}
              </SlotGrid>

              {!canEditDay ? (
                <Hint>과거 날짜는 조회만 가능합니다.</Hint>
              ) : (
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
              )}

              <Hint>
                보라색·굵게 = 본인 근무 · 초록 링크 = 확정 손님 · 칩 우측 =
                확정/근무자 수
              </Hint>
            </>
          )}
        </Card>
      </Layout>
    </Page>
  );
}
