"use client";

import Link from "next/link";
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

const pillLinkBase = `
  border-radius: 9999px;
  padding: 10px 22px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
`;

const PillPrimaryLink = styled(Link)`
  ${pillLinkBase}
  background: ${T.white};
  color: ${T.primary};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.125);
`;

const PillOutlineLink = styled(Link)`
  ${pillLinkBase}
  border: 1px solid ${T.white};
  background: transparent;
  color: ${T.white};
`;

type SectionId = "notice" | "apply" | "guide";

type InteractiveProps = {
  variant?: "interactive";
  onScrollToLookupCard: () => void;
  onScrollToSection: (sectionId: SectionId) => void;
};

type LinksProps = {
  variant: "links";
};

type Props = InteractiveProps | LinksProps;

function CrossPageToolLinks() {
  return (
    <>
      <PillOutlineLink href="/scanner" aria-label="EVM Wallet Scanner로 이동">
        스캐너
      </PillOutlineLink>
      <PillOutlineLink
        href="/contracts"
        aria-label="컨트랙트 · 토큰 정보 페이지로 이동"
      >
        컨트랙트
      </PillOutlineLink>
    </>
  );
}

export default function HeroContent(props: Props) {
  const shared = (
    <>
      <TagLine>
        <Dot aria-hidden />
        CHOONSIM TEAM · SBMB
      </TagLine>
      <Title>SBMB 신청 현황</Title>
      <Desc>신청 현황 조회, 진행 로드맵, 공지사항을 확인하세요.</Desc>
    </>
  );

  if (props.variant === "links") {
    return (
      <Wrap>
        {shared}
        <PillRow>
          <PillPrimaryLink href="/sbmb">신청 현황 조회</PillPrimaryLink>
          <PillOutlineLink href="/sbmb#notice">공지사항</PillOutlineLink>
          <PillOutlineLink href="/sbmb#apply">참여 신청</PillOutlineLink>
          <PillOutlineLink href="/sbmb#guide">지갑 사용법</PillOutlineLink>
          <CrossPageToolLinks />
        </PillRow>
      </Wrap>
    );
  }

  const { onScrollToLookupCard, onScrollToSection } = props;

  return (
    <Wrap>
      {shared}
      <PillRow>
        <PillPrimary type="button" onClick={onScrollToLookupCard}>
          신청 현황 조회
        </PillPrimary>
        <PillOutline type="button" onClick={() => onScrollToSection("notice")}>
          공지사항
        </PillOutline>
        <PillOutline type="button" onClick={() => onScrollToSection("apply")}>
          참여 신청
        </PillOutline>
        <PillOutline type="button" onClick={() => onScrollToSection("guide")}>
          지갑 사용법
        </PillOutline>
        <CrossPageToolLinks />
      </PillRow>
    </Wrap>
  );
}
