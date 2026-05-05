"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styled, { keyframes } from "styled-components";
import SbmbInquiryFlowModal from "@/components/sbmb/lookup/SbmbInquiryFlowModal";
import SbmbLookupModal from "@/components/sbmb/lookup/SbmbLookupModal";
import {
  extractPhoneDigits,
  formatPhoneLocalDigits,
} from "@/lib/sbmb/phoneFormat";
import { T } from "@/lib/sbmb/tokens";

const mobile = "@media (max-width: 767px)";

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.span`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
`;

const CardRoot = styled.div`
  width: 100%;
  max-width: ${T.maxWidth};
  margin: 0 auto;
  background: ${T.white};
  border-radius: 20px 20px 0 0;
  box-shadow: ${T.heroCardShadow};
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  ${mobile} {
    padding: 20px;
    border-radius: 14px 14px 0 0;
  }
`;

const StepBadge = styled.div<{ $error?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StepDot = styled.span<{ $error?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(p) =>
    p.$error
      ? T.errorRed
      : `linear-gradient(90deg, ${T.primary} 0%, ${T.mint} 100%)`};
`;

const StepBadgeText = styled.span`
  font-weight: 700;
  font-size: 11px;
  color: ${T.primary};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-weight: 700;
  font-size: 24px;
  color: ${T.textPrimary};
  width: 100%;
`;

const InputRow = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-end;

  ${mobile} {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FieldGroup = styled.div<{ $grow?: number }>`
  flex: ${(p) => p.$grow ?? 1};
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 13px;
  color: ${T.textMuted};
`;

const LabelHint = styled.span`
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.3;
  white-space: nowrap;
`;

const Input = styled.input<{
  $tone?: "default" | "error" | "focus";
  $thickPrimary?: boolean;
}>`
  height: 48px;
  padding: 0 16px;
  border-radius: 10px;
  border: ${(p) => {
    if (p.$thickPrimary) return `2px solid ${T.primary}`;
    if (p.$tone === "error") return `1px solid ${T.errorBorder}`;
    if (p.$tone === "focus") return `2px solid ${T.mint}`;
    return `1px solid ${T.border}`;
  }};
  background: ${(p) => (p.$tone === "error" ? T.errorBg : T.white)};
  font-size: 14px;
  color: ${T.textPrimary};
  outline: none;

  &::placeholder {
    color: ${T.textTertiary};
  }

  &:focus {
    border-width: 2px;
    border-color: ${(p) => {
      if (p.$thickPrimary) return T.primary;
      return p.$tone === "error" ? T.errorBorder : T.mint;
    }};
  }

  ${mobile} {
    height: 52px;
  }
`;

const PrimaryBtn = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  color: ${T.white};
  background-image: ${T.buttonGradient};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
  pointer-events: ${(p) => (p.$disabled ? "none" : "auto")};

  ${mobile} {
    height: 52px;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  font-weight: 400;
  font-size: 13px;
  line-height: 1.45;
  color: #ef4444;
  margin-top: 4px;
`;

const InquiryFlowTextBtn = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  padding: 10px 14px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
  color: #4c4598;
  text-decoration: none;

  &:hover {
    background: #f9fafb;
  }
`;

export type LookupStep = "step1" | "error_step1";

export type LookupCardHandle = {
  scrollToCard: () => void;
};

const LookupCard = forwardRef<LookupCardHandle>(function LookupCard(_, ref) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<LookupStep>("step1");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [inquiryFlowOpen, setInquiryFlowOpen] = useState(false);
  const [name, setName] = useState("");
  /** 숫자만 저장, 표시는 formatPhoneLocalDigits */
  const [phoneDigits, setPhoneDigits] = useState("");
  const [confirmedName, setConfirmedName] = useState("");

  const scrollToCard = useCallback(() => {
    setTimeout(() => {
      innerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }, []);

  useImperativeHandle(ref, () => ({ scrollToCard }), [scrollToCard]);

  const closeModalOnly = useCallback(() => {
    setModalOpen(false);
  }, []);

  const reset = () => {
    setModalOpen(false);
    setStep("step1");
    setName("");
    setPhoneDigits("");
    setConfirmedName("");
    scrollToCard();
  };

  const handleLookup = async () => {
    if (!name.trim() || !phoneDigits) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sbmb/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneDigits,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStep("error_step1");
        scrollToCard();
        return;
      }
      if (
        data.found === true &&
        Array.isArray(data.sources) &&
        data.sources.length > 0
      ) {
        setConfirmedName(name.trim());
        setModalOpen(true);
        scrollToCard();
      } else {
        setStep("error_step1");
        scrollToCard();
      }
    } catch {
      setStep("error_step1");
      scrollToCard();
    } finally {
      setLoading(false);
    }
  };

  const isErrorStep1 = step === "error_step1";

  return (
    <>
      <CardRoot id="sbmb-lookup-card" ref={innerRef}>
        {step === "step1" || step === "error_step1" ? (
          <>
            <StepBadge $error={isErrorStep1}>
              <StepDot $error={isErrorStep1} />
              <StepBadgeText>STEP 1 · 참여자 확인</StepBadgeText>
            </StepBadge>
            <CardTitle>신청 현황 조회</CardTitle>
            <InputRow>
              <FieldGroup $grow={3.5}>
                <Label htmlFor="sbmb-name">성함</Label>
                <Input
                  id="sbmb-name"
                  $tone="default"
                  placeholder="성함을 입력하세요 (공백 없이)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </FieldGroup>
              <FieldGroup $grow={6.5}>
                <LabelRow>
                  <Label htmlFor="sbmb-phone">연락처</Label>
                  <LabelHint>국가번호 제외, 숫자만 입력</LabelHint>
                </LabelRow>
                <Input
                  id="sbmb-phone"
                  $tone="focus"
                  placeholder="010-1234-5678"
                  value={formatPhoneLocalDigits(phoneDigits)}
                  onChange={(e) =>
                    setPhoneDigits(extractPhoneDigits(e.target.value))
                  }
                  inputMode="tel"
                  autoComplete="tel"
                />
              </FieldGroup>
            </InputRow>
            {step === "error_step1" ? (
              <ErrorText>
                아직 확인되지 않은 참여자입니다. 성함과 연락처를 다시
                확인해주세요.
              </ErrorText>
            ) : null}
            <PrimaryBtn
              type="button"
              $disabled={loading || !name.trim() || !phoneDigits}
              onClick={handleLookup}
            >
              {loading ? <Spinner /> : null}
              확인하기
            </PrimaryBtn>
            <InquiryFlowTextBtn
              type="button"
              onClick={() => setInquiryFlowOpen(true)}
            >
              <span
                style={{
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                조회가 안되시나요?
              </span>
              <span aria-hidden>→</span>
            </InquiryFlowTextBtn>
          </>
        ) : null}
      </CardRoot>
      <SbmbLookupModal
        open={modalOpen}
        onClose={reset}
        onDismissNavigate={closeModalOnly}
        name={name}
        phoneDigits={phoneDigits}
        confirmedName={confirmedName}
        onOpenInquiryFlow={() => setInquiryFlowOpen(true)}
      />
      <SbmbInquiryFlowModal
        open={inquiryFlowOpen}
        onClose={() => setInquiryFlowOpen(false)}
      />
    </>
  );
});

export default LookupCard;
