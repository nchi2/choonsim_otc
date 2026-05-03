"use client";

import { useCallback, useState, type FormEvent } from "react";
import PageLayout from "@/components/layouts/PageLayout";
import SbmbHeroBanner from "@/components/sbmb/hero/SbmbHeroBanner";
import { NetworkTab } from "./page/components/NetworkTab";
import { SupportedTokensOverview } from "./page/components/SupportedTokensOverview";
import { PortfolioSummary } from "./page/components/PortfolioSummary";
import { StatusMessage } from "./page/components/StatusMessage";
import { TokenRow } from "./page/components/TokenRow";
import { WalletQrScanner } from "./page/components/WalletQrScanner";
import { useScanner } from "./page/hooks/useScanner";
import * as S from "./page/styles";

export default function ScannerPage() {
  const [input, setInput] = useState("");
  const {
    address,
    status,
    results,
    activeTab,
    setActiveTab,
    errorMessage,
    handleScan,
    filteredResults,
  } = useScanner();

  const hasAnyBalance = results.some((r) => r.balance > 0);
  const showResultsChrome = status === "done" && hasAnyBalance;

  const onSubmitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleScan(input);
  };

  const onQrDetected = useCallback(
    (addr: string) => {
      setInput(addr);
      void handleScan(addr);
    },
    [handleScan],
  );

  return (
    <PageLayout>
      <SbmbHeroBanner />
      <S.ScannerPageWrapper>
        <S.ScannerTopBar>
          <S.ScannerBackLink href="/sbmb" aria-label="SBMB 페이지로 이동">
            SBMB로 →
          </S.ScannerBackLink>
        </S.ScannerTopBar>
        <S.ScannerSection aria-label="EVM wallet scanner">
          <S.SectionTitle>EVM Wallet Scanner</S.SectionTitle>
          <S.SectionLead>
            여러 체인의 네이티브·토큰 잔고를 한 화면에서 조회합니다.
          </S.SectionLead>

          <WalletQrScanner
            onDetected={onQrDetected}
            paused={status === "loading"}
          />

          <S.ScannerForm onSubmit={onSubmitForm}>
            <S.ScannerFormRow>
              <S.ScannerInput
                name="wallet"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="0x... 지갑 주소를 입력하세요"
                value={input}
                disabled={status === "loading"}
                onChange={(e) => setInput(e.target.value)}
              />
              <S.ScannerSubmitButton
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? "조회 중…" : "SCAN"}
              </S.ScannerSubmitButton>
            </S.ScannerFormRow>
            <S.ScannerSecurityNote>
              공공장소에서 화면 노출에 주의하세요. 이 앱은 입력한 주소를
              저장하지 않습니다.
            </S.ScannerSecurityNote>
          </S.ScannerForm>

          {status === "loading" && <StatusMessage state="loading" />}

          {status === "error" && (
            <StatusMessage state="error" message={errorMessage} />
          )}

          {status === "done" && !hasAnyBalance && (
            <StatusMessage state="empty" />
          )}

          {showResultsChrome && (
            <>
              <NetworkTab active={activeTab} onChange={setActiveTab} />
              <PortfolioSummary results={results} address={address} />
              {filteredResults.map((row) => (
                <TokenRow
                  key={`${row.symbol}-${row.network}-${row.address}`}
                  token={row}
                  balance={row.balance}
                />
              ))}
            </>
          )}
        </S.ScannerSection>

        <S.ScannerSection aria-label="이 페이지에서 조회 가능한 토큰 안내">
          <SupportedTokensOverview />
        </S.ScannerSection>

        <S.ScannerSection aria-label="컨트랙트 주소 및 지갑에 토큰 추가">
          <S.ScannerUsageNoticeTitle>
            컨트랙트 주소 · 토큰 추가
          </S.ScannerUsageNoticeTitle>
          <S.ScannerContractsCrossText>
            체인별 ERC-20 컨트랙트 주소 확인·복사, 지갑 앱 내 브라우저에서 토큰
            추가는{" "}
            <S.ScannerContractsCrossLink href="/contracts">
              /contracts
            </S.ScannerContractsCrossLink>
            페이지에서 하실 수 있습니다.
          </S.ScannerContractsCrossText>
        </S.ScannerSection>

        <S.ScannerSection aria-label="공개 주소 조회 한계 및 Trust Wallet 안내">
          <S.ScannerUsageNoticeTitle>지갑 사용 안내</S.ScannerUsageNoticeTitle>
          <S.ScannerUsageNoticeText>
            이 페이지는 <strong>공개 주소</strong>를 통해 해당 지갑의 잔고만
            확인할 수 있습니다. 송금·거래 등 실제 사용은{" "}
            <strong>Trust Wallet</strong>에서 진행해 주세요.
          </S.ScannerUsageNoticeText>
          <S.ScannerGuideLinkButton
            href="https://choonsim.gitbook.io/sbmb_introduce/5.-evm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Trust Wallet 가이드 바로가기
          </S.ScannerGuideLinkButton>
        </S.ScannerSection>
      </S.ScannerPageWrapper>
    </PageLayout>
  );
}
