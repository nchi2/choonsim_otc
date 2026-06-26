"use client";

import type { TokenResult } from "@/app/scanner/lib/tokens";
import * as S from "../styles";

export interface PortfolioSummaryProps {
  results: TokenResult[];
}

/**
 * 보유 토큰 수. NFT 그룹(LDT STAKE NFT)은 티어가 5개여도 1개로 센다
 * (화면에서도 한 행으로 묶여 표시되므로 카운트도 그룹 단위가 자연스럽다).
 */
function countHeldTokens(results: TokenResult[]): number {
  const held = results.filter((r) => r.balance > 0);
  const groups = new Set<string>();
  let count = 0;
  for (const r of held) {
    if (r.group) {
      groups.add(r.group);
    } else {
      count += 1;
    }
  }
  return count + groups.size;
}

export function PortfolioSummary({ results }: PortfolioSummaryProps) {
  const held = countHeldTokens(results);

  return (
    <S.PortfolioSummaryRoot role="region" aria-label="포트폴리오 요약">
      <S.PortfolioSummaryStats>
        <S.PortfolioSummaryStat>
          <S.PortfolioSummaryStatLabel>보유 토큰</S.PortfolioSummaryStatLabel>
          <S.PortfolioSummaryStatValue>{held}개</S.PortfolioSummaryStatValue>
        </S.PortfolioSummaryStat>
      </S.PortfolioSummaryStats>
    </S.PortfolioSummaryRoot>
  );
}
