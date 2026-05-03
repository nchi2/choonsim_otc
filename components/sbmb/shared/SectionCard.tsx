import styled from "styled-components";
import { T } from "@/lib/sbmb/tokens";

/** 공지·로드맵 등 흰 카드 래퍼 (워크플로 SectionCard) */
export const SbmbSectionCard = styled.section`
  width: 100%;
  background: ${T.white};
  border-radius: 16px;
  border: 1px solid ${T.border};
  box-shadow: ${T.cardShadow};
  padding: 32px;

  @media (max-width: 767px) {
    padding: 20px;
  }
`;

export const SbmbSectionAnchor = styled.section`
  width: 100%;
  scroll-margin-top: 72px;
`;
