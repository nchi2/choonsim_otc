"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
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

// 카드 셸 — 테두리/배경/hover를 담당. 본체 링크 아래에 보조 버튼을 둘 수 있게 컬럼.
const CardShell = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid ${T.border};
  background: ${T.white};
  overflow: hidden;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${T.mint};
  }
`;

// 카드 본체(클릭 = 새 탭 열기). 기존 Card와 동일한 행 레이아웃.
const CardLink = styled.a`
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 72px;
  padding: 0 16px;
  text-decoration: none;
`;

// 트러스트월렛에서 열기 — 본체보다 작고 덜 강조된 회색 보조 버튼.
const TrustWalletBtn = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 16px 12px 68px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid ${T.border};
  background: #f3f4f6;
  color: ${T.textSecondary};
  font-family: Inter, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #e5e7eb;
  }

  ${mobile} {
    margin-left: 16px;
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
  /** true면 카드 하단에 "트러스트월렛에서 열기" 보조 버튼 노출(모바일 한정). */
  trustWallet?: boolean;
};

const SBMB_LINKTREE_HREF = COMMUNITY_LINKTREE.stablebmb.href;

// 대상 URL을 트러스트월렛 인앱 브라우저로 여는 딥링크. coin_id=60 = EVM(Base 포함).
function getTrustWalletLink(targetUrl: string): string {
  return `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(
    targetUrl,
  )}`;
}

// 모바일(좁은 폭 또는 모바일 UA)에서만 딥링크가 의미 있으므로 조건부 노출용.
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      const ua = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(ua || mq.matches);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function TrustWalletButton({ url }: { url: string }) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(getTrustWalletLink(url), "_blank", "noopener,noreferrer");
  };
  return (
    <TrustWalletBtn type="button" onClick={handleClick}>
      <span aria-hidden="true">📲</span> 트러스트월렛에서 열기
    </TrustWalletBtn>
  );
}

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
    trustWallet: true,
    icon: <LogoImg src="/Logo_SBMB.svg" alt="StableBMB" />,
  },
  {
    title: "LDT ↔ PRR 스왑",
    sub: "Uniswap에서 교환하기",
    href: "https://app.uniswap.org/swap?inputCurrency=0x504B262539d3A4194d0649f69Fe3cCA06D5bB24a&outputCurrency=0x7d29E2274212426Ae964cE354F9A5FC9b74BA2d1&chain=base",
    bg: T.white,
    trustWallet: true,
    icon: (
      <LogoImg
        src="https://www.google.com/s2/favicons?domain=uniswap.org&sz=64"
        alt="Uniswap"
        loading="lazy"
        decoding="async"
      />
    ),
  },
  {
    title: "LDT/PRR 유동성 풀",
    sub: "Uniswap 풀 현황 보기",
    href: "https://app.uniswap.org/explore/pools/base/0xe397d9ac97fac140cc56fbba6e33d40bfc375fc7",
    bg: T.white,
    trustWallet: true,
    icon: (
      <LogoImg
        src="https://www.google.com/s2/favicons?domain=uniswap.org&sz=64"
        alt="Uniswap"
        loading="lazy"
        decoding="async"
      />
    ),
  },
];

export default function LinksSection() {
  const isMobile = useIsMobile();
  return (
    <SbmbSectionAnchor id="links" aria-labelledby="sbmb-links-heading">
      <Title id="sbmb-links-heading">링크 모음</Title>
      <Grid>
        {LINKS.map((item) => (
          <CardShell key={item.href}>
            <CardLink href={item.href} target="_blank" rel="noreferrer">
              <IconWrap $bg={item.bg}>{item.icon}</IconWrap>
              <TextBlock>
                <CardTitle>{item.title}</CardTitle>
                <CardSub>{item.sub}</CardSub>
              </TextBlock>
              <IconChevronRight size={16} color="#D1D5DB" />
            </CardLink>
            {item.trustWallet && isMobile ? (
              <TrustWalletButton url={item.href} />
            ) : null}
          </CardShell>
        ))}
      </Grid>
    </SbmbSectionAnchor>
  );
}
