"use client";

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import styled from "styled-components";

// External links / placeholders — replace before launch
const KAKAO_INQUIRY_URL = "https://example.com/kakao"; // TODO: real Kakao channel URL
const HARVEST_MOVN_URL = "https://harvest-movn.com/";
const OFFICE_LOCATION_LABEL = "강남 사무실";
const OFFICE_HOURS_LABEL = "평일 10:00 ~ 18:00 (조율 가능)"; // TODO: real on-site hours

// Office location — used in done-view map block
const OFFICE_ADDRESS =
  "서울 서초구 사임당로 149-5 지하층 (서초 모빅회관 내)";

// Short landmark hint shown next to the map. Distance/time TBD — replace once measured.
const NEAR_LANDMARK_LABEL = "강남역 도보 약 N분 · 서초 모빅회관 내 사무실";

// Embedded map slot.
//   - Naver Map does NOT expose a public no-API iframe. naver.me/map.naver.com URLs
//     ship `X-Frame-Options: SAMEORIGIN`/DENY and won't render in <iframe>.
//   - We keep this hook to plug in either an NCP-key-backed solution or another
//     embed (e.g. Kakao Map iframe HTML provided by their share dialog) later
//     without touching the JSX. When non-null, the iframe variant renders;
//     otherwise the static fallback (image + address + direction links) renders.
const OFFICE_MAP_IFRAME_URL: string | null = null; // TODO: fill once embed source is decided

// Static map screenshot — TODO: replace with a real PNG/JPG placed under /public/otc/.
const OFFICE_MAP_IMAGE_SRC: string | null = null;

// Direction links — generic "search by address" URLs survive without a place ID.
// Replace with precise place/coords links (e.g. naver.me/xxxxx, /place/<id>) when known.
const NAVER_MAP_URL =
  "https://map.naver.com/p/search/" +
  encodeURIComponent("서울 서초구 사임당로 149-5");
const KAKAO_MAP_URL =
  "https://map.kakao.com/?q=" +
  encodeURIComponent("서울 서초구 사임당로 149-5");

const QTY_CHIPS = [10, 20, 30] as const;
type QtyChip = (typeof QTY_CHIPS)[number] | "custom";

interface FormState {
  name: string;
  contact: string;
  qtyChip: QtyChip;
  customQty: string;
  visitDate: string;
  isExistingSbmb: boolean;
  memo: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  contact: "",
  qtyChip: 10,
  customQty: "",
  visitDate: "",
  isExistingSbmb: false,
  memo: "",
};

interface SubmissionPayload {
  name: string;
  contact: string;
  quantity: number;
  visitDate: string | null;
  isExistingSbmb: boolean;
  memo: string | null;
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

// Single submit hook — replace inner body with a real API call later.
async function submitApplication(payload: SubmissionPayload): Promise<void> {
  console.log("[Apply10Mo] submission payload:", payload);
}

export default function Apply10MoModal({ open, onClose }: Apply10MoModalProps) {
  const [step, setStep] = useState<"form" | "done">("form");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState<SubmissionPayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep("form");
      setForm(INITIAL_FORM);
      setSubmitted(null);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

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
      if (qty == null) {
        setError("신청 수량을 입력해 주세요.");
        return;
      }

      setError(null);
      setSubmitting(true);

      const payload: SubmissionPayload = {
        name,
        contact,
        quantity: qty,
        visitDate: form.visitDate.trim() || null,
        isExistingSbmb: form.isExistingSbmb,
        memo: form.memo.trim() || null,
      };

      try {
        await submitApplication(payload);
        setSubmitted(payload);
        setStep("done");
      } catch (err) {
        console.error(err);
        setError("신청 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
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
        <Body>
          {step === "form" ? (
            <FormView
              form={form}
              setForm={setForm}
              submitting={submitting}
              error={error}
              onSubmit={handleSubmit}
            />
          ) : submitted ? (
            <DoneView submitted={submitted} onClose={onClose} />
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
            <br />
            ({OFFICE_LOCATION_LABEL})
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
            type="text"
            value={form.contact}
            onChange={(e) => updateField("contact", e.target.value)}
            placeholder="카카오톡 ID 또는 전화번호"
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
              min={1}
              step={1}
              value={form.customQty}
              onChange={(e) => updateField("customQty", e.target.value)}
              placeholder="모 수량 입력 (예: 50)"
              style={{ marginTop: 8 }}
            />
          )}
        </Field>

        <Field>
          <Label htmlFor="apply-visit">
            희망 방문 일시 <Optional>(선택 · 조율 가능)</Optional>
          </Label>
          <Input
            id="apply-visit"
            type="text"
            value={form.visitDate}
            onChange={(e) => updateField("visitDate", e.target.value)}
            placeholder="예: 다음 주 평일 오후 / 6/3 14시"
          />
        </Field>

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

interface DoneViewProps {
  submitted: SubmissionPayload;
  onClose: () => void;
}

function DoneView({ submitted, onClose }: DoneViewProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(OFFICE_ADDRESS);
      } else {
        // Older browsers / non-secure contexts — best effort fallback.
        const ta = document.createElement("textarea");
        ta.value = OFFICE_ADDRESS;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("[Apply10Mo] address copy failed:", err);
    }
  }, []);

  return (
    <DoneWrapper>
      <DoneIcon aria-hidden="true">✓</DoneIcon>
      <DoneTitle>신청이 접수되었습니다</DoneTitle>
      <DoneSubtitle>곧 연락드려 방문 일정을 확정해 드릴게요.</DoneSubtitle>

      <SummaryBox>
        <SummaryRow>
          <SummaryLabel>신청 수량</SummaryLabel>
          <SummaryValue>{submitted.quantity}모</SummaryValue>
        </SummaryRow>
        <SummaryRow>
          <SummaryLabel>연락처</SummaryLabel>
          <SummaryValue>{submitted.contact}</SummaryValue>
        </SummaryRow>
        <SummaryRow>
          <SummaryLabel>희망 방문 일시</SummaryLabel>
          <SummaryValue>{submitted.visitDate ?? "조율 가능"}</SummaryValue>
        </SummaryRow>
      </SummaryBox>

      <NextStepsBox>
        <NextStepsTitle>다음 단계</NextStepsTitle>
        <NextStepsList>
          <li>
            <NextStepNo>1</NextStepNo>
            <span>담당자가 연락드려 일정을 확정합니다.</span>
          </li>
          <li>
            <NextStepNo>2</NextStepNo>
            <span>
              {OFFICE_LOCATION_LABEL} 방문 (신규는 간단한 면대면 인증).
            </span>
          </li>
          <li>
            <NextStepNo>3</NextStepNo>
            <span>10 BMB 수령 · 보관 도움.</span>
          </li>
        </NextStepsList>
      </NextStepsBox>

      <LocationBlock>
        <LocationTitle>방문 위치</LocationTitle>
        <MapMedia>
          {OFFICE_MAP_IFRAME_URL ? (
            <MapIframe
              src={OFFICE_MAP_IFRAME_URL}
              title={`${OFFICE_LOCATION_LABEL} 지도`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : OFFICE_MAP_IMAGE_SRC ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={OFFICE_MAP_IMAGE_SRC}
              alt={`${OFFICE_LOCATION_LABEL} 위치 지도`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <MapImagePlaceholder aria-hidden="true">
              지도 이미지 준비 중
            </MapImagePlaceholder>
          )}
        </MapMedia>
        <LandmarkNote>{NEAR_LANDMARK_LABEL}</LandmarkNote>
        <AddressRow>
          <AddressText>{OFFICE_ADDRESS}</AddressText>
          <AddressCopyButton type="button" onClick={copyAddress}>
            {copied ? "복사됨" : "주소 복사"}
          </AddressCopyButton>
        </AddressRow>
        <DirectionsRow>
          <DirectionsButton
            href={NAVER_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            $variant="naver"
          >
            네이버지도에서 보기 · 길찾기
          </DirectionsButton>
          <DirectionsButton
            href={KAKAO_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            $variant="kakao"
          >
            카카오맵에서 보기
          </DirectionsButton>
        </DirectionsRow>
      </LocationBlock>

      <CtaPrimary
        href={KAKAO_INQUIRY_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        카카오톡으로 문의하기
      </CtaPrimary>
      <CtaRow>
        <CtaSecondaryLink
          href={HARVEST_MOVN_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          10모의 기적이란?
        </CtaSecondaryLink>
        <CtaSecondaryButton type="button" onClick={onClose}>
          처음으로
        </CtaSecondaryButton>
      </CtaRow>
    </DoneWrapper>
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
  align-items: stretch;
  padding: 0;

  @media (min-width: 768px) {
    padding: 32px 16px;
    align-items: flex-start;
  }
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 100vh;

  @media (min-width: 768px) {
    max-width: 720px;
    border-radius: 16px;
    max-height: calc(100vh - 64px);
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

const Body = styled.div`
  width: 100%;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 24px 20px 32px;

  @media (min-width: 768px) {
    padding: 32px 32px 40px;
  }
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

const DoneWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 8px;
`;

const DoneIcon = styled.div`
  align-self: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ecfdf5;
  color: #10b981;
  font-size: 30px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
`;

const DoneTitle = styled.h2`
  margin: 0;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
`;

const DoneSubtitle = styled.p`
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.55;
`;

const SummaryBox = styled.div`
  background: #fafaff;
  border: 1px solid #f0eef9;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const SummaryLabel = styled.span`
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
`;

const SummaryValue = styled.span`
  font-size: 0.9rem;
  color: #111827;
  font-weight: 700;
  text-align: right;
`;

const NextStepsBox = styled.div`
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NextStepsTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: #312e81;
`;

const NextStepsList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-size: 0.85rem;
    color: #4338ca;
    line-height: 1.5;
  }
`;

const NextStepNo = styled.span`
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #434392;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
`;

const LocationBlock = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LocationTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: #111827;
`;

const MapMedia = styled.div`
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: #f3f4f6;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;

  > img,
  > iframe {
    width: 100%;
    height: 100%;
    display: block;
    border: 0;
  }

  > img {
    object-fit: cover;
  }

  @media (min-width: 768px) {
    aspect-ratio: 21 / 9;
  }
`;

const MapIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
`;

const MapImagePlaceholder = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
  padding: 16px;
`;

const LandmarkNote = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.45;
`;

const AddressRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
`;

const AddressText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.85rem;
  color: #1f2937;
  line-height: 1.45;
  word-break: keep-all;
`;

const AddressCopyButton = styled.button`
  flex: 0 0 auto;
  padding: 8px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #434392;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.12s ease;

  &:hover {
    background: #ede9fe;
  }
`;

const DirectionsRow = styled.div`
  display: flex;
  gap: 8px;

  > * {
    flex: 1;
  }

  @media (max-width: 380px) {
    flex-direction: column;
  }
`;

const DirectionsButton = styled.a<{ $variant: "naver" | "kakao" }>`
  padding: 11px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  border-radius: 10px;
  transition: filter 0.12s ease;

  background: ${(p) => (p.$variant === "naver" ? "#03c75a" : "#fee500")};
  color: ${(p) => (p.$variant === "naver" ? "#ffffff" : "#181600")};

  &:hover {
    filter: brightness(0.95);
  }
`;

const CtaPrimary = styled.a`
  width: 100%;
  padding: 14px 16px;
  font-size: 1rem;
  font-weight: 800;
  text-align: center;
  background: #fee500;
  color: #181600;
  border-radius: 12px;
  text-decoration: none;
  transition: filter 0.12s ease;

  &:hover {
    filter: brightness(0.95);
  }
`;

const CtaRow = styled.div`
  display: flex;
  gap: 8px;

  > * {
    flex: 1;
  }
`;

const ctaSecondaryStyles = `
  padding: 12px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  background: #ffffff;
  color: #434392;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.12s ease;

  &:hover {
    background: #f5f3ff;
  }
`;

const CtaSecondaryLink = styled.a`
  ${ctaSecondaryStyles}
`;

const CtaSecondaryButton = styled.button`
  ${ctaSecondaryStyles}
`;
