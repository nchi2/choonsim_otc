"use client";

import styled from "styled-components";
import { T } from "@/lib/sbmb/tokens";

const mobile = "@media (max-width: 767px)";

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 56px;
`;

const TagLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.75;
  font-weight: 600;
  font-size: 12px;
  color: ${T.white};
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${T.mint};
`;

const Title = styled.h1`
  margin: 0;
  font-weight: 700;
  font-size: 44px;
  line-height: 1.1;
  color: ${T.white};

  ${mobile} {
    font-size: 32px;
  }
`;

const Desc = styled.p`
  margin: 0;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.5;
  width: 100%;
  color: ${T.mintLight};
`;

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const PillPrimary = styled.button`
  border: none;
  cursor: pointer;
  background: ${T.white};
  color: ${T.primary};
  border-radius: 9999px;
  padding: 10px 22px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.125);
`;

const PillOutline = styled.button`
  border: 1px solid ${T.white};
  cursor: pointer;
  background: transparent;
  color: ${T.white};
  border-radius: 9999px;
  padding: 10px 22px;
  font-weight: 600;
  font-size: 14px;
`;

type Props = {
  onScrollToLookupCard: () => void;
  onScrollToLinks: () => void;
};

export default function HeroContent({
  onScrollToLookupCard,
  onScrollToLinks,
}: Props) {
  return (
    <Wrap>
      <TagLine>
        <Dot aria-hidden />
        CHOONSIM TEAM · SBMB
      </TagLine>
      <Title>SBMB 신청 현황</Title>
      <Desc>
        신청 현황 조회, 진행 로드맵, 공지사항을 확인하세요.
      </Desc>
      <PillRow>
        <PillPrimary type="button" onClick={onScrollToLookupCard}>
          신청 현황 조회
        </PillPrimary>
        <PillOutline type="button" onClick={onScrollToLinks}>
          SBMB 링크 모음
        </PillOutline>
      </PillRow>
    </Wrap>
  );
}
