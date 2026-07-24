"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import { PublicShell } from "@/components/education/PublicShell";
import SbmbHeroBanner from "@/components/sbmb/hero/SbmbHeroBanner";
import { NetworkTab } from "./page/components/NetworkTab";
import { SupportedTokensOverview } from "./page/components/SupportedTokensOverview";
import { PortfolioSummary } from "./page/components/PortfolioSummary";
import { ScannedAddressBar } from "./page/components/ScannedAddressBar";
import { RecentUpdatesNotice } from "./page/components/RecentUpdatesNotice";
import { StatusMessage } from "./page/components/StatusMessage";
import { TokenRow } from "./page/components/TokenRow";
import { NftStakeRow } from "./page/components/NftStakeRow";
import { ChainScanProgress } from "./page/components/ChainScanProgress";
import { WalletQrScanner } from "./page/components/WalletQrScanner";
import {
  ScanModeToggle,
  type ScanMode,
} from "./page/components/ScanModeToggle";
import { ContinuousScanPanel } from "./page/components/ContinuousScanPanel";
import { isLdtStakeNft, SCANNER_NETWORK_ORDER } from "./lib/tokens";
import { addressDedupKey, isValidAddress } from "./lib/utils";
import { useScanner } from "./page/hooks/useScanner";
import * as S from "./page/styles";

function scanCollectFeedback() {
  try {
    navigator.vibrate?.(40);
  } catch {
    /* 권한 없음 등 */
  }
}

export default function ScannerPage() {
  const [input, setInput] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>("single");
  const [collectedAddresses, setCollectedAddresses] = useState<string[]>([]);
  const [successFlashTick, setSuccessFlashTick] = useState(0);
  const collectedKeysRef = useRef(new Set<string>());

  const {
    scannedAddress,
    status,
    results,
    chainStatus,
    activeTab,
    setActiveTab,
    errorMessage,
    handleScan,
    retryChain,
    filteredResults,
  } = useScanner();

  const isContinuous = scanMode === "continuous";
  const hasAnyBalance = results.some((r) => r.balance > 0);
  const showScannedAddress =
    !isContinuous && status !== "idle" && scannedAddress.length > 0;
  // 점진 표시(Step: scanner-speed): 도착한 체인 잔고를 즉시 보여주고, 남은 체인은 진행 표시로.
  const anyChainLoading = SCANNER_NETWORK_ORDER.some(
    (n) => chainStatus[n] === "loading",
  );
  const anyChainFailed = SCANNER_NETWORK_ORDER.some(
    (n) => chainStatus[n] === "timeout" || chainStatus[n] === "error",
  );
  const scanActive = status === "loading" || status === "done";
  // 하나라도 잔고가 잡히면(체인 도착) 즉시 결과 UI 노출 — 전체 완료를 기다리지 않는다.
  const showResultsChrome = !isContinuous && hasAnyBalance;
  // 조회 중·지연·실패 체인이 있으면 체인별 진행/재시도 표시.
  const showChainProgress =
    !isContinuous && scanActive && (anyChainLoading || anyChainFailed);
  // 모든 체인이 정상 종료됐는데 잔고가 하나도 없을 때만 "보유 없음".
  const showEmpty =
    !isContinuous &&
    status === "done" &&
    !anyChainLoading &&
    !anyChainFailed &&
    !hasAnyBalance;

  const clearCollected = useCallback(() => {
    collectedKeysRef.current.clear();
    setCollectedAddresses([]);
  }, []);

  const handleScanModeChange = useCallback(
    (mode: ScanMode) => {
      clearCollected();
      setScanMode(mode);
    },
    [clearCollected],
  );

  const addCollectedAddress = useCallback((addr: string) => {
    if (!isValidAddress(addr)) return;
    const key = addressDedupKey(addr);
    if (collectedKeysRef.current.has(key)) return;
    collectedKeysRef.current.add(key);
    setCollectedAddresses((prev) => [...prev, addr]);
    setSuccessFlashTick((t) => t + 1);
    scanCollectFeedback();
  }, []);

  const removeCollectedAddress = useCallback((addr: string) => {
    const key = addressDedupKey(addr);
    collectedKeysRef.current.delete(key);
    setCollectedAddresses((prev) =>
      prev.filter((a) => addressDedupKey(a) !== key),
    );
  }, []);

  const onSubmitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isContinuous) return;
    void handleScan(input);
  };

  const onQrDetected = useCallback(
    (addr: string) => {
      if (isContinuous) {
        addCollectedAddress(addr);
        return;
      }
      setInput(addr);
      void handleScan(addr);
    },
    [isContinuous, addCollectedAddress, handleScan],
  );

  return (
    <PublicShell fullWidth showTicker={false}>
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

          <ScanModeToggle mode={scanMode} onChange={handleScanModeChange} />

          <WalletQrScanner
            onDetected={onQrDetected}
            paused={!isContinuous && status === "loading"}
            continuous={isContinuous}
            successFlashTick={successFlashTick}
          />

          {isContinuous ? (
            <ContinuousScanPanel
              addresses={collectedAddresses}
              onRemove={removeCollectedAddress}
              onClear={clearCollected}
            />
          ) : (
            <>
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

              {showScannedAddress ? (
                <ScannedAddressBar address={scannedAddress} />
              ) : null}

              {status === "error" && (
                <StatusMessage state="error" message={errorMessage} />
              )}

              {showResultsChrome && (
                <>
                  <NetworkTab active={activeTab} onChange={setActiveTab} />
                  <PortfolioSummary results={results} />
                  {filteredResults
                    .filter((row) => !isLdtStakeNft(row))
                    .map((row) => (
                      <TokenRow
                        key={`${row.symbol}-${row.network}-${row.address}`}
                        token={row}
                        balance={row.balance}
                      />
                    ))}
                  <NftStakeRow
                    items={filteredResults.filter((row) => isLdtStakeNft(row))}
                  />
                </>
              )}

              {showChainProgress && (
                <ChainScanProgress
                  chainStatus={chainStatus}
                  onRetry={retryChain}
                />
              )}

              {showEmpty && <StatusMessage state="empty" />}
            </>
          )}
        </S.ScannerSection>

        <RecentUpdatesNotice />

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
    </PublicShell>
  );
}
