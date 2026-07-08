"use client";

import type { ReactNode } from "react";
import type { Network } from "@/app/scanner/lib/tokens";
import { SCANNER_NETWORK_LABEL } from "@/app/scanner/lib/tokens";
import * as S from "../styles";

type ChainTheme = {
  dot: string;
  text: string;
  headerBg: string;
};

const CHAIN_THEME: Record<Network, ChainTheme> = {
  eth: { dot: "#627EEA", text: "#3C3489", headerBg: "#EEEDFE" },
  base: { dot: "#0052FF", text: "#0C447C", headerBg: "#E6F1FB" },
  bsc: { dot: "#F0B90B", text: "#854F0B", headerBg: "#FAEEDA" },
};

export interface ChainContractCardProps {
  network: Network;
  showPreparingBadge?: boolean;
  preparingBadgeLabel?: string;
  children: ReactNode;
}

export function ChainContractCard({
  network,
  showPreparingBadge = false,
  preparingBadgeLabel = "준비중",
  children,
}: ChainContractCardProps) {
  const theme = CHAIN_THEME[network];
  const label = SCANNER_NETWORK_LABEL[network];

  return (
    <S.ChainContractCardRoot>
      <S.ChainContractCardHeader
        $headerBg={theme.headerBg}
        $textColor={theme.text}
      >
        <S.ChainContractCardDot $dotColor={theme.dot} aria-hidden="true" />
        <S.ChainContractCardName>{label}</S.ChainContractCardName>
        {showPreparingBadge ? (
          <>
            <S.ChainContractCardHeaderSpacer />
            <S.PreparingBadge>{preparingBadgeLabel}</S.PreparingBadge>
          </>
        ) : null}
      </S.ChainContractCardHeader>
      <S.ChainContractCardBody>{children}</S.ChainContractCardBody>
    </S.ChainContractCardRoot>
  );
}
