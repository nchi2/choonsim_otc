"use client";

import {
  SCANNER_NETWORK_LABEL,
  SCANNER_NETWORK_ORDER,
  SCANNER_TOKENS,
  scannerTokenOverviewLabel,
} from "@/app/scanner/lib/tokens";
import * as S from "../styles";

type OverviewItem = { key: string; label: string };

/** 같은 group 토큰(예: NFT 5티어)은 한 줄로 묶어 안내한다. */
function overviewItemsFor(network: string): OverviewItem[] {
  const tokens = SCANNER_TOKENS.filter((t) => t.network === network);
  const out: OverviewItem[] = [];
  const seenGroups = new Set<string>();
  for (const t of tokens) {
    if (t.group) {
      if (seenGroups.has(t.group)) continue;
      seenGroups.add(t.group);
      const count = tokens.filter((x) => x.group === t.group).length;
      out.push({
        key: t.group,
        label: `LDT STAKE NFT · ERC-721 ${count}종`,
      });
      continue;
    }
    out.push({
      key: `${t.symbol}-${t.network}-${t.type}-${t.label}`,
      label:
        scannerTokenOverviewLabel(t.label) +
        (t.type === "native" ? " · 네이티브" : ""),
    });
  }
  return out;
}

export function SupportedTokensOverview() {
  return (
    <S.SupportedTokensBox aria-label="이 페이지에서 조회 가능한 토큰">
      <S.SupportedTokensTitle>조회 가능 토큰</S.SupportedTokensTitle>
      <S.SupportedTokensHint>
        아래 목록의 토큰만 Public RPC로 조회합니다. 조회 후 상단 탭에서 체인별로
        볼 수 있습니다.
      </S.SupportedTokensHint>
      <S.SupportedTokensChainsGrid>
        {SCANNER_NETWORK_ORDER.map((network) => (
          <S.SupportedTokensChainBlock key={network}>
            <S.SupportedTokensChainName>
              {SCANNER_NETWORK_LABEL[network]}
            </S.SupportedTokensChainName>
            <S.SupportedTokensList>
              {overviewItemsFor(network).map((item) => (
                <S.SupportedTokensLi key={item.key}>
                  {item.label}
                </S.SupportedTokensLi>
              ))}
            </S.SupportedTokensList>
          </S.SupportedTokensChainBlock>
        ))}
      </S.SupportedTokensChainsGrid>
    </S.SupportedTokensBox>
  );
}
