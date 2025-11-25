"use client";

import Image from "next/image";
import Link from "next/link";
import * as S from "../styles";

export default function HighValueSection() {
  return (
    <S.HighValueContainer>
      <S.HighValueTitle>고액권 | SBMB</S.HighValueTitle>

      <S.HighValueContent>
        <S.HighValueTextBox>
          <strong>[춘심팀의 고액권 구매와 SBMB 참여]</strong>
          <br />
          신뢰 기반의 고액권 구매와 토큰화된 SBMB 참여를 통해 콘솔을 얻을 수
          있는 기회를 잡아보세요.
          <S.HighValueActions>
            <S.HighValuePrimaryButton as={Link} href="/high-value">
              고액권 구매
            </S.HighValuePrimaryButton>
            <S.HighValueSecondaryButton
              href="http://stablebmb.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              SBMB 웹사이트 바로가기
            </S.HighValueSecondaryButton>
          </S.HighValueActions>
        </S.HighValueTextBox>

        <S.HighValueImageBox>
          <Image
            src="/hwallets/img_section_hwallets.png"
            alt="고액권 및 SBMB 안내"
            width={340}
            height={240}
            priority
          />
        </S.HighValueImageBox>
      </S.HighValueContent>
    </S.HighValueContainer>
  );
}
