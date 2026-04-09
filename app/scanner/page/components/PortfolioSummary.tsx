"use client";

import type { TokenResult } from "@/app/scanner/lib/tokens";
import { getPortfolioTier, shortAddress } from "@/app/scanner/lib/utils";
import * as S from "../styles";

export interface PortfolioSummaryProps {
  results: TokenResult[];
  address: string;
}

function countHeldTokens(results: TokenResult[]): number {
  return results.filter((r) => r.balance > 0).length;
}

function countActiveChains(results: TokenResult[]): number {
  const set = new Set<string>();
  for (const r of results) {
    if (r.balance > 0) set.add(r.network);
  }
  return set.size;
}

export function PortfolioSummary({ results, address }: PortfolioSummaryProps) {
  const held = countHeldTokens(results);
  const chains = countActiveChains(results);
  const tier = getPortfolioTier(results);

  return (
    <S.PortfolioSummaryRoot role="region" aria-label="포트폴리오 요약">
      <S.PortfolioSummaryAddress title={address}>
        {shortAddress(address)}
      </S.PortfolioSummaryAddress>
      <S.PortfolioSummaryStats>
        <S.PortfolioSummaryStat>
          <S.PortfolioSummaryStatLabel>보유 토큰</S.PortfolioSummaryStatLabel>
          <S.PortfolioSummaryStatValue>
            {held}개
          </S.PortfolioSummaryStatValue>
        </S.PortfolioSummaryStat>
        <S.PortfolioSummaryStat>
          <S.PortfolioSummaryStatLabel>활성 체인</S.PortfolioSummaryStatLabel>
          <S.PortfolioSummaryStatValue>{chains}개</S.PortfolioSummaryStatValue>
        </S.PortfolioSummaryStat>
      </S.PortfolioSummaryStats>
      <S.PortfolioSummaryTier>
        <S.PortfolioSummaryTierLabel>등급</S.PortfolioSummaryTierLabel>
        <S.PortfolioSummaryTierValue>{tier}</S.PortfolioSummaryTierValue>
      </S.PortfolioSummaryTier>
    </S.PortfolioSummaryRoot>
  );
}
