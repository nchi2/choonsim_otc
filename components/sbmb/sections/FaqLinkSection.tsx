"use client";

import Link from "next/link";
import styled from "styled-components";
import {
  IconChevronRight,
  IconHelpCircle,
} from "@/components/sbmb/shared/SbmbIcons";
import { SbmbSectionAnchor } from "@/components/sbmb/shared/SectionCard";
import { T } from "@/lib/sbmb/tokens";

const Card = styled(Link)`
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

const IconWrap = styled.span`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #eef4f9;
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

export default function FaqLinkSection() {
  return (
    <SbmbSectionAnchor id="faq" aria-labelledby="sbmb-faq-link-heading">
      <Card href="/sbmb/faq">
        <IconWrap aria-hidden>
          <IconHelpCircle size={18} color="#475569" />
        </IconWrap>
        <TextBlock>
          <CardTitle id="sbmb-faq-link-heading">자주 묻는 질문</CardTitle>
          <CardSub>조회 안내 및 FAQ</CardSub>
        </TextBlock>
        <IconChevronRight size={16} color="#D1D5DB" />
      </Card>
    </SbmbSectionAnchor>
  );
}
