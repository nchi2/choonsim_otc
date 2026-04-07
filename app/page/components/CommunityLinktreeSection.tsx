"use client";

import styled from "styled-components";
import { KakaoTalkIcon } from "@/components/KakaoTalkIcon";
import { LinktreeIcon } from "@/components/LinktreeIcon";
import {
  COMMUNITY_MAIN_SECTION_PILLS,
  COMMUNITY_SECTION_ANCHOR_ID,
} from "@/lib/community-linktree";
import * as S from "../styles";

const AnchorWrap = styled.div`
  scroll-margin-top: 5.5rem;

  @media (min-width: 768px) {
    scroll-margin-top: 6rem;
  }
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin: -1rem 0 1.5rem;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
    margin: -1.25rem 0 2rem;
  }
`;

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  align-items: center;
`;

const PillLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #434392 0%, #6570c5 100%);
  text-decoration: none;
  border: 1px solid rgba(67, 67, 146, 0.35);
  box-shadow: 0 4px 14px rgba(67, 67, 146, 0.2);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(67, 67, 146, 0.28);
  }

  &:focus-visible {
    outline: 2px solid #434392;
    outline-offset: 2px;
  }

  @media (min-width: 768px) {
    padding: 0.85rem 1.5rem;
    font-size: 0.95rem;
  }
`;

export default function CommunityLinktreeSection() {
  return (
    <AnchorWrap id={COMMUNITY_SECTION_ANCHOR_ID}>
      <S.Section>
        <S.SectionTitle>커뮤니티 · 링크</S.SectionTitle>
        <Description>
          춘심 카카오톡 커뮤니티 및 생태계 링크를 모아두었습니다. SBMB 전용
          Linktree는 메인 <strong>SBMB</strong> 섹션의 링크트리 아이콘과 함께
          있는
          <strong>SBMB</strong> 버튼에서 열 수 있습니다.
        </Description>
        <PillRow>
          {COMMUNITY_MAIN_SECTION_PILLS.map((item) => (
            <PillLink
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.icon === "kakao" ? <KakaoTalkIcon size={22} /> : null}
              {item.icon === "linktree" ? <LinktreeIcon size={22} /> : null}
              {item.label}
            </PillLink>
          ))}
        </PillRow>
      </S.Section>
    </AnchorWrap>
  );
}
