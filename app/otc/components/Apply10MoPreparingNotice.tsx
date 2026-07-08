"use client";

import styled from "styled-components";
import {
  MIRACLE10_APPLY_PREPARING,
  MIRACLE10_APPLY_PREPARING_MESSAGE,
  MIRACLE10_APPLY_PREPARING_TITLE,
} from "./apply10mo.constants";

interface Apply10MoPreparingNoticeProps {
  className?: string;
  compact?: boolean;
}

export default function Apply10MoPreparingNotice({
  className,
  compact = false,
}: Apply10MoPreparingNoticeProps) {
  if (!MIRACLE10_APPLY_PREPARING) return null;

  return (
    <Banner className={className} $compact={compact} role="status">
      <Title>{MIRACLE10_APPLY_PREPARING_TITLE}</Title>
      <Message>{MIRACLE10_APPLY_PREPARING_MESSAGE}</Message>
    </Banner>
  );
}

const Banner = styled.div<{ $compact: boolean }>`
  margin: ${(p) => (p.$compact ? "0 0 1rem" : "0 0 1.25rem")};
  padding: ${(p) => (p.$compact ? "0.75rem 1rem" : "1rem 1.125rem")};
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  text-align: left;
`;

const Title = styled.p`
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #92400e;
`;

const Message = styled.p`
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: #78350f;
`;
