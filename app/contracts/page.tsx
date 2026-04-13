"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/layouts/PageLayout";
import { isWalletBrowser } from "@/app/contracts/lib/wallet";
import { getContractPageTokens } from "@/app/contracts/lib/group-tokens";
import { TokenCard } from "./page/components/TokenCard";
import { WalletGuide } from "./page/components/WalletGuide";
import * as S from "./page/styles";

export default function ContractsPage() {
  const [inWalletBrowser, setInWalletBrowser] = useState(false);
  const tokenGroups = getContractPageTokens();

  useEffect(() => {
    // After mount only: avoids SSR/hydration mismatch (no window.ethereum on server).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-mount sync
    setInWalletBrowser(isWalletBrowser());
  }, []);

  return (
    <PageLayout>
      <S.PageWrap>
        <S.ContractsBackLink href="/" aria-label="메인으로 이동">
          ← 메인으로
        </S.ContractsBackLink>

        <S.Hero>
          <S.Title>컨트랙트 · 토큰 정보</S.Title>
          <S.Lead>
            체인별 ERC-20 컨트랙트 주소를 확인하고, 지갑 내 브라우저에서 토큰을
            추가할 수 있습니다. 지갑 연결/서명 요청은 하지 않습니다.
          </S.Lead>
          <S.CrossNav>
            공개 주소로 지갑 잔고를 조회하려면{" "}
            <S.CrossNavLink href="/scanner">EVM Wallet Scanner</S.CrossNavLink>
            로 이동하세요.
          </S.CrossNav>
        </S.Hero>

        {!inWalletBrowser ? <WalletGuide /> : null}

        <S.Section aria-labelledby="contracts-tokens">
          <S.SectionTitle id="contracts-tokens">토큰 목록</S.SectionTitle>
          <S.CardGrid>
            {tokenGroups.map((g) => (
              <TokenCard
                key={g.symbol}
                group={g}
                showAddButton={inWalletBrowser}
              />
            ))}
          </S.CardGrid>
        </S.Section>
      </S.PageWrap>
    </PageLayout>
  );
}
