"use client";

import {
  openCurrentPageInMetaMask,
  openCurrentPageInTrustWallet,
} from "@/app/contracts/lib/wallet";
import * as S from "../styles";

export function WalletGuide() {
  return (
    <S.WalletGuideBox role="note">
      <div>
        지갑 확장/앱이 없는 브라우저에서는 <strong>지갑에 추가</strong>를 눌러
        Trust Wallet으로 열어 앱 내 브라우저에서 이 페이지를 연 후 같은 버튼을
        다시 눌러 주세요.
      </div>
      <S.WalletGuideActions>
        <S.WalletGuideOpenButton
          type="button"
          onClick={() => openCurrentPageInTrustWallet()}
        >
          Trust Wallet에서 열기
        </S.WalletGuideOpenButton>
        <S.WalletGuideOpenButton
          type="button"
          onClick={() => openCurrentPageInMetaMask()}
        >
          MetaMask에서 열기
        </S.WalletGuideOpenButton>
      </S.WalletGuideActions>
    </S.WalletGuideBox>
  );
}
