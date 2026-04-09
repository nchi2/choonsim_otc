"use client";

import {
  SCANNER_NETWORK_LABEL,
  SCANNER_NETWORK_ORDER,
  SCANNER_TOKENS,
} from "@/app/scanner/lib/tokens";
import * as S from "../styles";

export function SupportedTokensOverview() {
  return (
    <S.SupportedTokensBox aria-label="이 페이지에서 조회 가능한 토큰">
      <S.SupportedTokensTitle>조회 가능 토큰</S.SupportedTokensTitle>
      <S.SupportedTokensHint>
        아래 목록의 토큰만 Public RPC로 조회합니다. 조회 후 상단 탭에서 체인별로
        볼 수 있습니다.
      </S.SupportedTokensHint>
      <S.SupportedTokensChainsGrid>
        {SCANNER_NETWORK_ORDER.map((network) => {
          const items = SCANNER_TOKENS.filter((t) => t.network === network);
          return (
            <S.SupportedTokensChainBlock key={network}>
              <S.SupportedTokensChainName>
                {SCANNER_NETWORK_LABEL[network]}
              </S.SupportedTokensChainName>
              <S.SupportedTokensList>
                {items.map((t) => (
                  <S.SupportedTokensLi
                    key={`${t.symbol}-${t.network}-${t.type}-${t.label}`}
                  >
                    {t.label}
                    {t.type === "native" ? " · 네이티브" : null}
                  </S.SupportedTokensLi>
                ))}
              </S.SupportedTokensList>
            </S.SupportedTokensChainBlock>
          );
        })}
      </S.SupportedTokensChainsGrid>
    </S.SupportedTokensBox>
  );
}
