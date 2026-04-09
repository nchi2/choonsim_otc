"use client";

import type { Network } from "@/app/scanner/lib/tokens";
import * as S from "../styles";

export type ScannerNetworkFilter = Network | "all";

const TABS: readonly { id: ScannerNetworkFilter; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "eth", label: "ETH Mainnet" },
  { id: "base", label: "Base" },
  { id: "bsc", label: "BNB Chain" },
] as const;

function toneForTab(id: ScannerNetworkFilter): "all" | "eth" | "base" | "bsc" {
  if (id === "all") return "all";
  return id;
}

export interface NetworkTabProps {
  active: ScannerNetworkFilter;
  onChange: (tab: ScannerNetworkFilter) => void;
}

export function NetworkTab({ active, onChange }: NetworkTabProps) {
  return (
    <S.NetworkTabBar role="tablist" aria-label="네트워크 필터">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <S.NetworkTabButton
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            $active={isActive}
            $tone={toneForTab(tab.id)}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </S.NetworkTabButton>
        );
      })}
    </S.NetworkTabBar>
  );
}
