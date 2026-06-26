"use client";

import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import * as S from "../styles";

export interface ScanHistoryRowProps {
  address: string;
  onRemove: (address: string) => void;
}

export function ScanHistoryRow({ address, onRemove }: ScanHistoryRowProps) {
  const { copiedKey, copy } = useCopyToClipboard();
  const copyKey = `row-${address}`;

  return (
    <S.ScanHistoryRowRoot>
      <S.ScanHistoryAddress>{address}</S.ScanHistoryAddress>
      <S.ScanHistoryRowActions>
        <S.ContractRefCopyButton
          type="button"
          $copied={copiedKey === copyKey}
          onClick={() => void copy(address, copyKey)}
        >
          {copiedKey === copyKey ? "복사됨" : "복사"}
        </S.ContractRefCopyButton>
        <S.ScanHistoryRemoveButton
          type="button"
          aria-label="목록에서 삭제"
          onClick={() => onRemove(address)}
        >
          ×
        </S.ScanHistoryRemoveButton>
      </S.ScanHistoryRowActions>
    </S.ScanHistoryRowRoot>
  );
}
