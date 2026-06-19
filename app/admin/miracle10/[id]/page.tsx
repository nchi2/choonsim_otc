"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import MonthCalendar, {
  defaultCalendarMaxDate,
} from "@/components/admin/MonthCalendar";
import {
  MIRACLE10_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  formatAdminVisitTypeLabel,
  type Miracle10Status,
} from "@/lib/miracle10-status";
import {
  formatKstYmdLong,
  monthBoundsKst,
  todayKst,
} from "@/lib/kst";
import { isBusinessDayKst } from "@/lib/work-schedule";

const Page = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 1rem;
  }
`;

const BackLink = styled(Link)`
  font-size: 0.875rem;
  color: #6b7280;
  text-decoration: none;
  &:hover {
    color: #111827;
  }
`;

const Title = styled.h1`
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0.75rem 0 1.25rem;
  color: #111827;
`;

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.75rem;
`;

const SectionSub = styled.p`
  font-size: 0.78rem;
  color: #6b7280;
  margin: 0 0 0.75rem;
  line-height: 1.45;
`;

const Field = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-top: 1px solid #f5f5f5;
  font-size: 0.9rem;
  &:first-of-type {
    border-top: none;
  }
`;

const Key = styled.span`
  color: #6b7280;
`;

const Val = styled.span`
  color: #111827;
  font-weight: 500;
  word-break: break-all;
`;

const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: ${(p) => p.$color};
`;

const StatusButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StatusButton = styled.button<{ $active: boolean; $color: string }>`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1.5px solid ${(p) => p.$color};
  background: ${(p) => (p.$active ? p.$color : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : p.$color)};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Empty = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

const DatePickerWrap = styled.div`
  position: relative;
  margin-bottom: 0.75rem;
`;

const DateSelectButton = styled.button<{ $hasValue: boolean }>`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: ${(p) => (p.$hasValue ? "#111827" : "#9ca3af")};
`;

const CalendarDropdown = styled.div`
  margin-top: 0.5rem;
`;

const CalendarHint = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
`;

const SlotGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const SlotChip = styled.button<{ $active: boolean; $booked?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 84px;
  padding: 0.45rem 0.65rem;
  border-radius: 8px;
  border: 1.5px solid
    ${(p) =>
      p.$active ? "#4338ca" : p.$booked ? "#e5e7eb" : "#d1d5db"};
  background: ${(p) =>
    p.$active ? "#4338ca" : p.$booked ? "#f9fafb" : "#fff"};
  color: ${(p) => (p.$active ? "#fff" : "#374151")};
  cursor: ${(p) => (p.$booked ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.$booked ? 0.65 : 1)};
`;

const SlotChipTime = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
`;

const SlotChipMeta = styled.span`
  font-size: 0.68rem;
`;

const SaveScheduleBtn = styled.button`
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: #4338ca;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const ScheduleError = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: #dc2626;
`;

const OfficeSelect = styled.select`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
`;

interface AvailableSlot {
  startTime: string;
  capacity: number;
  taken: number;
  remaining: number;
  available: boolean;
}

interface OfficeOption {
  id: number;
  name: string;
  isActive: boolean;
}

interface Detail {
  id: number;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: string | null;
  lastEditedByName: string | null;
  lastEditedAt: string | null;
  status: Miracle10Status;
  quantity: number;
  asset: string | null;
  settle: string;
  contactTimePref: string | null;
  visitType: string | null;
  visitDate: string | null;
  reservedStart: string | null;
  visitTimeSlot: string | null;
  officeId: number | null;
  needUsdt: string | null;
  needBmb: string | null;
  needFaceAuth: string | null;
  isSbmbMember: boolean;
  memo: string | null;
  agreePrivacy: boolean;
  customer: {
    id: number;
    name: string;
    contact: string;
    verifiedAt: string | null;
    createdAt: string;
  };
}

export default function Miracle10DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/miracle10/${id}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "불러오지 못했습니다.");
      }
      setData(json.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (status: Miracle10Status) => {
    if (!data || data.status === status || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/miracle10/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "상태 변경 실패");
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Page><Empty>불러오는 중...</Empty></Page>;
  if (error) return <Page><Empty style={{ color: "#dc2626" }}>{error}</Empty></Page>;
  if (!data) return null;

  const canEditSchedule =
    (data.visitType === "RESERVED" || data.visitType === "WALK_IN") &&
    (data.status === "PENDING" || data.status === "VERIFIED");

  const showScheduleEditor =
    canEditSchedule &&
    (data.visitType === "WALK_IN" || data.officeId != null);

  const visitTypeLabel = formatAdminVisitTypeLabel(data.visitType, {
    officeId: data.officeId,
    visitDate: data.visitDate,
    reservedStart: data.reservedStart,
  });

  return (
    <Page>
      <BackLink href="/admin/miracle10">← 목록으로</BackLink>
      <Title>
        신청 #{data.id}{" "}
        <Badge $color={STATUS_COLORS[data.status]}>
          {STATUS_LABELS[data.status]}
        </Badge>
      </Title>

      <Card>
        <SectionTitle>상태 변경</SectionTitle>
        <StatusButtons>
          {MIRACLE10_STATUSES.map((s) => (
            <StatusButton
              key={s}
              $active={data.status === s}
              $color={STATUS_COLORS[s]}
              disabled={saving || data.status === s}
              onClick={() => changeStatus(s)}
            >
              {STATUS_LABELS[s]}
            </StatusButton>
          ))}
        </StatusButtons>
      </Card>

      <Card>
        <SectionTitle>신청인</SectionTitle>
        <Field>
          <Key>이름</Key>
          <Val>{data.customer.name}</Val>
        </Field>
        <Field>
          <Key>연락처</Key>
          <Val>{data.customer.contact}</Val>
        </Field>
        <Field>
          <Key>SBMB 회원</Key>
          <Val>{data.isSbmbMember ? "예" : "아니오"}</Val>
        </Field>
        <Field>
          <Key>면대면 인증</Key>
          <Val>
            {data.customer.verifiedAt
              ? new Date(data.customer.verifiedAt).toLocaleString("ko-KR")
              : "미완료"}
          </Val>
        </Field>
      </Card>

      <Card>
        <SectionTitle>신청 내용</SectionTitle>
        <Field>
          <Key>수량</Key>
          <Val>{data.quantity}모 ({data.asset ?? "BMB"})</Val>
        </Field>
        <Field>
          <Key>연락 선호시간</Key>
          <Val>{data.contactTimePref || "-"}</Val>
        </Field>
        <Field>
          <Key>방문 방식</Key>
          <Val>{visitTypeLabel}</Val>
        </Field>
        {showScheduleEditor ? (
          <VisitScheduleEditor
            orderId={data.id}
            visitType={data.visitType}
            officeId={data.officeId}
            status={data.status}
            visitDate={data.visitDate}
            reservedStart={data.reservedStart}
            onSaved={load}
          />
        ) : (
          <>
            <Field>
              <Key>방문 희망일</Key>
              <Val>
                {data.visitDate
                  ? (formatKstYmdLong(data.visitDate) ?? data.visitDate)
                  : "-"}
              </Val>
            </Field>
            <Field>
              <Key>방문 시간</Key>
              <Val>
                {data.reservedStart
                  ? `${data.reservedStart} 시작`
                  : data.visitTimeSlot || "-"}
              </Val>
            </Field>
          </>
        )}
        <Field>
          <Key>메모</Key>
          <Val>{data.memo || "-"}</Val>
        </Field>
      </Card>

      <Card>
        <SectionTitle>사전 파악</SectionTitle>
        <Field>
          <Key>USDT 필요</Key>
          <Val>{data.needUsdt || "-"}</Val>
        </Field>
        <Field>
          <Key>BMB 필요</Key>
          <Val>{data.needBmb || "-"}</Val>
        </Field>
        <Field>
          <Key>면대면 인증 필요</Key>
          <Val>{data.needFaceAuth || "-"}</Val>
        </Field>
      </Card>

      <Card>
        <SectionTitle>동의 / 접수</SectionTitle>
        <Field>
          <Key>개인정보 동의</Key>
          <Val>{data.agreePrivacy ? "동의" : "미동의"}</Val>
        </Field>
        <Field>
          <Key>접수일시</Key>
          <Val>{new Date(data.createdAt).toLocaleString("ko-KR")}</Val>
        </Field>
        <Field>
          <Key>최근 변경</Key>
          <Val>{new Date(data.updatedAt).toLocaleString("ko-KR")}</Val>
        </Field>
        <Field>
          <Key>최종 수정</Key>
          <Val>
            {data.lastEditedByName && data.lastEditedAt
              ? `${data.lastEditedByName} · ${new Date(data.lastEditedAt).toLocaleString("ko-KR")}`
              : "-"}
          </Val>
        </Field>
      </Card>
    </Page>
  );
}

interface VisitScheduleEditorProps {
  orderId: number;
  visitType: string | null;
  officeId: number | null;
  status: Miracle10Status;
  visitDate: string | null;
  reservedStart: string | null;
  onSaved: () => void;
}

function VisitScheduleEditor({
  orderId,
  visitType,
  officeId,
  status,
  visitDate,
  reservedStart,
  onSaved,
}: VisitScheduleEditorProps) {
  const allowOfficePick = visitType === "WALK_IN";
  const minDate = todayKst();
  const [draftOfficeId, setDraftOfficeId] = useState<number | null>(officeId);
  const [offices, setOffices] = useState<OfficeOption[]>([]);
  const [officesLoading, setOfficesLoading] = useState(allowOfficePick);
  const [draftDate, setDraftDate] = useState(visitDate ?? "");
  const [draftStart, setDraftStart] = useState(reservedStart ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = visitDate && visitDate >= minDate ? visitDate : minDate;
    return { y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 };
  });
  const [slotOpenDates, setSlotOpenDates] = useState<Set<string>>(
    () => new Set(),
  );
  const [daySlots, setDaySlots] = useState<AvailableSlot[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    setDraftOfficeId(officeId);
    setDraftDate(visitDate ?? "");
    setDraftStart(reservedStart ?? "");
  }, [officeId, visitDate, reservedStart]);

  useEffect(() => {
    if (!allowOfficePick) return;
    let cancelled = false;
    setOfficesLoading(true);
    fetch("/api/admin/offices")
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) throw new Error(json.error);
        setOffices(json.offices as OfficeOption[]);
      })
      .catch(() => {
        if (!cancelled) setOffices([]);
      })
      .finally(() => {
        if (!cancelled) setOfficesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [allowOfficePick]);

  const activeOfficeId = allowOfficePick ? draftOfficeId : officeId;

  useEffect(() => {
    if (activeOfficeId == null) {
      setSlotOpenDates(new Set());
      return;
    }
    let cancelled = false;
    setDaysLoading(true);
    const { from, to } = monthBoundsKst(viewMonth.y, viewMonth.m);
    fetch(
      `/api/miracle10/available-slots?officeId=${activeOfficeId}&from=${from}&to=${to}`,
    )
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) throw new Error(json.error);
        const dates = new Set<string>(
          (
            json.days as { date: string; slotCount: number }[]
          )
            .filter((d) => d.slotCount > 0)
            .map((d) => d.date),
        );
        if (visitDate) dates.add(visitDate);
        setSlotOpenDates(dates);
      })
      .catch(() => {
        if (!cancelled) setSlotOpenDates(visitDate ? new Set([visitDate]) : new Set());
      })
      .finally(() => {
        if (!cancelled) setDaysLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeOfficeId, viewMonth.y, viewMonth.m, visitDate]);

  useEffect(() => {
    if (!draftDate || activeOfficeId == null) {
      setDaySlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetch(
      `/api/miracle10/available-slots?officeId=${activeOfficeId}&date=${draftDate}`,
    )
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) throw new Error(json.error);
        setDaySlots(json.slots as AvailableSlot[]);
      })
      .catch(() => {
        if (!cancelled) setDaySlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draftDate, activeOfficeId]);

  const handleMonthChange = useCallback((y: number, m: number) => {
    setViewMonth((prev) => (prev.y === y && prev.m === m ? prev : { y, m }));
  }, []);

  const isDateEnabled = useCallback(
    (ymd: string) => isBusinessDayKst(ymd) && slotOpenDates.has(ymd),
    [slotOpenDates],
  );

  const hasChanges =
    draftDate !== (visitDate ?? "") ||
    draftStart !== (reservedStart ?? "") ||
    (allowOfficePick && draftOfficeId !== officeId);

  const canSave =
    hasChanges &&
    activeOfficeId != null &&
    draftDate !== "" &&
    draftStart !== "";

  const saveSchedule = async () => {
    if (!canSave || saving || activeOfficeId == null) return;
    setSaving(true);
    setScheduleError(null);
    try {
      const payload: {
        visitDate: string;
        reservedStart: string;
        officeId?: number;
      } = {
        visitDate: draftDate,
        reservedStart: draftStart,
      };
      if (allowOfficePick || draftOfficeId !== officeId) {
        payload.officeId = activeOfficeId;
      }
      const res = await fetch(`/api/admin/miracle10/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "일정 저장 실패");
      }
      onSaved();
    } catch (e) {
      setScheduleError(
        e instanceof Error ? e.message : "일정 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ gridColumn: "1 / -1", paddingTop: "0.25rem" }}>
      <SectionTitle style={{ marginTop: "0.5rem" }}>방문 일정</SectionTitle>
      <SectionSub>
        {visitType === "WALK_IN"
          ? "워크인 건 — 사무실·날짜·시간을 지정하면 정식 예약과 동일하게 캘린더·정원에 반영됩니다."
          : status === "VERIFIED"
            ? "일정 확정 건 — 변경 시 기존 자리를 반환하고 새 시간에 재배정합니다."
            : "접수 건 — 방문 희망일·시간을 수정할 수 있습니다."}
      </SectionSub>

      {allowOfficePick ? (
        <>
          <SectionSub style={{ marginBottom: "0.35rem" }}>사무실</SectionSub>
          <OfficeSelect
            value={draftOfficeId ?? ""}
            disabled={officesLoading || saving}
            onChange={(e) => {
              const next = Number(e.target.value);
              setDraftOfficeId(Number.isInteger(next) && next > 0 ? next : null);
              setDraftDate("");
              setDraftStart("");
              setCalendarOpen(false);
            }}
          >
            <option value="">
              {officesLoading ? "불러오는 중…" : "사무실 선택"}
            </option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {!o.isActive ? " (비활성)" : ""}
              </option>
            ))}
          </OfficeSelect>
        </>
      ) : null}

      {activeOfficeId == null ? (
        <CalendarHint>사무실을 먼저 선택해 주세요.</CalendarHint>
      ) : (
        <>
      <DatePickerWrap>
        <DateSelectButton
          type="button"
          $hasValue={!!draftDate}
          onClick={() => setCalendarOpen((o) => !o)}
        >
          <span>
            {draftDate
              ? (formatKstYmdLong(draftDate) ?? draftDate)
              : "날짜 선택"}
          </span>
          <span aria-hidden="true">{calendarOpen ? "▴" : "▾"}</span>
        </DateSelectButton>
        {calendarOpen ? (
          <CalendarDropdown>
            <MonthCalendar
              valueDate={draftDate || minDate}
              minDate={minDate}
              maxDate={defaultCalendarMaxDate(minDate, 3)}
              isDateEnabled={isDateEnabled}
              onSelect={(s) => {
                setDraftDate(s);
                setDraftStart("");
                setCalendarOpen(false);
              }}
              onMonthChange={handleMonthChange}
            />
            {daysLoading ? (
              <CalendarHint>근무일 조회 중…</CalendarHint>
            ) : slotOpenDates.size === 0 ? (
              <CalendarHint>이 달에 운영 슬롯이 없습니다.</CalendarHint>
            ) : null}
          </CalendarDropdown>
        ) : null}
      </DatePickerWrap>

      {draftDate ? (
        slotsLoading ? (
          <CalendarHint>시간 조회 중…</CalendarHint>
        ) : daySlots.length === 0 ? (
          <CalendarHint>예약 가능한 시간이 없습니다.</CalendarHint>
        ) : (
          <SlotGrid>
            {daySlots.map((slot) => {
              const isCurrent =
                slot.startTime === reservedStart && draftDate === visitDate;
              const selectable = slot.available || isCurrent;
              const active = draftStart === slot.startTime;
              return (
                <SlotChip
                  key={slot.startTime}
                  type="button"
                  $active={active}
                  $booked={!selectable}
                  disabled={!selectable}
                  onClick={() => {
                    if (!selectable) return;
                    setDraftStart(active ? "" : slot.startTime);
                  }}
                >
                  <SlotChipTime>{slot.startTime}</SlotChipTime>
                  <SlotChipMeta>
                    {!selectable
                      ? "예약됨"
                      : `남음 ${slot.remaining}자리`}
                  </SlotChipMeta>
                </SlotChip>
              );
            })}
          </SlotGrid>
        )
      ) : null}

      <SaveScheduleBtn type="button" disabled={!canSave || saving} onClick={saveSchedule}>
        {saving ? "저장 중…" : "일정 저장"}
      </SaveScheduleBtn>
        </>
      )}
      {scheduleError ? <ScheduleError role="alert">{scheduleError}</ScheduleError> : null}
    </div>
  );
}
