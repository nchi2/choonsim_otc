"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styled, { keyframes } from "styled-components";
// import SbmbInquiryFlowModal from "@/components/sbmb/lookup/SbmbInquiryFlowModal";
import SbmbLookupModal from "@/components/sbmb/lookup/SbmbLookupModal";
import { IconMessageCircle } from "@/components/sbmb/shared/SbmbIcons";
import { SBMB_KAKAO_INQUIRY_URL } from "@/lib/sbmb/constants";
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

const PhoneHints = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PhoneHintLine = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: ${T.textTertiary};
`;

const PhoneHintEm = styled.span`
  font-weight: 600;
  color: ${T.textMuted};
`;

const FieldGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 13px;
  color: ${T.textMuted};
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

const ErrorBox = styled.div`
  background: ${T.errorBg};
  border: 1px solid ${T.errorBorder};
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ErrorTitle = styled.p`
  margin: 0;
  font-weight: 700;
  font-size: 13px;
  color: ${T.errorDark};
`;

const ErrorDesc = styled.p`
  margin: 0;
  font-weight: 400;
  font-size: 13px;
  line-height: 1.6;
  color: ${T.errorMid};
`;

const KakaoBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${T.kakaoYellow};
  border: 1px solid ${T.kakaoBorder};
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  color: ${T.kakaoText};
  text-decoration: none;
  width: fit-content;
`;

/* 문의 플로우(춘심 도우미) 비활성화 시 함께 복구
const InquiryFlowTextBtn = styled.button`
  align-self: center;
  margin-top: 4px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 6px 4px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 1.45;
  color: #6b7280;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #4b5563;
  }
`;
*/

export type LookupStep = "step1" | "error_step1";

export type LookupCardHandle = {
  scrollToCard: () => void;
};

const LookupCard = forwardRef<LookupCardHandle>(function LookupCard(_, ref) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<LookupStep>("step1");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  // const [inquiryFlowOpen, setInquiryFlowOpen] = useState(false);
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

  const step1InputsError = step === "error_step1";

  return (
    <>
      <CardRoot id="sbmb-lookup-card" ref={innerRef}>
        {step === "step1" || step === "error_step1" ? (
          <>
            <StepBadge $error={step1InputsError}>
              <StepDot $error={step1InputsError} />
              <StepBadgeText>STEP 1 · 참여자 확인</StepBadgeText>
            </StepBadge>
            <CardTitle>신청 현황 조회</CardTitle>
            <InputRow>
              <FieldGroup>
                <Label htmlFor="sbmb-name">성함</Label>
                <Input
                  id="sbmb-name"
                  $tone={step1InputsError ? "error" : "default"}
                  placeholder="성함을 입력하세요 (공백 없이)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="sbmb-phone">연락처</Label>
                <Input
                  id="sbmb-phone"
                  $tone={step1InputsError ? "error" : "focus"}
                  placeholder="010-1234-5678"
                  value={formatPhoneLocalDigits(phoneDigits)}
                  onChange={(e) =>
                    setPhoneDigits(extractPhoneDigits(e.target.value))
                  }
                  inputMode="tel"
                  autoComplete="tel"
                  aria-describedby="sbmb-phone-hints"
                />
              </FieldGroup>
            </InputRow>
            <PhoneHints id="sbmb-phone-hints">
              <PhoneHintLine>
                해외 참여자는{" "}
                <PhoneHintEm>국가번호를 제외한 번호만</PhoneHintEm> 입력해
                주세요.
              </PhoneHintLine>
              <PhoneHintLine>
                숫자만 입력하면 됩니다. 하이픈(-)을 치지 않아도{" "}
                <PhoneHintEm>자동으로 000-0000-0000 형태</PhoneHintEm>로
                표시됩니다.
              </PhoneHintLine>
            </PhoneHints>
            {step === "error_step1" ? (
              <>
                <ErrorBox>
                  <ErrorTitle>아직 확인되지 않은 참여자입니다.</ErrorTitle>
                  <ErrorDesc>
                    참여 모빅을 전송 완료하신 경우 춘심이 동생 카카오톡으로
                    연락해주세요.
                  </ErrorDesc>
                </ErrorBox>
                <KakaoBtn
                  href={SBMB_KAKAO_INQUIRY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconMessageCircle size={18} color={T.kakaoText} />
                  카카오톡으로 문의하기
                </KakaoBtn>
              </>
            ) : null}
            <PrimaryBtn
              type="button"
              $disabled={loading || !name.trim() || !phoneDigits}
              onClick={handleLookup}
            >
              {loading ? <Spinner /> : null}
              확인하기
            </PrimaryBtn>
            {/* 문의 플로우 모달 — 추후 재개 시 SbmbInquiryFlowModal·상태 주석 해제
            {step === "error_step1" ? (
              <InquiryFlowTextBtn
                type="button"
                onClick={() => setInquiryFlowOpen(true)}
              >
                조회가 안되시나요? →
              </InquiryFlowTextBtn>
            ) : null}
            */}
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
      />
      {/* <SbmbInquiryFlowModal
        open={inquiryFlowOpen}
        onClose={() => setInquiryFlowOpen(false)}
      /> */}
    </>
  );
});

export default LookupCard;
