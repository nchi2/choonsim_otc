"use client";

// /host 게이트 안내 — 로그인했지만 교육자 미승인(NONE/PENDING/REJECTED)인 회원용.

import Link from "next/link";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import { eduColors, eduLayout } from "@/components/education/tokens";

const Card = styled.div`
  max-width: 520px;
  margin: 2.5rem auto;
  padding: 2rem 1.75rem;
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.surface};
  text-align: center;

  h1 {
    margin: 0 0 0.6rem;
    font-size: 1.2rem;
    font-weight: 800;
    color: ${eduColors.text};
  }
  p {
    margin: 0 0 1.2rem;
    font-size: 0.88rem;
    color: ${eduColors.textMuted};
    line-height: 1.6;
  }
`;

const Cta = styled(Link)`
  display: inline-block;
  padding: 0.65rem 1.4rem;
  border-radius: 9px;
  background: ${eduColors.primary};
  color: ${eduColors.white};
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
  &:hover {
    background: ${eduColors.primaryHover};
  }
`;

const COPY: Record<string, { title: string; body: string; cta: string }> = {
  NONE: {
    title: "교육자 승인이 필요합니다",
    body: "행사 개설은 승인된 교육자만 할 수 있습니다. 마이페이지에서 교육자 신청을 먼저 진행해 주세요.",
    cta: "교육자 신청하러 가기",
  },
  PENDING: {
    title: "교육자 신청 검토 중입니다",
    body: "운영팀이 신청을 검토하고 있어요. 승인되면 이메일로 안내드리며, 그 후 행사 개설이 가능합니다.",
    cta: "마이페이지에서 상태 보기",
  },
  REJECTED: {
    title: "교육자 신청이 반려되었습니다",
    body: "마이페이지에서 반려 사유를 확인하고 내용을 보완해 다시 신청할 수 있습니다.",
    cta: "사유 확인·재신청하기",
  },
};

export function HostGateNotice({ educatorStatus }: { educatorStatus: string }) {
  const copy = COPY[educatorStatus] ?? COPY.NONE;
  return (
    <PublicShell showTicker={false}>
      <Card>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <Cta href="/mypage">{copy.cta}</Cta>
      </Card>
    </PublicShell>
  );
}
