"use client";

import { useState } from "react";
import {
  SCANNER_NETWORK_LABEL,
  type TokenResult,
} from "@/app/scanner/lib/tokens";
import { nftTierImageSrc } from "@/app/scanner/lib/token-icons";
import * as S from "../styles";

function tierNumber(tier: string | undefined): number {
  const n = Number.parseInt(tier ?? "", 10);
  return Number.isFinite(n) ? n : 0;
}

function TierBadge({ item }: { item: TokenResult }) {
  const [failed, setFailed] = useState(false);
  const tier = item.nftTier ?? "";
  const showImage = !failed;

  return (
    <S.NftBadge>
      <S.NftBadgeThumb>
        {showImage ? (
          // 티어 썸네일은 public/nft/ 정적 파일. 파일 부재 시 티어 숫자로 폴백.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={nftTierImageSrc(tier)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        ) : (
          tier
        )}
      </S.NftBadgeThumb>
      <S.NftBadgeLabel>
        {tier} <S.NftBadgeCount>× {item.balance}</S.NftBadgeCount>
      </S.NftBadgeLabel>
    </S.NftBadge>
  );
}

export interface NftStakeRowProps {
  /** 잔고 > 0 인 티어들만 (그룹 묶음) */
  items: TokenResult[];
}

export function NftStakeRow({ items }: NftStakeRowProps) {
  if (items.length === 0) return null;

  const sorted = [...items].sort(
    (a, b) => tierNumber(a.nftTier) - tierNumber(b.nftTier),
  );
  const total = sorted.reduce((sum, it) => sum + it.balance, 0);
  const network = sorted[0].network;

  return (
    <S.NftRowRoot>
      <S.NftRowTop>
        <S.NftRowMeta>
          <S.NftRowTitle>LDT STAKE NFT</S.NftRowTitle>
          <S.NftRowSub>{SCANNER_NETWORK_LABEL[network]} · ERC-721</S.NftRowSub>
        </S.NftRowMeta>
        <S.NftRowTotal>총 {total}개</S.NftRowTotal>
      </S.NftRowTop>
      <S.NftBadgeRow>
        {sorted.map((item) => (
          <TierBadge key={item.address} item={item} />
        ))}
      </S.NftBadgeRow>
    </S.NftRowRoot>
  );
}
