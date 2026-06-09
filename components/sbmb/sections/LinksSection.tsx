"use client";

import type { ReactNode } from "react";
import styled from "styled-components";
import { IconChevronRight } from "@/components/sbmb/shared/SbmbIcons";
import { SbmbSectionAnchor } from "@/components/sbmb/shared/SectionCard";
import { COMMUNITY_LINKTREE } from "@/lib/community-linktree";
import {
  SBMB_INTRO_GITBOOK_URL,
  SBMB_KAKAO_INQUIRY_URL,
  SBMB_STABLEBMB_URL,
} from "@/lib/sbmb/constants";
import { T } from "@/lib/sbmb/tokens";

const mobile = "@media (max-width: 767px)";

const Title = styled.h2`
  margin: 0 0 16px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: ${T.textPrimary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  ${mobile} {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.a`
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 72px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid ${T.border};
  background: ${T.white};
  text-decoration: none;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${T.mint};
  }
`;

const IconWrap = styled.span<{ $bg: string }>`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${(p) => p.$bg};
`;

const LogoImg = styled.img<{ $rounded?: boolean }>`
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: ${(p) => (p.$rounded ? "6px" : "0")};
`;

const TextBlock = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

const CardTitle = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: ${T.textPrimary};
`;

const CardSub = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: ${T.textSecondary};
`;

type LinkDef = {
  title: string;
  sub: string;
  href: string;
  icon: ReactNode;
  bg: string;
};

const SBMB_LINKTREE_HREF = COMMUNITY_LINKTREE.stablebmb.href;

const LINKS: LinkDef[] = [
  {
    title: "SBMB 소개서",
    sub: "gitbook 바로가기",
    href: SBMB_INTRO_GITBOOK_URL,
    bg: T.white,
    icon: (
      <LogoImg
        src="https://www.google.com/s2/favicons?domain=gitbook.com&sz=64"
        alt="GitBook"
        loading="lazy"
        decoding="async"
      />
    ),
  },
  {
    title: "SBMB Linktree",
    sub: "linktr.ee/stablebmb",
    href: SBMB_LINKTREE_HREF,
    bg: T.white,
    icon: (
      <LogoImg
        src="https://www.google.com/s2/favicons?domain=linktr.ee&sz=64"
        alt="Linktree"
        loading="lazy"
        decoding="async"
      />
    ),
  },
  {
    title: "1:1 문의",
    sub: "카카오톡",
    href: SBMB_KAKAO_INQUIRY_URL,
    bg: "transparent",
    icon: <LogoImg src="/logo/Logo_Kakao.png" alt="카카오톡" $rounded />,
  },
  {
    title: "stablebmb.com",
    sub: "공식 웹사이트",
    href: SBMB_STABLEBMB_URL,
    bg: "transparent",
    icon: <LogoImg src="/Logo_SBMB.svg" alt="StableBMB" />,
  },
];

export default function LinksSection() {
  return (
    <SbmbSectionAnchor id="links" aria-labelledby="sbmb-links-heading">
      <Title id="sbmb-links-heading">링크 모음</Title>
      <Grid>
        {LINKS.map((item) => (
          <Card
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noreferrer"
          >
            <IconWrap $bg={item.bg}>{item.icon}</IconWrap>
            <TextBlock>
              <CardTitle>{item.title}</CardTitle>
              <CardSub>{item.sub}</CardSub>
            </TextBlock>
            <IconChevronRight size={16} color="#D1D5DB" />
          </Card>
        ))}
      </Grid>
    </SbmbSectionAnchor>
  );
}
