"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/layouts/PageLayout";
import SbmbHeroBanner from "@/components/sbmb/hero/SbmbHeroBanner";
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
      <SbmbHeroBanner />
      <S.PageWrap>
        <S.ContractsTopBar>
          <S.ContractsBackLink href="/sbmb" aria-label="SBMB 페이지로 이동">
            SBMB로 →
          </S.ContractsBackLink>
        </S.ContractsTopBar>

        <S.Hero>
          <S.Title>컨트랙트 · 토큰 정보</S.Title>
          <S.Lead>
            체인별 ERC-20 컨트랙트 주소를 확인합니다. 지갑에 추가 시 표시된
            네트워크(Ethereum·Base·BNB)로 전환한 후 해당 토큰을 등록합니다.
            일반 모바일 브라우저에서는 버튼을 눌러 Trust Wallet으로 열어
            앱 내 브라우저에서 다시 시도할 수 있습니다. 연결·토큰 추가 확인 시에만
            지갑에 요청합니다.
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
              <TokenCard key={g.symbol} group={g} />
            ))}
          </S.CardGrid>
        </S.Section>
      </S.PageWrap>
    </PageLayout>
  );
}
