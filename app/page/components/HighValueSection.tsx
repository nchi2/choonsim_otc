"use client";

import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import { LinktreeIcon } from "@/components/LinktreeIcon";
import {
  COMMUNITY_LINKTREE,
  SBMB_SECTION_ANCHOR_ID,
} from "@/lib/community-linktree";
import * as S from "../styles";

const SbmbAnchor = styled.div`
  scroll-margin-top: 5.5rem;
  width: 100%;
  max-width: 800px;

  @media (min-width: 768px) {
    scroll-margin-top: 6rem;
  }
`;

export default function HighValueSection() {
  return (
    <SbmbAnchor id={SBMB_SECTION_ANCHOR_ID}>
      <S.HighValueContainer>
        <S.HighValueTitle>SBMB · Web3 참여</S.HighValueTitle>

        <S.HighValueContent>
          <S.HighValueTextBox>
            <strong>[춘심 팀 SBMB]</strong>
            <br />
            이더리움 기반 종이지갑 신청과 에어드랍, 콘솔 전환 혜택 등 SBMB
            프로그램을 안내합니다.
            <S.HighValueActions>
              <S.HighValuePrimaryButton
                href={COMMUNITY_LINKTREE.stablebmb.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SBMB Linktree 열기"
              >
                <LinktreeIcon size={22} />
                SBMB 링크 모음
              </S.HighValuePrimaryButton>
              <S.HighValueSecondaryButton
                as={Link}
                href="/scanner"
                aria-label="EVM Scanner 페이지로 이동"
              >
                EVM Scanner
              </S.HighValueSecondaryButton>
            </S.HighValueActions>
          </S.HighValueTextBox>

          <S.HighValueImageBox>
            <Image
              src="/hwallets/img_products.png"
              alt="SBMB 안내"
              width={1360}
              height={960}
              sizes="(max-width: 768px) 100vw, 680px"
              quality={95}
              priority
            />
          </S.HighValueImageBox>
        </S.HighValueContent>
      </S.HighValueContainer>
    </SbmbAnchor>
  );
}
