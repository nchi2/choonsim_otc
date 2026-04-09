"use client";

import type { TokenResult } from "@/app/scanner/lib/tokens";
import { shortAddress } from "@/app/scanner/lib/utils";
import * as S from "../styles";

export interface PortfolioSummaryProps {
  results: TokenResult[];
  address: string;
}

function countHeldTokens(results: TokenResult[]): number {
  return results.filter((r) => r.balance > 0).length;
}

export function PortfolioSummary({ results, address }: PortfolioSummaryProps) {
  const held = countHeldTokens(results);

  return (
    <S.PortfolioSummaryRoot role="region" aria-label="포트폴리오 요약">
      <S.PortfolioSummaryAddress title={address}>
        {shortAddress(address)}
      </S.PortfolioSummaryAddress>
      <S.PortfolioSummaryStats>
        <S.PortfolioSummaryStat>
          <S.PortfolioSummaryStatLabel>보유 토큰</S.PortfolioSummaryStatLabel>
          <S.PortfolioSummaryStatValue>{held}개</S.PortfolioSummaryStatValue>
        </S.PortfolioSummaryStat>
      </S.PortfolioSummaryStats>
    </S.PortfolioSummaryRoot>
  );
}
