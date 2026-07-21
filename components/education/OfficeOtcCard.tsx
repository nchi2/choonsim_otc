"use client";

// 회관 OTC 상주 카드 — "억지로 밀지 않는" 톤의 안내 카드.
// 메인·행사 상세 사이드 등 어디든 배치 가능한 독립 블록. CTA는 기존 /otc로 연결.
// variant="banner"(가로 배너) | "card"(세로 카드, 사이드/그리드용).

import Link from "next/link";
import styled from "styled-components";
import { eduColors, eduLayout, media } from "./tokens";

const Base = styled.section<{ $banner?: boolean }>`
  border: 1px solid ${eduColors.primaryBorder};
  border-radius: ${eduLayout.radius}px;
  background: linear-gradient(
    135deg,
    ${eduColors.primarySofter},
    ${eduColors.primarySoft}
  );
  padding: 1.1rem 1.25rem;
  display: flex;
  gap: 1rem;
  ${(p) =>
    p.$banner
      ? `
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  `
      : `
  flex-direction: column;
  align-items: flex-start;
  `}
`;

const TextBox = styled.div`
  min-width: 0;
`;

const CardTitle = styled.h3`
  margin: 0 0 0.3rem;
  font-size: 1rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

const Desc = styled.p`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.55;
  color: ${eduColors.textMuted};

  ${media.sm} {
    font-size: 0.78rem;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const PrimaryCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: ${eduColors.primary};
  color: ${eduColors.white};
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    background: ${eduColors.primaryHover};
  }
`;

const GhostCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid ${eduColors.primaryBorder};
  background: ${eduColors.surface};
  color: ${eduColors.primaryText};
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    border-color: ${eduColors.primary};
  }
`;

export function OfficeOtcCard({
  variant = "banner",
}: {
  variant?: "banner" | "card";
}) {
  return (
    <Base $banner={variant === "banner"}>
      <TextBox>
        <CardTitle>회관 면대면 모빅 구매 / 판매</CardTitle>
        <Desc>
          모빅회관에 상주하고 있는 춘심팀과 면대면으로 BMB 구매/판매 신청을
          진행할 수 있습니다.
        </Desc>
      </TextBox>
      <Actions>
        <PrimaryCta href="/otc">OTC 바로가기</PrimaryCta>
        <GhostCta href="/otc?apply=1">10모의 기적</GhostCta>
      </Actions>
    </Base>
  );
}
