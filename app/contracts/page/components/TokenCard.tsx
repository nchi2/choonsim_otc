"use client";

import { useCallback, useRef, useState } from "react";
import type { Network } from "@/app/scanner/lib/tokens";
import { ERC20_ADDRESS_PLACEHOLDER } from "@/app/scanner/lib/tokens";
import { explorerAddressUrl } from "@/app/contracts/lib/chains";
import { addTokenToWallet } from "@/app/contracts/lib/wallet";
import type { ContractTokenGroup } from "@/app/contracts/lib/group-tokens";
import { ChainBadge } from "./ChainBadge";
import * as S from "../styles";

function isPlaceholderAddress(address: string): boolean {
  return address === ERC20_ADDRESS_PLACEHOLDER;
}

/** SBMB·LDT on BNB: same data; gray row + preparing badge only. */
function isBnbPreparingRow(symbol: string, network: Network): boolean {
  return network === "bsc" && (symbol === "SBMB" || symbol === "LDT");
}

export function TokenCard({ group }: { group: ContractTokenGroup }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = useCallback(
    (network: string, address: string, preparing: boolean) => {
      if (isPlaceholderAddress(address) || preparing) return;
      void navigator.clipboard.writeText(address);
      const key = `${network}-${address}`;
      if (copyTimer.current) clearTimeout(copyTimer.current);
      setCopiedKey(key);
      copyTimer.current = setTimeout(() => setCopiedKey(null), 1500);
    },
    [],
  );

  return (
    <S.TokenCardRoot>
      <S.TokenCardTitleRow>
        <S.TokenName>{group.title}</S.TokenName>
        <S.TokenSymbol>{group.symbol}</S.TokenSymbol>
      </S.TokenCardTitleRow>
      {group.intro ? <S.TokenIntro>{group.intro}</S.TokenIntro> : null}
      {group.chains.map((row) => {
        const ph = isPlaceholderAddress(row.address);
        const preparing = isBnbPreparingRow(group.symbol, row.network);
        const key = `${row.network}-${row.address}`;
        const showCopied = copiedKey === key;
        const explorer = explorerAddressUrl(row.network, row.address);
        const rowActionsDisabled = ph || preparing;

        return (
          <S.ChainRow key={key} $preparing={preparing}>
            <S.ChainRowTop>
              <ChainBadge network={row.network} />
              {preparing ? <S.PreparingBadge>준비중</S.PreparingBadge> : null}
            </S.ChainRowTop>
            <S.ChainFieldLabel>컨트랙트 주소</S.ChainFieldLabel>
            <S.AddressLine>{row.address}</S.AddressLine>
            <S.RowActionsWrap>
              <S.RowActions>
                <S.GhostButton
                  type="button"
                  disabled={rowActionsDisabled}
                  onClick={() => onCopy(row.network, row.address, preparing)}
                >
                  복사
                </S.GhostButton>
                {rowActionsDisabled ? (
                  <S.ExplorerLink as="span" $inactive aria-disabled="true">
                    익스플로러
                  </S.ExplorerLink>
                ) : (
                  <S.ExplorerLink
                    href={explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    익스플로러
                  </S.ExplorerLink>
                )}
                <S.GhostButton
                  type="button"
                  disabled={rowActionsDisabled}
                  onClick={() =>
                    void addTokenToWallet({
                      address: row.address,
                      symbol: group.symbol,
                      decimals: row.decimals,
                      network: row.network,
                    })
                  }
                >
                  지갑에 추가
                </S.GhostButton>
              </S.RowActions>
              {showCopied ? <S.CopiedHint>복사되었습니다.</S.CopiedHint> : null}
            </S.RowActionsWrap>
          </S.ChainRow>
        );
      })}
    </S.TokenCardRoot>
  );
}
