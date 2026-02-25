"use client";

import { useState, useCallback } from "react";
import styled from "styled-components";
import Link from "next/link";

const colors = {
  bg: "#0a0e17",
  bgCard: "#111827",
  surface: "#1a2234",
  gold: "#d4af37",
  goldLight: "#f5e6c8",
  accent: "#c9a227",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  border: "#374151",
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: ${colors.bg};
  color: ${colors.text};
`;

const TopBar = styled.header`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${colors.border};

  @media (min-width: 768px) {
    padding: 1.25rem 2.5rem;
  }
`;

const TopBarLink = styled(Link)`
  color: ${colors.goldLight};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0.9;

  &:hover {
    opacity: 1;
  }
`;

const Main = styled.main`
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;

  @media (min-width: 768px) {
    padding: 3rem 2rem 5rem;
  }
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 3rem;

  @media (min-width: 768px) {
    margin-bottom: 4rem;
  }
`;

const LogoWrapper = styled.div`
  margin-bottom: 1.5rem;

  img {
    width: 64px;
    height: 64px;
  }

  @media (min-width: 768px) {
    img {
      width: 80px;
      height: 80px;
    }
  }
`;

const HeroTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${colors.text};
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;

  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1rem;
  color: ${colors.gold};
  margin: 0 0 1.5rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const HeroParagraph = styled.p`
  font-size: 0.9375rem;
  line-height: 1.7;
  color: ${colors.textMuted};
  margin: 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const Section = styled.section`
  margin-bottom: 2.5rem;

  @media (min-width: 768px) {
    margin-bottom: 3rem;
  }
`;

const SectionHeading = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${colors.gold};
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${colors.border};

  @media (min-width: 768px) {
    font-size: 1.375rem;
  }
`;

const SectionText = styled.p`
  font-size: 0.9375rem;
  line-height: 1.7;
  color: ${colors.textMuted};
  margin: 0 0 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TokenGrid = styled.div`
  display: grid;
  gap: 0.75rem;
  background-color: ${colors.bgCard};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 1.25rem 1.5rem;

  @media (min-width: 768px) {
    padding: 1.5rem 2rem;
  }
`;

const TokenRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`;

const TokenLabel = styled.span`
  font-size: 0.8125rem;
  color: ${colors.textMuted};
  min-width: 140px;
`;

const TokenValue = styled.span`
  font-size: 0.9375rem;
  color: ${colors.text};
  font-family: ui-monospace, monospace;
  word-break: break-all;
`;

const ContractAddressRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
`;

const ContractWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ContractAddress = styled.code`
  font-size: 0.8125rem;
  color: ${colors.goldLight};
  background-color: ${colors.surface};
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  word-break: break-all;
  font-family: ui-monospace, monospace;
`;

const CopyButton = styled.button`
  background-color: ${colors.gold};
  color: ${colors.bg};
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.8;
  }
`;

const BaseScanButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${colors.gold};
  color: ${colors.bg};
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.5rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  @media (min-width: 640px) {
    margin-top: 0;
    margin-left: 0.5rem;
  }
`;

const DeclarationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const DeclarationItem = styled.li`
  font-size: 0.9375rem;
  line-height: 1.7;
  color: ${colors.textMuted};
  padding-left: 1.25rem;
  position: relative;
  margin-bottom: 0.5rem;

  &::before {
    content: "•";
    position: absolute;
    left: 0;
    color: ${colors.gold};
  }
`;

const TeamCard = styled.div`
  background-color: ${colors.bgCard};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 1.5rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const TeamName = styled.span`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${colors.gold};
  display: block;
  margin-bottom: 0.25rem;
`;

const TeamRole = styled.span`
  font-size: 0.875rem;
  color: ${colors.textMuted};
  display: block;
  margin-bottom: 1rem;
`;

const TeamLink = styled.a`
  font-size: 0.875rem;
  color: ${colors.goldLight};
  text-decoration: none;
  display: block;
  margin-bottom: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 2rem 1.5rem;
  border-top: 1px solid ${colors.border};
  font-size: 0.8125rem;
  color: ${colors.textMuted};
`;

const LDT_CONTRACT = "0x504B262539d3A4194d0649f69Fe3cCA06D5bB24a";
const BASESCAN_URL = `https://basescan.org/token/${LDT_CONTRACT}`;

export default function LDTPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(LDT_CONTRACT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  return (
    <PageWrapper>
      <TopBar>
        <TopBarLink href="https://choonsim.com">← Choonsim</TopBarLink>
      </TopBar>

      <Main>
        <HeroSection>
          <LogoWrapper>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo_LDT.svg"
              alt="Lucem Diffundo Token Logo"
              width={80}
              height={80}
            />
          </LogoWrapper>
          <HeroTitle>Lucem Diffundo Token</HeroTitle>
          <HeroSubtitle>
            Commemorative Training Token for the BTCMOBICK New Bedford Upgrade
          </HeroSubtitle>
          <HeroParagraph>
            Lucem Diffundo, meaning &quot;to spread light,&quot; is derived from
            the official motto of New Bedford. LDT was issued by the Choonsim
            Team to commemorate the BTCMOBICK New Bedford Upgrade and the
            expansion of the ecosystem into EVM-based Web3 infrastructure.
          </HeroParagraph>
        </HeroSection>

        <Section>
          <SectionHeading>Token Information</SectionHeading>
          <TokenGrid>
            <TokenRow>
              <TokenLabel>Token Name</TokenLabel>
              <TokenValue>Lucem Diffundo Token</TokenValue>
            </TokenRow>
            <TokenRow>
              <TokenLabel>Symbol</TokenLabel>
              <TokenValue>LDT</TokenValue>
            </TokenRow>
            <TokenRow>
              <TokenLabel>Network</TokenLabel>
              <TokenValue>Base (EVM)</TokenValue>
            </TokenRow>
            <TokenRow>
              <TokenLabel>Total Supply</TokenLabel>
              <TokenValue>9,999,999</TokenValue>
            </TokenRow>
            <TokenRow>
              <TokenLabel>Contract Address</TokenLabel>
              <ContractAddressRow>
                <ContractWrapper>
                  <ContractAddress>{LDT_CONTRACT}</ContractAddress>
                  <CopyButton onClick={handleCopy} type="button">
                    {copied ? "Copied" : "Copy"}
                  </CopyButton>
                </ContractWrapper>
                <BaseScanButton href={BASESCAN_URL} target="_blank" rel="noopener noreferrer">
                  View on BaseScan →
                </BaseScanButton>
              </ContractAddressRow>
            </TokenRow>
          </TokenGrid>
        </Section>

        <Section>
          <SectionHeading>Purpose of LDT</SectionHeading>
          <SectionText>
            LDT is a non-financial training token issued for educational and
            ecosystem onboarding purposes.
          </SectionText>
          <SectionText>
            It is designed to help participants practice:
          </SectionText>
          <DeclarationList>
            <DeclarationItem>EVM wallet management</DeclarationItem>
            <DeclarationItem>Token transfers</DeclarationItem>
            <DeclarationItem>Smart contract interaction</DeclarationItem>
            <DeclarationItem>Approval (approve) transactions</DeclarationItem>
            <DeclarationItem>Safe Web3 onboarding</DeclarationItem>
          </DeclarationList>
          <SectionText>
            LDT has no intended market value and does not represent ownership,
            investment rights, or financial claims. It is strictly a training and
            commemorative token.
          </SectionText>
        </Section>

        <Section>
          <SectionHeading>Distribution Model</SectionHeading>
          <SectionText>
            LDT is distributed in fixed amounts of 99 tokens per EVM paper
            wallet. Tokens are airdropped to ecosystem participants who join
            events and onboarding programs within the Choonsim ecosystem.
          </SectionText>
          <SectionText>
            This distribution model reinforces wallet management discipline and
            Web3 security training.
          </SectionText>
        </Section>

        <Section>
          <SectionHeading>Ecosystem Context</SectionHeading>
          <SectionText>
            LDT functions as a preparatory training layer before interaction with
            value-bearing assets such as:
          </SectionText>
          <DeclarationList>
            <DeclarationItem>
              <strong>WBMB (Wrapped BMB)</strong> — Official Otaverse wrapping
              token
            </DeclarationItem>
            <DeclarationItem>
              <strong>SBMB</strong> — Choonsim Console Tokenization Asset
            </DeclarationItem>
          </DeclarationList>
          <SectionText>
            Participants are encouraged to use LDT to practice safely before
            interacting with ecosystem assets that carry economic value.
          </SectionText>
        </Section>

        <Section>
          <SectionHeading>Official Declaration</SectionHeading>
          <SectionText>
            Lucem Diffundo Token (LDT):
          </SectionText>
          <DeclarationList>
            <DeclarationItem>Is not an investment product</DeclarationItem>
            <DeclarationItem>Has no public sale</DeclarationItem>
            <DeclarationItem>Has no private sale</DeclarationItem>
            <DeclarationItem>Has no ICO or IEO</DeclarationItem>
            <DeclarationItem>Is not intended for speculation</DeclarationItem>
          </DeclarationList>
          <SectionText>
            Choonsim Team does not encourage any trading or investment behavior
            related to LDT. This token exists solely for ecosystem training and
            commemorative purposes.
          </SectionText>
        </Section>

        <Section>
          <SectionHeading>Issued by</SectionHeading>
          <TeamCard>
            <TeamName>Design Team: Choonsim</TeamName>
            <TeamLink href="https://choonsim.com">Official Website: https://choonsim.com</TeamLink>
            <TeamLink href="mailto:contact@choonsim.com">
              Official Contact: contact@choonsim.com
            </TeamLink>
          </TeamCard>
        </Section>
      </Main>

      <Footer>© 2026 Choonsim Team. All rights reserved.</Footer>
    </PageWrapper>
  );
}
