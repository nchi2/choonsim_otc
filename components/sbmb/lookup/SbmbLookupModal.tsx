"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import ResultCard from "@/components/sbmb/lookup/ResultCard";
import {
  IconCircleCheck,
  IconMessageCircle,
  IconRefreshCw,
  IconX,
} from "@/components/sbmb/shared/SbmbIcons";
import { SBMB_KAKAO_INQUIRY_URL } from "@/lib/sbmb/constants";
import { T } from "@/lib/sbmb/tokens";
import type { SbmbVerifyOk } from "@/types/sbmb";

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

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
`;

const Panel = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;

  ${mobile} {
    top: 0;
    left: 0;
    transform: none;
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }
`;

const CloseRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: -8px -8px 0 0;
`;

const CloseBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  color: ${T.textSecondary};

  &:hover {
    background: #f3f4f6;
    color: ${T.textPrimary};
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
  font-size: 22px;
  color: ${T.textPrimary};
  width: 100%;
`;

const FieldGroup = styled.div`
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

const Input = styled.input<{ $tone?: "default" | "error"; $thickPrimary?: boolean }>`
  height: 48px;
  padding: 0 16px;
  border-radius: 10px;
  border: ${(p) => {
    if (p.$thickPrimary) return `2px solid ${T.primary}`;
    if (p.$tone === "error") return `1px solid ${T.errorBorder}`;
    return `1px solid ${T.border}`;
  }};
  background: ${(p) => (p.$tone === "error" ? T.errorBg : T.white)};
  font-size: 14px;
  color: ${T.textPrimary};
  outline: none;

  &:focus {
    border-width: 2px;
    border-color: ${(p) =>
      p.$tone === "error" ? T.errorBorder : T.mint};
  }

  ${mobile} {
    height: 52px;
  }
`;

const WalletLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const WalletHint = styled.span`
  font-size: 12px;
  color: ${T.textTertiary};
  ${mobile} {
    display: none;
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

const ErrorActions = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;

  ${mobile} {
    flex-direction: column;
  }
`;

const SecondaryBtn = styled.button`
  flex: 1;
  height: 46px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: ${T.textMuted};
  background: #f3f4f6;
`;

const KakaoHalfBtn = styled.a`
  flex: 1;
  height: 46px;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: ${T.kakaoText};
  background: ${T.kakaoYellow};
  border: 1px solid ${T.kakaoBorder};
  text-decoration: none;
`;

const ConfirmedChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  background: ${T.mintLight};
  border-radius: 9999px;
  width: fit-content;
  font-weight: 600;
  font-size: 13px;
  color: ${T.mintDark};
`;

const GhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: ${T.textTertiary};
`;

/* 문의 플로우 비활성화 시 함께 복구
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

const Step2HelpBlock = styled.div`
  width: 100%;
  text-align: center;
`;

const Step2KakaoTextLink = styled.a`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 1.45;
  color: ${T.textTertiary};
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
`;

const Step2KakaoLinkEm = styled.span`
  color: ${T.kakaoText};
  text-decoration: underline;
`;

type ModalStep = "step2" | "error_step2" | "result";

export type SbmbLookupModalProps = {
  open: boolean;
  onClose: () => void;
  /** 공지/가이드 스크롤 전에 모달만 닫기 (폼 초기화 없음) */
  onDismissNavigate: () => void;
  name: string;
  phoneDigits: string;
  confirmedName: string;
  // onOpenInquiryFlow?: () => void;
};

export default function SbmbLookupModal({
  open,
  onClose,
  onDismissNavigate,
  name,
  phoneDigits,
  confirmedName,
}: SbmbLookupModalProps) {
  const [modalStep, setModalStep] = useState<ModalStep>("step2");
  const [walletNo, setWalletNo] = useState("");
  const [result, setResult] = useState<SbmbVerifyOk | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setModalStep("step2");
    setWalletNo("");
    setResult(null);
    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  const handleVerify = async () => {
    const n = parseInt(walletNo.trim(), 10);
    if (!name.trim() || !phoneDigits || !Number.isFinite(n)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sbmb/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneDigits,
          walletNo: n,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalStep("error_step2");
        return;
      }
      if (
        data.found === true &&
        Array.isArray(data.entries) &&
        data.entries.length > 0
      ) {
        setResult(data as SbmbVerifyOk);
        setModalStep("result");
      } else {
        setModalStep("error_step2");
      }
    } catch {
      setModalStep("error_step2");
    } finally {
      setLoading(false);
    }
  };

  if (!open || typeof document === "undefined") return null;

  const handleResetInside = () => {
    onClose();
  };

  return createPortal(
    <>
      <Overlay
        role="presentation"
        aria-hidden
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <Panel
        role="dialog"
        aria-modal="true"
        aria-label={
          modalStep === "result"
            ? "신청 현황 조회 결과"
            : "지갑 번호 확인"
        }
      >
        <CloseRow>
          <CloseBtn type="button" onClick={onClose} aria-label="닫기">
            <IconX size={22} color="currentColor" />
          </CloseBtn>
        </CloseRow>

        {modalStep === "step2" || modalStep === "error_step2" ? (
          <>
            <StepBadge $error={modalStep === "error_step2"}>
              <StepDot $error={modalStep === "error_step2"} />
              <StepBadgeText>STEP 2 · 지갑 번호 확인</StepBadgeText>
            </StepBadge>
            <CardTitle>지갑 번호 확인</CardTitle>
            <ConfirmedChip>
              <IconCircleCheck size={16} color={T.mintDark} />
              {confirmedName}님이 확인되었습니다
            </ConfirmedChip>
            <FieldGroup>
              <WalletLabelRow>
                <Label htmlFor="sbmb-modal-wallet">지갑 No.</Label>
                <WalletHint>
                  여러 장 보유 시 그 중 하나만 입력해도 됩니다
                </WalletHint>
              </WalletLabelRow>
              <Input
                id="sbmb-modal-wallet"
                type="number"
                inputMode="numeric"
                placeholder="예: 220"
                $tone={modalStep === "error_step2" ? "error" : "default"}
                $thickPrimary={modalStep !== "error_step2"}
                value={walletNo}
                onChange={(e) => setWalletNo(e.target.value)}
              />
            </FieldGroup>
            {modalStep === "error_step2" ? (
              <>
                <ErrorBox>
                  <ErrorTitle>지갑 번호가 확인되지 않습니다.</ErrorTitle>
                  <ErrorDesc>입력하신 번호를 다시 확인해주세요.</ErrorDesc>
                </ErrorBox>
                <ErrorActions>
                  <SecondaryBtn
                    type="button"
                    onClick={() => {
                      setWalletNo("");
                      setModalStep("step2");
                    }}
                  >
                    <IconRefreshCw size={16} color={T.textMuted} />
                    다시 시도
                  </SecondaryBtn>
                  <KakaoHalfBtn
                    href={SBMB_KAKAO_INQUIRY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconMessageCircle size={16} color={T.kakaoText} />
                    카카오 문의
                  </KakaoHalfBtn>
                </ErrorActions>
              </>
            ) : null}
            <PrimaryBtn
              type="button"
              $disabled={loading || !walletNo.trim()}
              onClick={handleVerify}
            >
              {loading ? <Spinner /> : null}
              조회하기
            </PrimaryBtn>
            {modalStep === "step2" ? (
              <Step2HelpBlock>
                <Step2KakaoTextLink
                  href={SBMB_KAKAO_INQUIRY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  지갑 번호가 기억나지 않으신가요? 춘심이 동생{" "}
                  <Step2KakaoLinkEm>카카오톡 문의하기 →</Step2KakaoLinkEm>
                </Step2KakaoTextLink>
              </Step2HelpBlock>
            ) : null}
            <GhostBtn type="button" onClick={onClose}>
              처음으로 돌아가기
            </GhostBtn>
            {/* {modalStep === "error_step2" && onOpenInquiryFlow ? (
              <InquiryFlowTextBtn type="button" onClick={onOpenInquiryFlow}>
                조회가 안되시나요? →
              </InquiryFlowTextBtn>
            ) : null} */}
          </>
        ) : null}

        {modalStep === "result" && result ? (
          <ResultCard
            result={result}
            onReset={handleResetInside}
            onDismissModal={onDismissNavigate}
          />
        ) : null}
      </Panel>
    </>,
    document.body,
  );
}
