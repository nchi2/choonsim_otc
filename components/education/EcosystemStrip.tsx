"use client";

// 생태계 압축 스트립 (Step 19) — 메인 하단(유튜브 아래·푸터 위)의 얇은 대표 링크 행.
// ★ 외부 링크 위주(도구 섹션=우리 기능 타일과 시각 구분). 전체 목록은 /ecosystem 전용 페이지.
// 경량 원칙(Step 8.5): 아이콘 한 줄 수준. 무거운 meta-icon 배치 fetch 없이 brand 로고 + 구글 파비콘만.

import { useState } from "react";
import styled from "styled-components";
import { platformLogo } from "@/lib/ecosystem-links";
import { eduColors, eduLayout, media } from "./tokens";

interface FeaturedLink {
  label: string;
  href: string;
}

// 대표 8개 — ecosystem-links.ts의 실제 href를 그대로 사용(전체는 /ecosystem).
const FEATURED: FeaturedLink[] = [
  { label: "공식 홈페이지", href: "https://btcmobick.org/ko" },
  { label: "Explorer", href: "http://blockchain.mobick.info/" },
  { label: "Linktree", href: "https://linktr.ee/mobick" },
  { label: "BMBSwap", href: "https://bmbswap.org" },
  { label: "BMB Compass", href: "https://bmbcompass.org/" },
  { label: "모빅경제", href: "https://www.mobickeconomy.com/" },
  { label: "춘심 대화방", href: "https://open.kakao.com/o/gq3NvqFf" },
  { label: "디스코드", href: "https://discord.com/invite/btcmobickhub" },
];

function iconSrcOf(href: string): string | null {
  const logo = platformLogo(href);
  if (logo.kind === "brand" || logo.kind === "favicon") return logo.src;
  return null;
}

function initial(label: string): string {
  const first = Array.from(label.trim())[0] ?? "?";
  return /[a-z]/.test(first) ? first.toUpperCase() : first;
}

function StripItem({ link }: { link: FeaturedLink }) {
  const [failed, setFailed] = useState(false);
  const src = iconSrcOf(link.href);
  return (
    <Item href={link.href} target="_blank" rel="noopener noreferrer">
      {!failed && src ? (
        <ItemLogo
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <ItemFallback aria-hidden>{initial(link.label)}</ItemFallback>
      )}
      <ItemLabel>{link.label}</ItemLabel>
    </Item>
  );
}

export function EcosystemStrip() {
  return (
    <Strip>
      {FEATURED.map((link) => (
        <StripItem key={link.href} link={link} />
      ))}
    </Strip>
  );
}

const Strip = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
  padding: 0.9rem 1rem;
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.bg};

  ${media.md} {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Item = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.15rem;
  text-decoration: none;
  color: ${eduColors.textMuted};
  min-width: 0;

  &:hover {
    color: ${eduColors.primaryText};
  }
`;

const ItemLogo = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  object-fit: cover;
  background: ${eduColors.surface};
`;

const ItemFallback = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background: ${eduColors.primarySoft};
  color: ${eduColors.primaryText};
  font-size: 0.85rem;
  font-weight: 800;
`;

const ItemLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
