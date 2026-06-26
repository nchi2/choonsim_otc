"use client";

import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { ScanHistoryRow } from "./ScanHistoryRow";
import * as S from "../styles";

export interface ContinuousScanPanelProps {
  addresses: string[];
  onRemove: (address: string) => void;
  onClear: () => void;
}

export function ContinuousScanPanel({
  addresses,
  onRemove,
  onClear,
}: ContinuousScanPanelProps) {
  const { copiedKey, copy } = useCopyToClipboard();

  const onCopyAll = () => {
    if (addresses.length === 0) return;
    void copy(addresses.join("\n"), "all");
  };

  return (
    <S.ContinuousScanPanel role="region" aria-label="연속 스캔 결과">
      <S.ContinuousScanHeader>
        <S.ContinuousScanCount>
          스캔됨 <strong>{addresses.length}</strong>개
        </S.ContinuousScanCount>
      </S.ContinuousScanHeader>

      {addresses.length === 0 ? (
        <S.ContinuousScanEmpty>
          QR을 스캔하면 주소가 여기에 쌓입니다. 중복 주소는 무시됩니다.
        </S.ContinuousScanEmpty>
      ) : (
        <S.ScanHistoryList>
          {addresses.map((addr) => (
            <ScanHistoryRow key={addr} address={addr} onRemove={onRemove} />
          ))}
        </S.ScanHistoryList>
      )}

      <S.ContinuousScanActions>
        <S.ContractRefCopyButton
          type="button"
          $copied={copiedKey === "all"}
          disabled={addresses.length === 0}
          onClick={onCopyAll}
        >
          {copiedKey === "all" ? "복사됨" : "전체 복사"}
        </S.ContractRefCopyButton>
        <S.ContinuousScanClearButton
          type="button"
          disabled={addresses.length === 0}
          onClick={onClear}
        >
          초기화
        </S.ContinuousScanClearButton>
      </S.ContinuousScanActions>
    </S.ContinuousScanPanel>
  );
}
