"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import styled from "styled-components";
import Miracle10ValueSection from "./Miracle10ValueSection";
import Apply10MoResult from "./Apply10MoResult";

// 신규 참여자는 강남 사무실에서 면대면 인증을 거친다(폼 안내문에서 사용).
const OFFICE_LOCATION_LABEL = "강남 사무실";
const OFFICE_HOURS_LABEL = "월·수·금 13:00–17:00";

const QTY_CHIPS = [10, 20, 30] as const;
type QtyChip = (typeof QTY_CHIPS)[number] | "custom";

const VISIT_TYPES = [
  { value: "RESERVED", label: "직접 방문 (예약일 지정)" },
  { value: "WALK_IN", label: "예약 없이 방문 (예약자 우선 · 대기 가능)" },
] as const;

const TIME_SLOTS = [
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
] as const;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

interface FormState {
  name: string;
  contact: string;
  qtyChip: QtyChip;
  customQty: string;
  visitType: string;
  visitDate: string;
  visitTimeSlot: string;
  isExistingSbmb: boolean;
  memo: string;
  agreePrivacy: boolean;
  agreeRisk: boolean;
  agreeP2p: boolean;
}

const INITIAL_FORM: FormState = {
  name: "",
  contact: "",
  qtyChip: 10,
  customQty: "",
  visitType: "RESERVED",
  visitDate: "",
  visitTimeSlot: "",
  isExistingSbmb: false,
  memo: "",
  agreePrivacy: false,
  agreeRisk: false,
  agreeP2p: false,
};

interface SubmissionPayload {
  name: string;
  contact: string;
  quantity: number;
  visitType: string;
  visitDate: string | null;
  visitTimeSlot: string | null;
  isExistingSbmb: boolean;
  memo: string | null;
  agreePrivacy: boolean;
  agreeRisk: boolean;
  agreeP2p: boolean;
}

// 전화번호 자동 하이픈 — 숫자만 받아 11자리까지 3-4-4 포맷으로 표시/저장.
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

// --- 날짜 헬퍼 (로컬 타임존 기준 — apply API 검증과 일치) ---
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfToday(): Date {
  return startOfDay(new Date());
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseLocal(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function formatDisplayDate(s: string): string {
  const d = parseLocal(s);
  if (!d) return "날짜 선택";
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

interface Apply10MoModalProps {
  open: boolean;
  onClose: () => void;
}

function getQuantity(form: FormState): number | null {
  if (form.qtyChip === "custom") {
    const n = parseInt(form.customQty, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return form.qtyChip;
}

// 신청 접수 — 공개 API(POST /api/miracle10/apply) 호출. 성공 시 접수 id 반환.
interface SubmitResult {
  id: number;
  applicationNo: string | null;
}

async function submitApplication(
  payload: SubmissionPayload,
): Promise<SubmitResult> {
  const res = await fetch("/api/miracle10/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name,
      contact: payload.contact,
      quantity: payload.quantity,
      visitType: payload.visitType,
      visitDate: payload.visitDate,
      visitTimeSlot: payload.visitTimeSlot,
      isSbmbMember: payload.isExistingSbmb,
      memo: payload.memo,
      agreePrivacy: payload.agreePrivacy,
      agreeRisk: payload.agreeRisk,
      agreeP2p: payload.agreeP2p,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "신청 접수에 실패했습니다.");
  }
  return {
    id: data.id as number,
    applicationNo:
      typeof data.applicationNo === "string" ? data.applicationNo : null,
  };
}

export default function Apply10MoModal({ open, onClose }: Apply10MoModalProps) {
  const [step, setStep] = useState<"value" | "form" | "done">("value");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState<SubmissionPayload | null>(null);
  const [applicationNo, setApplicationNo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStep("value");
      setForm(INITIAL_FORM);
      setSubmitted(null);
      setApplicationNo(null);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  // 모달 열림/단계 전환 시 본문 스크롤을 항상 최상단으로 리셋.
  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: 0 });
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;

      const name = form.name.trim();
      const contact = form.contact.trim();
      const qty = getQuantity(form);

      if (!name) {
        setError("이름/닉네임을 입력해 주세요.");
        return;
      }
      if (!contact) {
        setError("연락처(카카오톡 ID 또는 전화번호)를 입력해 주세요.");
        return;
      }
      if (qty == null || qty % 10 !== 0) {
        setError("신청 수량은 10모 단위로 입력해 주세요.");
        return;
      }
      if (!form.visitType) {
        setError("방문 방식을 선택해 주세요.");
        return;
      }
      if (form.visitType === "RESERVED") {
        if (!form.visitDate) {
          setError("예약 희망일을 선택해 주세요.");
          return;
        }
        if (!form.visitTimeSlot) {
          setError("방문 시간대를 선택해 주세요.");
          return;
        }
      }
      if (!form.agreePrivacy) {
        setError("개인정보 수집·이용 동의가 필요합니다.");
        return;
      }

      setError(null);
      setSubmitting(true);

      const payload: SubmissionPayload = {
        name,
        contact,
        quantity: qty,
        visitType: form.visitType,
        visitDate: form.visitDate.trim() || null,
        visitTimeSlot: form.visitTimeSlot.trim() || null,
        isExistingSbmb: form.isExistingSbmb,
        memo: form.memo.trim() || null,
        agreePrivacy: form.agreePrivacy,
        // 위험·P2P 고지는 안내문(FootNotes)으로 대체. API 호환을 위해 동의로 전송.
        agreeRisk: true,
        agreeP2p: true,
      };

      try {
        const result = await submitApplication(payload);
        setSubmitted(payload);
        setApplicationNo(result.applicationNo);
        setStep("done");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "신청 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [form, submitting],
  );

  if (!open) return null;

  return (
    <Overlay onClick={onClose} role="dialog" aria-modal="true">
      <Container onClick={(e) => e.stopPropagation()}>
        <CloseButton type="button" aria-label="닫기" onClick={onClose}>
          ×
        </CloseButton>
        <Body ref={bodyRef} $flush={step === "value" || step === "done"}>
          {step === "value" ? (
            <Miracle10ValueSection onStart={() => setStep("form")} />
          ) : step === "form" ? (
            <FormView
              form={form}
              setForm={setForm}
              submitting={submitting}
              error={error}
              onSubmit={handleSubmit}
            />
          ) : submitted ? (
            <Apply10MoResult
              submitted={{
                quantity: submitted.quantity,
                contact: submitted.contact,
                visitDate: submitted.visitDate,
              }}
              applicationNo={applicationNo}
              onRestart={() => {
                setForm(INITIAL_FORM);
                setSubmitted(null);
                setApplicationNo(null);
                setError(null);
                setStep("form");
              }}
            />
          ) : null}
        </Body>
      </Container>
    </Overlay>
  );
}

interface FormViewProps {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  submitting: boolean;
  error: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

interface EstimateResult {
  pricePerMoKrw: number;
  totalKrw: number;
  asOf: string;
}

interface InlineCalendarProps {
  valueDate: string;
  min: Date;
  max: Date;
  onSelect: (dateStr: string) => void;
}

// 인라인 월별 달력 — min~max 범위만 클릭 가능, 타이핑 입력 없음.
function InlineCalendar({
  valueDate,
  min,
  max,
  onSelect,
}: InlineCalendarProps) {
  const base = parseLocal(valueDate) ?? min;
  const [view, setView] = useState<{ y: number; m: number }>({
    y: base.getFullYear(),
    m: base.getMonth(),
  });

  const minMonthIdx = min.getFullYear() * 12 + min.getMonth();
  const maxMonthIdx = max.getFullYear() * 12 + max.getMonth();
  const viewMonthIdx = view.y * 12 + view.m;
  const canPrev = viewMonthIdx > minMonthIdx;
  const canNext = viewMonthIdx < maxMonthIdx;

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const idx = v.y * 12 + v.m + delta;
      return { y: Math.floor(idx / 12), m: ((idx % 12) + 12) % 12 };
    });
  };

  const startWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const minTime = startOfDay(min).getTime();
  const maxTime = startOfDay(max).getTime();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(view.y, view.m, d));

  const inRange = (d: Date) => {
    const t = startOfDay(d).getTime();
    return t >= minTime && t <= maxTime;
  };

  return (
    <CalendarBox>
      <CalendarHeader>
        <CalNavButton
          type="button"
          disabled={!canPrev}
          onClick={() => canPrev && shiftMonth(-1)}
          aria-label="이전 달"
        >
          ‹
        </CalNavButton>
        <CalTitle>
          {view.y}년 {view.m + 1}월
        </CalTitle>
        <CalNavButton
          type="button"
          disabled={!canNext}
          onClick={() => canNext && shiftMonth(1)}
          aria-label="다음 달"
        >
          ›
        </CalNavButton>
      </CalendarHeader>
      <CalWeekRow>
        {WEEKDAYS.map((w, i) => (
          <CalWeekday key={w} $sun={i === 0} $sat={i === 6}>
            {w}
          </CalWeekday>
        ))}
      </CalWeekRow>
      <CalGrid>
        {cells.map((d, idx) =>
          d ? (
            <CalDay
              key={idx}
              type="button"
              disabled={!inRange(d)}
              $selected={valueDate === fmtLocal(d)}
              $sun={d.getDay() === 0}
              $sat={d.getDay() === 6}
              onClick={() => inRange(d) && onSelect(fmtLocal(d))}
            >
              {d.getDate()}
            </CalDay>
          ) : (
            <CalEmpty key={idx} aria-hidden="true" />
          ),
        )}
      </CalGrid>
    </CalendarBox>
  );
}

function FormView({
  form,
  setForm,
  submitting,
  error,
  onSubmit,
}: FormViewProps) {
  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const qty = getQuantity(form);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [estLoading, setEstLoading] = useState(false);
  const [estError, setEstError] = useState<string | null>(null);

  const minDate = addDays(startOfToday(), 1);
  const maxDate = addDays(startOfToday(), 28);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calendarOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!datePickerRef.current?.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [calendarOpen]);

  useEffect(() => {
    if (qty == null || qty <= 0 || qty % 10 !== 0) {
      setEstimate(null);
      setEstError(null);
      setEstLoading(false);
      return;
    }
    let cancelled = false;
    setEstLoading(true);
    setEstError(null);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/miracle10/estimate?quantity=${qty}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "예상 단가를 불러오지 못했습니다.");
        }
        setEstimate({
          pricePerMoKrw: data.pricePerMoKrw,
          totalKrw: data.totalKrw,
          asOf: data.asOf,
        });
      } catch (e) {
        if (cancelled) return;
        setEstimate(null);
        setEstError(
          e instanceof Error ? e.message : "예상 단가를 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) setEstLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [qty]);

  return (
    <FormWrapper onSubmit={onSubmit} noValidate>
      <FormHeader>
        <FormHeaderTitle>10모의 기적 참여 지원</FormHeaderTitle>
        <FormHeaderSubtitle>
          구매부터 전송까지, 어렵지 않게 도와드려요.
        </FormHeaderSubtitle>
      </FormHeader>

      <InfoBox>
        <InfoBoxTitle>이렇게 도와드려요</InfoBoxTitle>
        <InfoBoxList>
          <li>USDT 구매와 해외거래소 송금을 함께 도와드립니다.</li>
          <li>WBMB로의 스왑 · 필요한 가스비 준비를 도와드립니다.</li>
          <li>종이지갑 발급과 안전한 BMB 전송을 도와드립니다.</li>
          <li>트러스트월렛 사용법을 옆에서 안내해 드립니다.</li>
        </InfoBoxList>
      </InfoBox>

      <StepsPreview>
        <StepItem>
          <StepNo>1</StepNo>
          <StepLabel>신청</StepLabel>
        </StepItem>
        <StepArrow aria-hidden="true">›</StepArrow>
        <StepItem>
          <StepNo>2</StepNo>
          <StepLabel>
            방문·인증
            <br />({OFFICE_LOCATION_LABEL})
          </StepLabel>
        </StepItem>
        <StepArrow aria-hidden="true">›</StepArrow>
        <StepItem>
          <StepNo>3</StepNo>
          <StepLabel>수령</StepLabel>
        </StepItem>
      </StepsPreview>

      <FieldGroup>
        <Field>
          <Label htmlFor="apply-name">
            이름 / 닉네임 <Required>*</Required>
          </Label>
          <Input
            id="apply-name"
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="실명 또는 닉네임"
            autoComplete="name"
            required
          />
        </Field>

        <Field>
          <Label htmlFor="apply-contact">
            연락처 <Required>*</Required>
          </Label>
          <Input
            id="apply-contact"
            type="tel"
            inputMode="numeric"
            value={form.contact}
            onChange={(e) =>
              updateField("contact", formatPhone(e.target.value))
            }
            placeholder="010-0000-0000"
            maxLength={13}
            autoComplete="tel"
            required
          />
        </Field>

        <Field>
          <Label>
            신청 수량 (10모 단위) <Required>*</Required>
          </Label>
          <ChipRow>
            {QTY_CHIPS.map((n) => (
              <Chip
                key={n}
                type="button"
                $active={form.qtyChip === n}
                onClick={() => updateField("qtyChip", n)}
              >
                {n}모
              </Chip>
            ))}
            <Chip
              type="button"
              $active={form.qtyChip === "custom"}
              onClick={() => updateField("qtyChip", "custom")}
            >
              직접 입력
            </Chip>
          </ChipRow>
          {form.qtyChip === "custom" && (
            <Input
              type="number"
              min={10}
              step={10}
              value={form.customQty}
              onChange={(e) => updateField("customQty", e.target.value)}
              placeholder="모 수량 입력 (10 단위, 예: 50)"
              style={{ marginTop: 8 }}
            />
          )}
          <EstimateBox aria-live="polite">
            {estLoading ? (
              <EstimateMuted>예상 단가 계산 중...</EstimateMuted>
            ) : estError ? (
              <EstimateMuted>
                예상 단가를 잠시 후 다시 확인해 주세요.
              </EstimateMuted>
            ) : estimate ? (
              <>
                <EstimateRow>
                  <EstimateLabel>예상 단가 (1모)</EstimateLabel>
                  <EstimateValue>
                    {estimate.pricePerMoKrw.toLocaleString("ko-KR")}원
                  </EstimateValue>
                </EstimateRow>
                <EstimateRow>
                  <EstimateLabel>예상 총액</EstimateLabel>
                  <EstimateValue $strong>
                    {estimate.totalKrw.toLocaleString("ko-KR")}원
                  </EstimateValue>
                </EstimateRow>
                <EstimateNote>
                  {new Date(estimate.asOf).toLocaleString("ko-KR")} 기준 · 실제
                  단가는 <EstimateNoteStrong>방문 시점에 확정</EstimateNoteStrong>
                  됩니다.
                </EstimateNote>
              </>
            ) : (
              <EstimateMuted>
                수량을 선택하면 예상 단가를 보여드려요.
              </EstimateMuted>
            )}
          </EstimateBox>
        </Field>

        <Field>
          <Label>
            방문 방식 <Required>*</Required>
          </Label>
          <VisitOptionGroup role="radiogroup" aria-label="방문 방식">
            {VISIT_TYPES.map((v) => (
              <VisitOption
                key={v.value}
                type="button"
                role="radio"
                aria-checked={form.visitType === v.value}
                $active={form.visitType === v.value}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    visitType: v.value,
                    visitDate: v.value === "RESERVED" ? prev.visitDate : "",
                    visitTimeSlot:
                      v.value === "RESERVED" ? prev.visitTimeSlot : "",
                  }))
                }
              >
                {v.label}
              </VisitOption>
            ))}
          </VisitOptionGroup>
        </Field>

        {form.visitType === "RESERVED" ? (
          <>
            <Field>
              <Label>
                예약 희망일 <Required>*</Required>
              </Label>
              <DatePickerWrap ref={datePickerRef}>
                <DateSelectButton
                  type="button"
                  $hasValue={!!form.visitDate}
                  onClick={() => setCalendarOpen((o) => !o)}
                >
                  <span>
                    {form.visitDate
                      ? formatDisplayDate(form.visitDate)
                      : "날짜 선택"}
                  </span>
                  <DateChevron $open={calendarOpen} aria-hidden="true">
                    ▾
                  </DateChevron>
                </DateSelectButton>
                {calendarOpen && (
                  <InlineCalendar
                    valueDate={form.visitDate}
                    min={minDate}
                    max={maxDate}
                    onSelect={(s) => {
                      updateField("visitDate", s);
                      setCalendarOpen(false);
                    }}
                  />
                )}
              </DatePickerWrap>
            </Field>

            {form.visitDate && (
              <Field>
                <Label>
                  방문 시간대 <Required>*</Required>
                </Label>
                <ChipRow>
                  {TIME_SLOTS.map((ts) => (
                    <Chip
                      key={ts}
                      type="button"
                      $active={form.visitTimeSlot === ts}
                      onClick={() =>
                        updateField(
                          "visitTimeSlot",
                          form.visitTimeSlot === ts ? "" : ts,
                        )
                      }
                    >
                      {ts}
                    </Chip>
                  ))}
                </ChipRow>
                <TimeAdjustNote>시간은 조율할게요.</TimeAdjustNote>
              </Field>
            )}
          </>
        ) : (
          <WalkInNote>
            예약 없이 방문하실 수 있어요. 다만 예약자분이 우선이라, 시간이
            겹치면 잠시 기다리셔야 할 수 있어요.
          </WalkInNote>
        )}

        <CheckboxField>
          <input
            type="checkbox"
            id="apply-sbmb"
            checked={form.isExistingSbmb}
            onChange={(e) => updateField("isExistingSbmb", e.target.checked)}
          />
          <CheckboxLabel htmlFor="apply-sbmb">
            기존 SBMB 참여자입니다 (면대면 인증 면제 · 운영자 확인)
          </CheckboxLabel>
        </CheckboxField>

        <Field>
          <Label htmlFor="apply-memo">
            메모 <Optional>(선택)</Optional>
          </Label>
          <TextArea
            id="apply-memo"
            value={form.memo}
            onChange={(e) => updateField("memo", e.target.value)}
            placeholder="예: 종이지갑 이미 있어요 / 트러스트월렛 배우고 싶어요"
            rows={3}
          />
        </Field>

        <AgreeGroup>
          <CheckboxField>
            <input
              type="checkbox"
              id="agree-privacy"
              checked={form.agreePrivacy}
              onChange={(e) => updateField("agreePrivacy", e.target.checked)}
            />
            <CheckboxLabel htmlFor="agree-privacy">
              개인정보 수집·이용에 동의합니다 (신청 처리 목적).{" "}
              <Required>*</Required>
            </CheckboxLabel>
          </CheckboxField>
        </AgreeGroup>
      </FieldGroup>

      <FootNotes>
        <li>가격은 신청 시점 기준으로 안내드립니다.</li>
        <li>
          신규 참여자는 {OFFICE_LOCATION_LABEL}에서 면대면 인증을 거칩니다.
        </li>
        <li>
          예약 없이 방문 가능하지만 신청자분께 우선 안내드립니다 (상주:{" "}
          {OFFICE_HOURS_LABEL}).
        </li>
        <li>MOVN 교환은 추후 별도로 안내드립니다.</li>
      </FootNotes>

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      <SubmitButton type="submit" disabled={submitting}>
        {submitting ? "접수 중..." : "참여 신청하기"}
      </SubmitButton>
    </FormWrapper>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 28, 0.55);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;

  @media (min-width: 768px) {
    padding: 32px 16px;
  }
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 모바일 홈바/주소창에서도 잘리지 않도록 dvh 기준 + 절대 상한. */
  max-height: min(90dvh, 760px);

  @media (min-width: 768px) {
    max-width: 720px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(15, 15, 28, 0.35);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(31, 41, 55, 0.06);
  color: #1f2937;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(31, 41, 55, 0.12);
  }

  @media (min-width: 768px) {
    top: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
`;

const Body = styled.div<{ $flush?: boolean }>`
  width: 100%;
  flex: 1;
  min-height: 0;

  ${(p) =>
    p.$flush
      ? `
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
  `
      : `
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 24px 20px max(32px, env(safe-area-inset-bottom));

    @media (min-width: 768px) {
      padding: 32px 32px 40px;
    }
  `}
`;

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 32px;
`;

const FormHeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.3;
  letter-spacing: -0.01em;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const FormHeaderSubtitle = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.55;

  @media (min-width: 768px) {
    font-size: 0.95rem;
  }
`;

const InfoBox = styled.section`
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const InfoBoxTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: #312e81;
`;

const InfoBoxList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;

  li {
    font-size: 0.85rem;
    color: #4338ca;
    line-height: 1.55;
  }
`;

const StepsPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  background: #fafaff;
  border: 1px solid #f0eef9;
  border-radius: 12px;
  padding: 12px 10px;

  @media (min-width: 768px) {
    padding: 14px 18px;
    gap: 8px;
  }
`;

const StepItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const StepNo = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #434392;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
`;

const StepLabel = styled.span`
  font-size: 0.78rem;
  color: #1f2937;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;

  @media (min-width: 768px) {
    font-size: 0.85rem;
  }
`;

const StepArrow = styled.span`
  color: #9ca3af;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 0 0 auto;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
`;

const Required = styled.span`
  color: #dc2626;
  font-weight: 700;
`;

const Optional = styled.span`
  color: #9ca3af;
  font-weight: 500;
  font-size: 0.78rem;
  margin-left: 4px;
`;

const inputBase = `
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #111827;
  background: #ffffff;
  outline: none;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;

  &:focus {
    border-color: #434392;
    box-shadow: 0 0 0 3px rgba(67, 67, 146, 0.15);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Input = styled.input`
  ${inputBase}
`;

const TextArea = styled.textarea`
  ${inputBase}
  resize: vertical;
  min-height: 84px;
  font-family: inherit;
`;

const VisitOptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VisitOption = styled.button<{ $active: boolean }>`
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1.5px solid ${(p) => (p.$active ? "#434392" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#f5f3ff" : "#ffffff")};
  color: ${(p) => (p.$active ? "#312e81" : "#374151")};
  font-size: 0.9rem;
  font-weight: ${(p) => (p.$active ? 700 : 500)};
  cursor: pointer;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "";
    flex: 0 0 16px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid ${(p) => (p.$active ? "#434392" : "#cbd5e1")};
    background: ${(p) =>
      p.$active ? "radial-gradient(#434392 0 5px, #fff 6px 16px)" : "#fff"};
  }

  &:hover {
    border-color: #434392;
  }
`;

const EstimateBox = styled.div`
  margin-top: 10px;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EstimateRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
`;

const EstimateLabel = styled.span`
  font-size: 0.82rem;
  color: #0f766e;
  font-weight: 600;
`;

const EstimateValue = styled.span<{ $strong?: boolean }>`
  font-size: ${(p) => (p.$strong ? "1.05rem" : "0.95rem")};
  font-weight: ${(p) => (p.$strong ? 800 : 700)};
  color: #0d9488;
`;

const EstimateNote = styled.p`
  margin: 2px 0 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0f766e;
  line-height: 1.5;
`;

const EstimateNoteStrong = styled.strong`
  font-weight: 700;
  color: #c0392b;
`;

const EstimateMuted = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
`;

const WalkInNote = styled.p`
  margin: 0;
  padding: 10px 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  font-size: 0.82rem;
  color: #92400e;
  line-height: 1.55;
`;

const DatePickerWrap = styled.div`
  position: relative;
  width: 100%;
`;

const DateSelectButton = styled.button<{ $hasValue: boolean }>`
  ${inputBase}
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  color: ${(p) => (p.$hasValue ? "#111827" : "#9ca3af")};

  &:hover {
    border-color: #434392;
  }
`;

const DateChevron = styled.span<{ $open: boolean }>`
  flex: 0 0 auto;
  color: #6b7280;
  font-size: 0.8rem;
  transition: transform 0.15s ease;
  transform: ${(p) => (p.$open ? "rotate(180deg)" : "rotate(0deg)")};
`;

const CalendarBox = styled.div`
  margin-top: 8px;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(15, 15, 28, 0.12);
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const CalNavButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #434392;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: #f5f3ff;
    border-color: #434392;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const CalTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
`;

const CalWeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
`;

const CalWeekday = styled.span<{ $sun?: boolean; $sat?: boolean }>`
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 4px 0;
  color: ${(p) => (p.$sun ? "#dc2626" : p.$sat ? "#2563eb" : "#6b7280")};
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const CalEmpty = styled.div`
  aspect-ratio: 1 / 1;
`;

const CalDay = styled.button<{
  $selected: boolean;
  $sun?: boolean;
  $sat?: boolean;
}>`
  aspect-ratio: 1 / 1;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: ${(p) => (p.$selected ? 800 : 500)};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => (p.$selected ? "#434392" : "transparent")};
  color: ${(p) =>
    p.$selected
      ? "#ffffff"
      : p.$sun
        ? "#dc2626"
        : p.$sat
          ? "#2563eb"
          : "#1f2937"};
  transition:
    background-color 0.12s ease,
    color 0.12s ease;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$selected ? "#363689" : "#f5f3ff")};
  }

  &:disabled {
    color: #d1d5db;
    cursor: not-allowed;
  }
`;

const TimeAdjustNote = styled.p`
  margin: 8px 0 0;
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.45;
`;

const AgreeGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? "#434392" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#434392" : "#ffffff")};
  color: ${(p) => (p.$active ? "#ffffff" : "#374151")};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;

  &:hover {
    border-color: #434392;
  }
`;

const CheckboxField = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;

  input[type="checkbox"] {
    margin-top: 3px;
    width: 16px;
    height: 16px;
    accent-color: #434392;
    cursor: pointer;
  }
`;

const CheckboxLabel = styled.label`
  font-size: 0.85rem;
  color: #374151;
  line-height: 1.45;
  cursor: pointer;
`;

const FootNotes = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;

  li {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.5;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #dc2626;
  font-weight: 600;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px 16px;
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  background: #434392;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.12s ease;

  &:hover:not(:disabled) {
    background: #363689;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

