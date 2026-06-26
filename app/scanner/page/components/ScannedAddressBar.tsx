"use client";

import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import * as S from "../styles";

export interface ScannedAddressBarProps {
  address: string;
}

export function ScannedAddressBar({ address }: ScannedAddressBarProps) {
  const { copiedKey, copy } = useCopyToClipboard();

  return (
    <S.ScannedAddressRoot role="region" aria-label="스캔된 주소">
      <S.ScannedAddressLabel>스캔된 주소</S.ScannedAddressLabel>
      <S.PortfolioSummaryAddressRow>
        <S.PortfolioSummaryAddress>{address}</S.PortfolioSummaryAddress>
        <S.ContractRefCopyButton
          type="button"
          $copied={copiedKey === "scanned"}
          onClick={() => void copy(address, "scanned")}
        >
          {copiedKey === "scanned" ? "복사됨" : "복사"}
        </S.ContractRefCopyButton>
      </S.PortfolioSummaryAddressRow>
    </S.ScannedAddressRoot>
  );
}
