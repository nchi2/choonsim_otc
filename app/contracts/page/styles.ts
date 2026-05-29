import Link from "next/link";
import styled, { css } from "styled-components";
import { T } from "@/lib/sbmb/tokens";

export const ContractsTopBar = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 1.125rem;
  }
`;

export const ContractsBackLink = styled(Link)`
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

export const PageWrap = styled.div`
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

export const Hero = styled.header`
  margin-bottom: 1.5rem;
`;

export const Title = styled.h1`
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem;
  line-height: 1.3;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    font-size: 1.65rem;
  }
`;

export const Lead = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.55;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const CrossNav = styled.p`
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

export const CrossNavLink = styled(Link)`
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

export const WalletGuideBox = styled.div`
  background: #fefce8;
  border: 1px solid #fde047;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  margin-bottom: 1.25rem;
  font-size: 0.8125rem;
  color: #713f12;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

export const WalletGuideActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.65rem;
`;

export const WalletGuideOpenButton = styled.button`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid #ca8a04;
  background: #fffbeb;
  color: #854d0e;
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: #fef3c7;
  }
`;

export const Section = styled.section`
  margin-bottom: 2rem;
`;

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
  margin: 0 -0.25rem;
  border-radius: 1rem;
  background: #f1f3f5;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
    padding: 1.25rem;
  }
`;

const tokenCardMixin = css`
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 0.75rem;
  padding: 1.25rem 1.35rem;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 4px 24px rgba(15, 23, 42, 0.06);

  @media (min-width: 768px) {
    padding: 1.35rem 1.5rem;
  }
`;

export const TokenCardRoot = styled.article`
  ${tokenCardMixin}
`;

export const TokenCardTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  margin-bottom: 0.35rem;
`;

export const TokenName = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
`;

export const TokenSymbol = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
`;

export const TokenIntro = styled.p`
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 1rem;
  line-height: 1.45;
`;

/* Chain contract card — colored header + address body as one unit. */
export const ChainContractCardRoot = styled.div`
  border: 0.5px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;

  & + & {
    margin-top: 0.65rem;
  }
`;

export const ChainContractCardHeader = styled.div<{
  $headerBg: string;
  $textColor: string;
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 7px 12px;
  background: ${(p) => p.$headerBg};
  color: ${(p) => p.$textColor};
  box-sizing: border-box;
`;

export const ChainContractCardDot = styled.span<{ $dotColor: string }>`
  width: 9px;
  height: 9px;
  border-radius: 9999px;
  background: ${(p) => p.$dotColor};
  flex-shrink: 0;
`;

export const ChainContractCardName = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

export const ChainContractCardHeaderSpacer = styled.span`
  flex: 1;
`;

export const PreparingBadge = styled.span`
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  background: #e5e7eb;
  padding: 0.18rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid #d1d5db;
`;

export const ChainContractCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 12px;
  background: #fff;
`;

export const AddressLine = styled.div`
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.72rem;
  font-weight: 600;
  word-break: break-all;
  color: #111827;
  background: #fafafa;
  border: 1px solid #eceef2;
  border-radius: 0.5rem;
  padding: 0.5rem 0.6rem;
`;

export const RowActionsWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.6rem;
`;

export const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const pillOutlineBlue = css`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.45rem 1rem;
  border-radius: 9999px;
  border: 1px solid #93c5fd;
  background: #fff;
  color: #2563eb;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;

  &:hover:not(:disabled) {
    background: #eff6ff;
    border-color: #60a5fa;
    color: #1d4ed8;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const GhostButton = styled.button`
  ${pillOutlineBlue}
`;

export const ExplorerLink = styled.a<{ $inactive?: boolean }>`
  ${pillOutlineBlue}
  display: inline-flex;
  align-items: center;
  text-decoration: none;

  ${(p) =>
    p.$inactive
      ? css`
          pointer-events: none;
          opacity: 0.45;
          cursor: not-allowed;
        `
      : ""}
`;

export const CopiedHint = styled.span`
  display: block;
  width: 100%;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #059669;
`;
