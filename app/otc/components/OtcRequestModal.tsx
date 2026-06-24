"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import MonthCalendar, {
  defaultCalendarMaxDate,
} from "@/components/admin/MonthCalendar";
import { formatPhone } from "@/lib/format-phone";
import {
  addDaysKstYmd,
  formatKstYmdLong,
  monthBoundsKst,
  todayKst,
} from "@/lib/kst";
import { isBusinessDayKst } from "@/lib/work-schedule";
import {
  Chip,
  ChipRow,
  DateSelectButton,
  DoneBox,
  DoneText,
  DoneTitle,
  ErrorText,
  Field,
  FieldGroup,
  FormHeader,
  FormHeaderSubtitle,
  FormHeaderTitle,
  FormWrapper,
  GuideBox,
  HeaderDivider,
  HintText,
  Input,
  Label,
  ModalBody,
  ModalCloseButton,
  ModalContainer,
  ModalOverlay,
  OfficeSelect,
  Optional,
  PriceDisplay,
  PriceStepperRow,
  Required,
  SecondaryButton,
  SlotChip,
  SlotChipMeta,
  SlotChipTime,
  SlotGrid,
  StepperBtn,
  SubmitButton,
} from "./otcModalStyles";

interface BankAccountFormFields {
  bankName: string;
  accountNo: string;
  accountHolder: string;
}

function BankAccountInputs({
  idPrefix,
  values,
  onChange,
}: {
  idPrefix: string;
  values: BankAccountFormFields;
  onChange: (patch: Partial<BankAccountFormFields>) => void;
}) {
  return (
    <>
      <Field>
        <Label>계좌정보 입력</Label>
        <HintText>
          은행 / 계좌번호 / 예금주(본인) — 선택 입력 (나중에 안내 가능)
        </HintText>
      </Field>
      <Field>
        <Label htmlFor={`${idPrefix}-bank`}>은행</Label>
        <Input
          id={`${idPrefix}-bank`}
          value={values.bankName}
          onChange={(e) => onChange({ bankName: e.target.value })}
          placeholder="예: 국민은행"
          autoComplete="off"
        />
      </Field>
      <Field>
        <Label htmlFor={`${idPrefix}-account`}>계좌번호</Label>
        <Input
          id={`${idPrefix}-account`}
          inputMode="numeric"
          value={values.accountNo}
          onChange={(e) =>
            onChange({ accountNo: e.target.value.replace(/[^\d-]/g, "") })
          }
          placeholder="숫자만 입력"
          autoComplete="off"
        />
      </Field>
      <Field>
        <Label htmlFor={`${idPrefix}-holder`}>예금주(본인)</Label>
        <Input
          id={`${idPrefix}-holder`}
          value={values.accountHolder}
          onChange={(e) => onChange({ accountHolder: e.target.value })}
          placeholder="본인 실명"
          autoComplete="name"
        />
      </Field>
    </>
  );
}

const QTY_CHIPS = [10, 20, 30] as const;
type QtyChip = (typeof QTY_CHIPS)[number] | "custom";
const MIN_QUANTITY = 10;
const PRICE_STEP = 10_000;

export type OtcRequestSide = "BUY" | "SELL";

interface AvailableSlot {
  startTime: string;
  capacity: number;
  taken: number;
  remaining: number;
  available: boolean;
}

interface PublicOffice {
  id: number;
  code: string;
  name: string;
}

interface BuyFormState extends BankAccountFormFields {
  name: string;
  contact: string;
  qtyChip: QtyChip;
  customQty: string;
  priceUndecided: boolean;
  desiredPrice: number | null;
  receiveAddress: string;
  scheduleSkipped: boolean;
  officeId: number | null;
  visitDate: string;
  reservedStart: string;
}

interface SellFormState extends BankAccountFormFields {
  name: string;
  contact: string;
  qtyChip: QtyChip;
  customQty: string;
  priceUndecided: boolean;
  desiredPrice: number | null;
  senderAddress: string;
}

const INITIAL_BUY: BuyFormState = {
  name: "",
  contact: "",
  qtyChip: 10,
  customQty: "",
  priceUndecided: false,
  desiredPrice: null,
  receiveAddress: "",
  bankName: "",
  accountNo: "",
  accountHolder: "",
  scheduleSkipped: false,
  officeId: null,
  visitDate: "",
  reservedStart: "",
};

const INITIAL_SELL: SellFormState = {
  name: "",
  contact: "",
  qtyChip: 10,
  customQty: "",
  priceUndecided: false,
  desiredPrice: null,
  senderAddress: "",
  bankName: "",
  accountNo: "",
  accountHolder: "",
};

function getQuantity(qtyChip: QtyChip, customQty: string): number | null {
  if (qtyChip === "custom") {
    const n = parseInt(customQty, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return qtyChip;
}

function roundPriceBase(krw: number): number {
  return Math.round(krw / PRICE_STEP) * PRICE_STEP;
}

interface OtcRequestModalProps {
  open: boolean;
  side: OtcRequestSide;
  onClose: () => void;
}

export default function OtcRequestModal({
  open,
  side,
  onClose,
}: OtcRequestModalProps) {
  const [buyStep, setBuyStep] = useState<"input" | "schedule" | "done">(
    "input",
  );
  const [sellStep, setSellStep] = useState<"input" | "done">("input");
  const [buyForm, setBuyForm] = useState<BuyFormState>(INITIAL_BUY);
  const [sellForm, setSellForm] = useState<SellFormState>(INITIAL_SELL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bmbKrw, setBmbKrw] = useState<number | null>(null);
  const [offices, setOffices] = useState<PublicOffice[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const t = addDaysKstYmd(todayKst(), 1);
    return { y: Number(t.slice(0, 4)), m: Number(t.slice(5, 7)) - 1 };
  });
  const [slotOpenDates, setSlotOpenDates] = useState<Set<string>>(
    () => new Set(),
  );
  const [daySlots, setDaySlots] = useState<AvailableSlot[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const minVisitDate = addDaysKstYmd(todayKst(), 1);

  useEffect(() => {
    if (!open) return;
    setBuyStep("input");
    setSellStep("input");
    setBuyForm(INITIAL_BUY);
    setSellForm(INITIAL_SELL);
    setSubmitting(false);
    setError(null);
    setCalendarOpen(false);
    fetch("/api/market-prices")
      .then(async (res) => {
        const json = await res.json();
        if (json.lbankKrwPrice != null) {
          const base = roundPriceBase(json.lbankKrwPrice);
          setBmbKrw(base);
          setBuyForm((prev) => ({
            ...prev,
            desiredPrice: prev.desiredPrice ?? base,
          }));
          setSellForm((prev) => ({
            ...prev,
            desiredPrice: prev.desiredPrice ?? base,
          }));
        }
      })
      .catch(() => {});
    fetch("/api/miracle10/offices")
      .then(async (res) => {
        const json = await res.json();
        if (res.ok && json.ok) {
          const list = json.offices as PublicOffice[];
          setOffices(list);
          const gangnam = list.find((o) => o.code === "GANGNAM");
          setBuyForm((prev) => ({
            ...prev,
            officeId: gangnam?.id ?? list[0]?.id ?? null,
          }));
        }
      })
      .catch(() => {});
  }, [open, side]);

  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: 0 });
  }, [open, buyStep, sellStep, side]);

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

  const officeId = buyForm.officeId;

  useEffect(() => {
    if (!open || side !== "BUY" || officeId == null) return;
    let cancelled = false;
    setDaysLoading(true);
    const { from, to } = monthBoundsKst(viewMonth.y, viewMonth.m);
    fetch(
      `/api/miracle10/available-slots?officeId=${officeId}&from=${from}&to=${to}`,
    )
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) throw new Error(json.error);
        const dates = new Set<string>(
          (json.days as { date: string; slotCount: number }[])
            .filter((d) => d.slotCount > 0)
            .map((d) => d.date),
        );
        setSlotOpenDates(dates);
      })
      .catch(() => {
        if (!cancelled) setSlotOpenDates(new Set());
      })
      .finally(() => {
        if (!cancelled) setDaysLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, side, officeId, viewMonth.y, viewMonth.m]);

  useEffect(() => {
    if (!open || side !== "BUY" || !buyForm.visitDate || officeId == null) {
      setDaySlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetch(
      `/api/miracle10/available-slots?officeId=${officeId}&date=${buyForm.visitDate}`,
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
  }, [open, side, buyForm.visitDate, officeId]);

  const handleMonthChange = useCallback((y: number, m: number) => {
    setViewMonth((prev) => (prev.y === y && prev.m === m ? prev : { y, m }));
  }, []);

  const isDateEnabled = useCallback(
    (ymd: string) => isBusinessDayKst(ymd) && slotOpenDates.has(ymd),
    [slotOpenDates],
  );

  const validateBuyInput = useCallback((): string | null => {
    if (!buyForm.name.trim()) return "이름/닉네임을 입력해 주세요.";
    if (!buyForm.contact.trim()) return "연락처를 입력해 주세요.";
    const qty = getQuantity(buyForm.qtyChip, buyForm.customQty);
    if (qty == null || qty < MIN_QUANTITY) {
      return `최소 거래 단위는 ${MIN_QUANTITY}개입니다.`;
    }
    return null;
  }, [buyForm]);

  const submitBuy = useCallback(
    async (skipSchedule: boolean) => {
      const err = validateBuyInput();
      if (err) {
        setError(err);
        return;
      }
      const quantity = getQuantity(buyForm.qtyChip, buyForm.customQty)!;
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/otc-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            side: "BUY",
            name: buyForm.name.trim(),
            contact: buyForm.contact.trim(),
            quantity,
            desiredPrice: buyForm.priceUndecided ? null : buyForm.desiredPrice,
            receiveAddress: buyForm.receiveAddress.trim() || null,
            buyerBankName: buyForm.bankName.trim() || null,
            buyerAccountNo: buyForm.accountNo.trim() || null,
            buyerAccountHolder: buyForm.accountHolder.trim() || null,
            officeId: skipSchedule ? null : buyForm.officeId,
            visitDate: skipSchedule ? null : buyForm.visitDate || null,
            reservedStart: skipSchedule ? null : buyForm.reservedStart || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "신청 접수에 실패했습니다.");
        }
        setBuyStep("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "신청 접수에 실패했습니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [buyForm, validateBuyInput],
  );

  const submitSell = useCallback(async () => {
    const name = sellForm.name.trim();
    const contact = sellForm.contact.trim();
    const quantity = getQuantity(sellForm.qtyChip, sellForm.customQty);

    if (!name) {
      setError("이름/닉네임을 입력해 주세요.");
      return;
    }
    if (!contact) {
      setError("연락처를 입력해 주세요.");
      return;
    }
    if (quantity == null || quantity < MIN_QUANTITY) {
      setError(`최소 거래 단위는 ${MIN_QUANTITY}개입니다.`);
      return;
    }
    if (
      !sellForm.priceUndecided &&
      (sellForm.desiredPrice == null || sellForm.desiredPrice <= 0)
    ) {
      setError("희망 가격을 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/otc-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side: "SELL",
          name,
          contact,
          quantity,
          desiredPrice: sellForm.priceUndecided ? null : sellForm.desiredPrice,
          senderAddress: sellForm.senderAddress.trim() || null,
          sellerBankName: sellForm.bankName.trim() || null,
          sellerAccountNo: sellForm.accountNo.trim() || null,
          sellerAccountHolder: sellForm.accountHolder.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "신청 접수에 실패했습니다.");
      }
      setSellStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청 접수에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [sellForm]);

  if (!open) return null;

  const tone = side === "SELL" ? "sell" : "buy";

  return (
    <ModalOverlay onClick={onClose} role="dialog" aria-modal="true">
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalCloseButton type="button" aria-label="닫기" onClick={onClose}>
          ×
        </ModalCloseButton>
        <ModalBody ref={bodyRef}>
          {side === "BUY" ? (
            buyStep === "done" ? (
              <DoneBox>
                <DoneTitle>신청이 접수되었습니다</DoneTitle>
                <DoneText>
                  운영자가 연락드려 가격·일정을 확정합니다 (평일 13–17시).
                </DoneText>
                <SubmitButton type="button" $tone="buy" onClick={onClose}>
                  닫기
                </SubmitButton>
              </DoneBox>
            ) : buyStep === "input" ? (
              <FormWrapper
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  const err = validateBuyInput();
                  if (err) {
                    setError(err);
                    return;
                  }
                  setError(null);
                  setBuyStep("schedule");
                }}
                noValidate
              >
                <FormHeader>
                  <FormHeaderTitle>BMB 구매 신청</FormHeaderTitle>
                  <FormHeaderSubtitle>
                    수량·희망 가격을 입력한 뒤 방문 일정을 선택합니다.
                  </FormHeaderSubtitle>
                </FormHeader>
                <HeaderDivider />
                <FieldGroup>
                  <Field>
                    <Label htmlFor="buy-name">
                      성함 <Required>*</Required>
                    </Label>
                    <Input
                      id="buy-name"
                      value={buyForm.name}
                      onChange={(e) =>
                        setBuyForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="실명 또는 닉네임"
                      required
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="buy-contact">
                      연락처 <Required>*</Required>
                    </Label>
                    <Input
                      id="buy-contact"
                      type="tel"
                      value={buyForm.contact}
                      onChange={(e) =>
                        setBuyForm((p) => ({
                          ...p,
                          contact: formatPhone(e.target.value),
                        }))
                      }
                      placeholder="010-0000-0000"
                      maxLength={13}
                    />
                  </Field>
                  <Field>
                    <Label>
                      수량 <Required>*</Required>
                    </Label>
                    <ChipRow>
                      {QTY_CHIPS.map((n) => (
                        <Chip
                          key={n}
                          type="button"
                          $active={buyForm.qtyChip === n}
                          onClick={() =>
                            setBuyForm((p) => ({ ...p, qtyChip: n }))
                          }
                        >
                          {n}개
                        </Chip>
                      ))}
                      <Chip
                        type="button"
                        $active={buyForm.qtyChip === "custom"}
                        onClick={() =>
                          setBuyForm((p) => ({ ...p, qtyChip: "custom" }))
                        }
                      >
                        직접 입력
                      </Chip>
                    </ChipRow>
                    {buyForm.qtyChip === "custom" && (
                      <Input
                        type="number"
                        min={MIN_QUANTITY}
                        value={buyForm.customQty}
                        onChange={(e) =>
                          setBuyForm((p) => ({
                            ...p,
                            customQty: e.target.value,
                          }))
                        }
                        placeholder={`최소 ${MIN_QUANTITY}개`}
                        style={{ marginTop: 8 }}
                      />
                    )}
                    <HintText>최소 거래 단위 {MIN_QUANTITY}개</HintText>
                  </Field>
                  <Field>
                    <Label>희망 가격대</Label>
                    {bmbKrw != null ? (
                      <PriceStepperRow>
                        <StepperBtn
                          type="button"
                          disabled={buyForm.priceUndecided}
                          onClick={() =>
                            setBuyForm((p) => ({
                              ...p,
                              priceUndecided: false,
                              desiredPrice:
                                (p.desiredPrice ?? bmbKrw) - PRICE_STEP,
                            }))
                          }
                        >
                          −1만
                        </StepperBtn>
                        <PriceDisplay>
                          {buyForm.priceUndecided
                            ? "미정"
                            : `${(buyForm.desiredPrice ?? bmbKrw).toLocaleString("ko-KR")}원`}
                        </PriceDisplay>
                        <StepperBtn
                          type="button"
                          disabled={buyForm.priceUndecided}
                          onClick={() =>
                            setBuyForm((p) => ({
                              ...p,
                              priceUndecided: false,
                              desiredPrice:
                                (p.desiredPrice ?? bmbKrw) + PRICE_STEP,
                            }))
                          }
                        >
                          +1만
                        </StepperBtn>
                      </PriceStepperRow>
                    ) : (
                      <HintText>시세 불러오는 중…</HintText>
                    )}
                    <ChipRow style={{ marginTop: 8 }}>
                      <Chip
                        type="button"
                        $active={buyForm.priceUndecided}
                        onClick={() =>
                          setBuyForm((p) => ({
                            ...p,
                            priceUndecided: true,
                          }))
                        }
                      >
                        가격 미정
                      </Chip>
                      {bmbKrw != null ? (
                        <Chip
                          type="button"
                          $active={
                            !buyForm.priceUndecided &&
                            buyForm.desiredPrice === bmbKrw
                          }
                          onClick={() =>
                            setBuyForm((p) => ({
                              ...p,
                              priceUndecided: false,
                              desiredPrice: bmbKrw,
                            }))
                          }
                        >
                          현재가 기준
                        </Chip>
                      ) : null}
                    </ChipRow>
                  </Field>
                  <Field>
                    <Label htmlFor="buy-addr">
                      받을 모빅 공개주소 <Optional>(선택)</Optional>
                    </Label>
                    <Input
                      id="buy-addr"
                      value={buyForm.receiveAddress}
                      onChange={(e) =>
                        setBuyForm((p) => ({
                          ...p,
                          receiveAddress: e.target.value,
                        }))
                      }
                      placeholder="0x… (없으면 운영자 안내)"
                    />
                  </Field>
                  <BankAccountInputs
                    idPrefix="buy"
                    values={{
                      bankName: buyForm.bankName,
                      accountNo: buyForm.accountNo,
                      accountHolder: buyForm.accountHolder,
                    }}
                    onChange={(patch) =>
                      setBuyForm((p) => ({ ...p, ...patch }))
                    }
                  />
                </FieldGroup>
                {error ? <ErrorText role="alert">{error}</ErrorText> : null}
                <SubmitButton type="submit" $tone="buy">
                  다음 — 방문 일정
                </SubmitButton>
              </FormWrapper>
            ) : (
              <FormWrapper
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !buyForm.scheduleSkipped &&
                    (!buyForm.visitDate || !buyForm.reservedStart)
                  ) {
                    setError(
                      "방문 날짜와 시간을 선택하거나, 아래 옵션을 이용해 주세요.",
                    );
                    return;
                  }
                  void submitBuy(buyForm.scheduleSkipped);
                }}
                noValidate
              >
                <FormHeader>
                  <FormHeaderTitle>방문 일정</FormHeaderTitle>
                  <FormHeaderSubtitle>
                    운영자 근무 슬롯 기준으로 날짜·시간을 선택해 주세요.
                  </FormHeaderSubtitle>
                </FormHeader>
                <HeaderDivider />
                {!buyForm.scheduleSkipped ? (
                  <FieldGroup>
                    {offices.length > 1 ? (
                      <Field>
                        <Label htmlFor="buy-office">사무실</Label>
                        <OfficeSelect
                          id="buy-office"
                          value={buyForm.officeId ?? ""}
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            setBuyForm((p) => ({
                              ...p,
                              officeId: id,
                              visitDate: "",
                              reservedStart: "",
                            }));
                          }}
                        >
                          {offices.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </OfficeSelect>
                      </Field>
                    ) : null}
                    <Field>
                      <Label>방문 희망일</Label>
                      <DateSelectButton
                        type="button"
                        $hasValue={!!buyForm.visitDate}
                        onClick={() => setCalendarOpen((o) => !o)}
                      >
                        <span>
                          {buyForm.visitDate
                            ? (formatKstYmdLong(buyForm.visitDate) ??
                              buyForm.visitDate)
                            : "날짜 선택"}
                        </span>
                        <span aria-hidden="true">
                          {calendarOpen ? "▴" : "▾"}
                        </span>
                      </DateSelectButton>
                      {calendarOpen ? (
                        <div style={{ marginTop: 8 }}>
                          <MonthCalendar
                            valueDate={buyForm.visitDate || minVisitDate}
                            minDate={minVisitDate}
                            maxDate={defaultCalendarMaxDate(minVisitDate, 3)}
                            isDateEnabled={isDateEnabled}
                            onSelect={(s) => {
                              setBuyForm((p) => ({
                                ...p,
                                visitDate: s,
                                reservedStart: "",
                              }));
                              setCalendarOpen(false);
                            }}
                            onMonthChange={handleMonthChange}
                          />
                          {daysLoading ? (
                            <HintText>근무일 조회 중…</HintText>
                          ) : null}
                        </div>
                      ) : null}
                    </Field>
                    {buyForm.visitDate ? (
                      <Field>
                        <Label>방문 시간</Label>
                        {slotsLoading ? (
                          <HintText>시간 조회 중…</HintText>
                        ) : daySlots.length === 0 ? (
                          <HintText>예약 가능한 시간이 없습니다.</HintText>
                        ) : (
                          <SlotGrid>
                            {daySlots.map((slot) => (
                              <SlotChip
                                key={slot.startTime}
                                type="button"
                                $active={
                                  buyForm.reservedStart === slot.startTime
                                }
                                $booked={!slot.available}
                                disabled={!slot.available}
                                onClick={() =>
                                  setBuyForm((p) => ({
                                    ...p,
                                    reservedStart: slot.startTime,
                                  }))
                                }
                              >
                                <SlotChipTime>{slot.startTime}</SlotChipTime>
                                <SlotChipMeta>
                                  {slot.available
                                    ? `남음 ${slot.remaining}`
                                    : "예약됨"}
                                </SlotChipMeta>
                              </SlotChip>
                            ))}
                          </SlotGrid>
                        )}
                      </Field>
                    ) : null}
                  </FieldGroup>
                ) : (
                  <GuideBox>
                    일정은 운영자가 연락 후 조율합니다. 신청만 먼저 접수됩니다.
                  </GuideBox>
                )}
                {error ? <ErrorText role="alert">{error}</ErrorText> : null}
                <SubmitButton type="submit" $tone="buy" disabled={submitting}>
                  {submitting ? "접수 중…" : "신청하기"}
                </SubmitButton>
                <SecondaryButton
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setBuyForm((p) => ({
                      ...p,
                      scheduleSkipped: true,
                      visitDate: "",
                      reservedStart: "",
                    }));
                    void submitBuy(true);
                  }}
                >
                  나중에 정하기
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    setError(null);
                    setBuyStep("input");
                  }}
                >
                  이전
                </SecondaryButton>
              </FormWrapper>
            )
          ) : sellStep === "done" ? (
            <DoneBox>
              <DoneTitle>신청이 접수되었습니다</DoneTitle>
              <DoneText>
                운영자가 연락드려 가격을 합의합니다. 합의 후 입금 안내드리니,
                지금 모빅을 보내지 마세요.
              </DoneText>
              <SubmitButton type="button" $tone="sell" onClick={onClose}>
                닫기
              </SubmitButton>
            </DoneBox>
          ) : (
            <FormWrapper
              onSubmit={(e) => {
                e.preventDefault();
                void submitSell();
              }}
              noValidate
            >
              <FormHeader>
                <FormHeaderTitle>BMB 판매 신청</FormHeaderTitle>
                <FormHeaderSubtitle>
                  판매 수량·희망가·지갑·입금 계좌를 입력해 주세요.
                </FormHeaderSubtitle>
              </FormHeader>
              <HeaderDivider />
              <FieldGroup>
                <Field>
                  <Label htmlFor="sell-name">
                    성함 <Required>*</Required>
                  </Label>
                  <Input
                    id="sell-name"
                    value={sellForm.name}
                    onChange={(e) =>
                      setSellForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </Field>
                <Field>
                  <Label htmlFor="sell-contact">
                    연락처 <Required>*</Required>
                  </Label>
                  <Input
                    id="sell-contact"
                    type="tel"
                    value={sellForm.contact}
                    onChange={(e) =>
                      setSellForm((p) => ({
                        ...p,
                        contact: formatPhone(e.target.value),
                      }))
                    }
                    maxLength={13}
                  />
                </Field>
                <Field>
                  <Label>
                    수량 <Required>*</Required>
                  </Label>
                  <ChipRow>
                    {QTY_CHIPS.map((n) => (
                      <Chip
                        key={n}
                        type="button"
                        $active={sellForm.qtyChip === n}
                        onClick={() =>
                          setSellForm((p) => ({ ...p, qtyChip: n }))
                        }
                      >
                        {n}개
                      </Chip>
                    ))}
                    <Chip
                      type="button"
                      $active={sellForm.qtyChip === "custom"}
                      onClick={() =>
                        setSellForm((p) => ({ ...p, qtyChip: "custom" }))
                      }
                    >
                      직접 입력
                    </Chip>
                  </ChipRow>
                  {sellForm.qtyChip === "custom" && (
                    <Input
                      type="number"
                      min={MIN_QUANTITY}
                      value={sellForm.customQty}
                      onChange={(e) =>
                        setSellForm((p) => ({
                          ...p,
                          customQty: e.target.value,
                        }))
                      }
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Field>
                <Field>
                  <Label>희망 가격대</Label>
                  {bmbKrw != null ? (
                    <PriceStepperRow>
                      <StepperBtn
                        type="button"
                        disabled={sellForm.priceUndecided}
                        onClick={() =>
                          setSellForm((p) => ({
                            ...p,
                            priceUndecided: false,
                            desiredPrice:
                              (p.desiredPrice ?? bmbKrw) - PRICE_STEP,
                          }))
                        }
                      >
                        −1만
                      </StepperBtn>
                      <PriceDisplay>
                        {sellForm.priceUndecided
                          ? "미정"
                          : `${(sellForm.desiredPrice ?? bmbKrw).toLocaleString("ko-KR")}원`}
                      </PriceDisplay>
                      <StepperBtn
                        type="button"
                        disabled={sellForm.priceUndecided}
                        onClick={() =>
                          setSellForm((p) => ({
                            ...p,
                            priceUndecided: false,
                            desiredPrice:
                              (p.desiredPrice ?? bmbKrw) + PRICE_STEP,
                          }))
                        }
                      >
                        +1만
                      </StepperBtn>
                    </PriceStepperRow>
                  ) : (
                    <HintText>시세 불러오는 중…</HintText>
                  )}
                  <ChipRow style={{ marginTop: 8 }}>
                    <Chip
                      type="button"
                      $active={sellForm.priceUndecided}
                      onClick={() =>
                        setSellForm((p) => ({
                          ...p,
                          priceUndecided: true,
                        }))
                      }
                    >
                      가격 미정
                    </Chip>
                    {bmbKrw != null ? (
                      <Chip
                        type="button"
                        $active={
                          !sellForm.priceUndecided &&
                          sellForm.desiredPrice === bmbKrw
                        }
                        onClick={() =>
                          setSellForm((p) => ({
                            ...p,
                            priceUndecided: false,
                            desiredPrice: bmbKrw,
                          }))
                        }
                      >
                        현재가 기준
                      </Chip>
                    ) : null}
                  </ChipRow>
                </Field>
                <Field>
                  <Label htmlFor="sell-wallet">
                    판매자 모빅 지갑 공개주소 <Optional>(선택)</Optional>
                  </Label>
                  <Input
                    id="sell-wallet"
                    value={sellForm.senderAddress}
                    onChange={(e) =>
                      setSellForm((p) => ({
                        ...p,
                        senderAddress: e.target.value,
                      }))
                    }
                    placeholder="0x… (합의 후 안내 가능)"
                  />
                </Field>
                <BankAccountInputs
                  idPrefix="sell"
                  values={{
                    bankName: sellForm.bankName,
                    accountNo: sellForm.accountNo,
                    accountHolder: sellForm.accountHolder,
                  }}
                  onChange={(patch) => setSellForm((p) => ({ ...p, ...patch }))}
                />
              </FieldGroup>
              <GuideBox>
                신청 후 운영자가 연락해 가격을 합의합니다. 합의 후 입금
                안내드리니, <strong>지금 모빅을 보내지 마세요.</strong>
              </GuideBox>
              {error ? <ErrorText role="alert">{error}</ErrorText> : null}
              <SubmitButton type="submit" $tone="sell" disabled={submitting}>
                {submitting ? "접수 중…" : "신청하기"}
              </SubmitButton>
            </FormWrapper>
          )}
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
}
