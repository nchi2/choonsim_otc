import Link from "next/link";
import styled, { css, keyframes } from "styled-components";
import { T } from "@/lib/sbmb/tokens";

/** 스캐너 페이지 레이아웃 — /sbmb와 동일 max-width·좌우 20px 패딩 */

export const ScannerTopBar = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 1.125rem;
  }
`;

export const ScannerBackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: color 0.15s ease;

  &:hover {
    color: #111827;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const ScannerPageWrapper = styled.div`
  width: 100%;
  max-width: ${T.maxWidth};
  margin: 0 auto;
  padding: 20px 20px 3rem;
  box-sizing: border-box;
  color: var(--foreground);
  font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;

  @media (min-width: 768px) {
    padding: 24px 20px 4rem;
  }
`;

export const ScannerSection = styled.section`
  width: 100%;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0px 6px 30px rgba(0, 0, 0, 0.06);

  @media (min-width: 768px) {
    padding: 1.75rem;
    margin-bottom: 1.5rem;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem;
  line-height: 1.3;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

export const SectionLead = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.25rem;
  }
`;

/** 스캔 폼 — STEP 4 */

export const ScannerForm = styled.form`
  margin: 0 0 0.75rem;
`;

export const ScannerFormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: stretch;
    gap: 0.75rem;
  }
`;

export const ScannerInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: #fff;
  color: #111827;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }

  &:disabled {
    background: #f3f4f6;
    color: #6b7280;
  }

  @media (min-width: 768px) {
    padding: 0.6875rem 0.875rem;
    font-size: 0.9375rem;
  }
`;

export const ScannerSubmitButton = styled.button`
  font-family: inherit;
  cursor: pointer;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 0.375rem;
  white-space: nowrap;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    cursor: not-allowed;
    background: #93c5fd;
  }

  @media (min-width: 640px) {
    flex-shrink: 0;
    align-self: stretch;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const ScannerSecurityNote = styled.p`
  margin: 0.75rem 0 0;
  font-size: 0.6875rem;
  line-height: 1.5;
  color: #9ca3af;

  @media (min-width: 768px) {
    font-size: 0.75rem;
  }
`;

/** 지갑 실사용 안내 — 공개 주소 조회 한계 및 Trust Wallet 가이드 */
export const ScannerUsageNoticeTitle = styled.h3`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem;
  line-height: 1.35;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    font-size: 1rem;
    margin-bottom: 0.625rem;
  }
`;

export const ScannerUsageNoticeText = styled.p`
  margin: 0 0 1rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #4b5563;

  @media (min-width: 768px) {
    font-size: 0.875rem;
    margin-bottom: 1.125rem;
  }
`;

export const ScannerGuideLinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  padding: 0.625rem 1.25rem;
  background: #2563eb;
  border-radius: 0.375rem;
  transition: background 0.15s ease;

  &:hover {
    background: #1d4ed8;
  }

  @media (min-width: 768px) {
    padding: 0.6875rem 1.375rem;
  }
`;

export const ScannerContractsCrossText = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: #4b5563;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

export const ScannerContractsCrossLink = styled(Link)`
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: #1d4ed8;
    border-bottom-color: #93c5fd;
  }
`;



/** ERC-20 컨트랙트 참조 — 이름·소개·주소·복사 */
export const ContractRefList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin: 0;

  @media (min-width: 768px) {
    gap: 1rem;
  }
`;

export const ContractRefCard = styled.article`
  margin: 0;
  padding: 0.875rem 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  border-left: 3px solid var(--scanner-tier-ours, #2563eb);

  @media (min-width: 768px) {
    padding: 1rem 1.125rem;
  }
`;

export const ContractRefHeading = styled.h3`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.375rem;
  line-height: 1.35;
  letter-spacing: -0.02em;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.375rem 0.5rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const ContractRefChainBadge = styled.span`
  font-size: 0.6875rem;
  font-weight: 600;
  color: #4b5563;
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  letter-spacing: 0.02em;
`;

export const ContractRefIntro = styled.p`
  font-size: 0.8125rem;
  line-height: 1.55;
  color: #6b7280;
  margin: 0 0 0.625rem;

  @media (min-width: 768px) {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }
`;

export const ContractRefAddressRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }
`;

export const ContractRefAddress = styled.code`
  display: block;
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.45;
  word-break: break-all;
  color: #111827;
  background: #f9fafb;
  padding: 0.5rem 0.625rem;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    font-size: 0.8125rem;
  }
`;

export const ContractRefAddressPending = styled(ContractRefAddress)`
  color: #9ca3af;
  font-style: italic;
`;

export const ContractRefCopyButton = styled.button<{ $copied?: boolean }>`
  flex-shrink: 0;
  font-family: inherit;
  cursor: pointer;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${(p) => (p.$copied ? "#15803d" : "#fff")};
  background: ${(p) => (p.$copied ? "#dcfce7" : "#2563eb")};
  border: 1px solid ${(p) => (p.$copied ? "#86efac" : "transparent")};
  border-radius: 0.375rem;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$copied ? "#bbf7d0" : "#1d4ed8")};
  }

  &:disabled {
    cursor: not-allowed;
    background: #e5e7eb;
    color: #9ca3af;
    border-color: #e5e7eb;
  }

  @media (min-width: 640px) {
    align-self: flex-start;
  }
`;

/** QR — 스캔 유도 후 버튼으로 카메라 시작 */
export const QrScannerBlock = styled.div`
  margin: 0 0 1rem;
`;

export const QrVideoWrap = styled.div`
  position: relative;
  width: 100%;
  border-radius: 0.375rem;
  overflow: hidden;
  border: 1px solid #d1d5db;
  background: #0f172a;
  aspect-ratio: 4 / 3;
  max-height: 260px;
`;

export const QrVideo = styled.video`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/** 스캔 유도 — 카메라 꺼진 상태 (grid로 영역 정중앙 고정) */
export const QrGuideOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 0.75rem;
  background: linear-gradient(165deg, #1e293b 0%, #0f172a 55%, #020617 100%);
`;

export const QrGuideInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  max-height: 100%;
  width: 100%;
  max-width: 16rem;
`;

export const QrGuideFrame = styled.div`
  flex-shrink: 0;
  width: min(52%, 10rem);
  aspect-ratio: 1;
  border: 2px dashed rgba(148, 163, 184, 0.55);
  border-radius: 0.625rem;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
`;

export const QrStartButton = styled.button`
  flex-shrink: 0;
  font-family: inherit;
  cursor: pointer;
  padding: 0.5rem 1.125rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 0.375rem;
  transition: background 0.15s ease;

  &:hover {
    background: #1d4ed8;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.45);
  }
`;

/** 카메라 켜진 뒤 프레임 가이드 — 중앙 정사각형·고정 상한으로 PC에서도 과도하게 커지지 않음 */
export const QrScanHud = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
`;

export const QrScanCorners = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(9.25rem, 52%);
  aspect-ratio: 1;
  max-height: 78%;
  border-radius: 0.45rem;
  box-shadow:
    inset 1.5px 1.5px 0 0 rgba(96, 165, 250, 0.65),
    inset -1.5px 1.5px 0 0 rgba(96, 165, 250, 0.65),
    inset 1.5px -1.5px 0 0 rgba(96, 165, 250, 0.65),
    inset -1.5px -1.5px 0 0 rgba(96, 165, 250, 0.65);
  opacity: 0.76;
`;

export const QrPausedOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.72);
  color: #f8fafc;
  font-size: 0.8125rem;
  font-weight: 600;
`;

export const QrStopRow = styled.div`
  margin: 0.5rem 0 0;
  display: flex;
  justify-content: flex-end;
`;

export const QrStopButton = styled.button`
  font-family: inherit;
  cursor: pointer;
  padding: 0.375rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #475569;
  }
`;

export const QrScannerHint = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.6875rem;
  color: #6b7280;
  line-height: 1.45;
`;

export const QrScannerError = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: #dc2626;
`;

/** 조회 가능 토큰 목록 */
export const SupportedTokensBox = styled.div`
  margin: 0;
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;

  @media (min-width: 768px) {
    padding: 1.125rem;
  }
`;

export const SupportedTokensTitle = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;

  @media (min-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 0.4rem;
  }
`;

export const SupportedTokensHint = styled.p`
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #6b7280;

  @media (min-width: 768px) {
    font-size: 0.6875rem;
    line-height: 1.4;
  }
`;

/** 모바일: 세로 스택 · PC: Ethereum → Base → BNB 가로 3열 */
export const SupportedTokensChainsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
    gap: 0.625rem 0.875rem;
  }
`;

export const SupportedTokensChainBlock = styled.div`
  flex: 1 1 0;
  min-width: 0;

  @media (min-width: 768px) {
    padding-right: 0.25rem;
    border-right: 1px solid #f3f4f6;

    &:last-child {
      padding-right: 0;
      border-right: none;
    }
  }
`;

export const SupportedTokensChainName = styled.h4`
  margin: 0 0 0.3rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #374151;

  @media (min-width: 768px) {
    font-size: 0.72rem;
    margin-bottom: 0.25rem;
  }
`;

export const SupportedTokensList = styled.ul`
  margin: 0;
  padding-left: 1.125rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #4b5563;

  @media (min-width: 768px) {
    font-size: 0.68rem;
    padding-left: 0.95rem;
    line-height: 1.38;
  }
`;

export const SupportedTokensLi = styled.li`
  margin-bottom: 0.125rem;
`;

/** TokenRow — 3.2.1 */

export const TokenRowRoot = styled.div<{
  $borderVar: string;
  $tint: "ours" | "otaverse" | "neutral";
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  border-left: 3px solid var(${(p) => p.$borderVar});
  margin-bottom: 0.5rem;

  ${(p) =>
    p.$tint === "ours"
      ? css`
          background: #f8fafc;
        `
      : p.$tint === "otaverse"
        ? css`
            background: #faf5ff;
          `
        : css`
            background: #ffffff;
          `}

  @media (min-width: 768px) {
    padding: 0.75rem 1rem;
    margin-bottom: 0.625rem;
  }
`;

export const TokenRowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
  flex: 1;
`;

export const TokenRowIcon = styled.div<{ $colorVar: string; $image?: boolean }>`
  flex-shrink: 0;
  width: 2.375rem;
  height: 2.375rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #111827;
  overflow: hidden;
  background: ${(p) =>
    p.$image ? "transparent" : `color-mix(in srgb, var(${p.$colorVar}) 28%, #ffffff)`};
  border: none;
  padding: 0;

  @media (min-width: 768px) {
    width: 2.625rem;
    height: 2.625rem;
    font-size: 0.7rem;
  }
`;

export const TokenRowIconImg = styled.img<{ $scale?: number }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transform: scale(${(p) => p.$scale ?? 1});
  transform-origin: center center;
`;

export const TokenRowMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

export const TokenRowSymbol = styled.span`
  font-weight: 700;
  font-size: 0.9375rem;
  color: #111827;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const TokenRowNetwork = styled.span`
  font-size: 0.75rem;
  color: #6b7280;

  @media (min-width: 768px) {
    font-size: 0.8125rem;
  }
`;

export const TokenRowRight = styled.div`
  flex-shrink: 0;
  text-align: right;
`;

export const TokenRowAmount = styled.span`
  font-weight: 600;
  font-size: 0.9375rem;
  color: #374151;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const TokenRowSymbolSuffix = styled.span`
  font-weight: 500;
  margin-left: 0.25rem;
  font-size: 0.8125rem;
  color: #6b7280;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

/** NetworkTab — 3.3.1 */

export const NetworkTabBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    gap: 0.625rem;
    margin-bottom: 1.25rem;
  }
`;

export const NetworkTabButton = styled.button<{
  $active: boolean;
  $tone: "all" | "eth" | "base" | "bsc";
}>`
  font-family: inherit;
  cursor: pointer;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  @media (min-width: 768px) {
    padding: 0.5625rem 0.875rem;
    font-size: 0.8125rem;
  }

  ${(p) =>
    p.$active &&
    p.$tone === "all" &&
    css`
      background: #f3f4f6;
      border-color: #6b7280;
      color: #111827;
    `}

  ${(p) =>
    p.$active &&
    p.$tone === "eth" &&
    css`
      background: color-mix(in srgb, var(--scanner-native-eth) 14%, #fff);
      border-color: var(--scanner-native-eth);
      color: #1e3a8a;
    `}

  ${(p) =>
    p.$active &&
    p.$tone === "base" &&
    css`
      background: color-mix(in srgb, var(--scanner-native-base) 14%, #fff);
      border-color: var(--scanner-native-base);
      color: #1e40af;
    `}

  ${(p) =>
    p.$active &&
    p.$tone === "bsc" &&
    css`
      background: color-mix(in srgb, var(--scanner-native-bsc) 18%, #fff);
      border-color: var(--scanner-native-bsc);
      color: #92400e;
    `}

  &:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
`;

/** StatusMessage — 3.4.1 */

const statusSpin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const StatusMessageRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 0.75rem;
  text-align: center;

  @media (min-width: 768px) {
    padding: 1.25rem 1rem;
  }
`;

export const StatusSpinner = styled.span`
  flex-shrink: 0;
  width: 1.375rem;
  height: 1.375rem;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ${statusSpin} 0.65s linear infinite;
`;

export const StatusMessageText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #4b5563;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const StatusMessageError = styled.p`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #b91c1c;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

export const StatusEmptyIconWrap = styled.span`
  flex-shrink: 0;
  display: flex;
  color: #9ca3af;
`;

export const StatusMessageDemoStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px dashed #e5e7eb;
`;

/** PortfolioSummary — 3.5.1 */

export const PortfolioSummaryRoot = styled.div`
  padding: 1rem;
  margin-bottom: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;

  @media (min-width: 768px) {
    padding: 1.25rem;
  }
`;

export const PortfolioSummaryAddress = styled.p`
  margin: 0 0 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  word-break: break-all;

  @media (min-width: 768px) {
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
`;

export const PortfolioSummaryStats = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
`;

export const PortfolioSummaryStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const PortfolioSummaryStatLabel = styled.span`
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;

  @media (min-width: 768px) {
    font-size: 0.75rem;
  }
`;

export const PortfolioSummaryStatValue = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #111827;

  @media (min-width: 768px) {
    font-size: 1.0625rem;
  }
`;
