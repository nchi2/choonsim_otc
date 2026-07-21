"use client";

// 모빅 도구 — 우리 사이트 기능 타일 (Step 19, 압축 Step 21).
// ★ 외부 생태계 링크(EcosystemStrip)와 같은 무게(높이)의 압축 스트립 — 아이콘+짧은 라벨만.
// 도구가 늘어도 옆에 계속 붙일 수 있게 flex-wrap 구조(고정 열 수 아님).
// 아이콘은 실제 서비스 로고(public/logo_EVM-viewer.png·img_contract.png·coin-icons/Logo_SBMB.svg),
// 배경 톤은 tokens의 카테고리 톤 체계 재사용(teal/purple/pink — 행사 카드와 같은 계열)
// — 우리 기능(색이 있는 배지 아이콘)과 생태계 스트립(외부 로고 그대로)의 시각 차이는 유지.

import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { eduBadgeTones, eduColors, eduLayout, media } from "./tokens";

type ToolTone = "teal" | "purple" | "pink";

interface Tool {
  href: string;
  label: string;
  tone: ToolTone;
  iconSrc: string;
}

const TOOLS: Tool[] = [
  { href: "/scanner", label: "EVM 스캐너", tone: "teal", iconSrc: "/logo_EVM-viewer.png" },
  { href: "/contracts", label: "토큰 컨트랙트", tone: "purple", iconSrc: "/img_contract.png" },
  { href: "/sbmb", label: "SBMB", tone: "pink", iconSrc: "/coin-icons/Logo_SBMB.svg" },
];

const Strip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.surface};
`;

const Tile = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem 0.4rem 0.4rem;
  border-radius: 999px;
  border: 1px solid ${eduColors.border};
  background: ${eduColors.bg};
  text-decoration: none;
  color: ${eduColors.textSub};
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover {
    border-color: ${eduColors.primaryBorder};
    background: ${eduColors.primarySofter};
  }
`;

const IconBox = styled.span<{ $tone: ToolTone }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 8px;
  background: ${(p) => eduBadgeTones[p.$tone].bg};
  border: 1px solid ${(p) => eduBadgeTones[p.$tone].border};
  overflow: hidden;

  img {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }
`;

const Label = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
`;

export function ToolsSection() {
  return (
    <Strip>
      {TOOLS.map((t) => (
        <Tile key={t.href} href={t.href}>
          <IconBox $tone={t.tone} aria-hidden>
            <Image src={t.iconSrc} alt="" width={16} height={16} />
          </IconBox>
          <Label>{t.label}</Label>
        </Tile>
      ))}
    </Strip>
  );
}
