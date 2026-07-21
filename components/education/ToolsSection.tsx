"use client";

// 모빅 도구 — 우리 사이트 기능 3종(스캐너·컨트랙트·SBMB) 타일 (Step 19).
// ★ 외부 생태계 링크(EcosystemStrip)와 시각적으로 구분: 이쪽은 "설명이 있는 타일".
// 아이콘은 실제 서비스 로고(public/logo_EVM-viewer.png·img_contract.png·coin-icons/Logo_SBMB.svg),
// 배경 톤은 tokens의 카테고리 톤 체계 재사용(teal/purple/pink — 행사 카드와 같은 계열).

import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { eduBadgeTones, eduColors, eduLayout, media } from "./tokens";

type ToolTone = "teal" | "purple" | "pink";

interface Tool {
  href: string;
  title: string;
  desc: string;
  tone: ToolTone;
  iconSrc: string;
}

const TOOLS: Tool[] = [
  {
    href: "/scanner",
    title: "EVM 스캐너",
    desc: "지갑 주소·QR로 잔고를 바로 조회",
    tone: "teal",
    iconSrc: "/logo_EVM-viewer.png",
  },
  {
    href: "/contracts",
    title: "토큰 컨트랙트",
    desc: "체인별 컨트랙트 주소와 지갑 딥링크",
    tone: "purple",
    iconSrc: "/img_contract.png",
  },
  {
    href: "/sbmb",
    title: "SBMB",
    desc: "신청 현황 조회·로드맵·공지사항",
    tone: "pink",
    iconSrc: "/coin-icons/Logo_SBMB.svg",
  },
];

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;

  ${media.sm} {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const Tile = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.surface};
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: ${eduColors.primaryBorder};
    box-shadow: 0 4px 14px rgba(107, 95, 208, 0.08);
    transform: translateY(-1px);
  }
`;

const IconBox = styled.span<{ $tone: ToolTone }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: ${(p) => eduBadgeTones[p.$tone].bg};
  border: 1px solid ${(p) => eduBadgeTones[p.$tone].border};
  overflow: hidden;

  img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }
`;

const TileText = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const TileTitle = styled.span`
  font-size: 0.92rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

const TileDesc = styled.span`
  font-size: 0.76rem;
  line-height: 1.4;
  color: ${eduColors.textMuted};
`;

export function ToolsSection() {
  return (
    <Grid>
      {TOOLS.map((t) => (
        <Tile key={t.href} href={t.href}>
          <IconBox $tone={t.tone} aria-hidden>
            <Image src={t.iconSrc} alt="" width={26} height={26} />
          </IconBox>
          <TileText>
            <TileTitle>{t.title}</TileTitle>
            <TileDesc>{t.desc}</TileDesc>
          </TileText>
        </Tile>
      ))}
    </Grid>
  );
}
