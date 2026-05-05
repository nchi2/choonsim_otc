"use client";

import styled from "styled-components";
import {
  IconArrowUpRight,
  IconExternalLink,
  IconUserPlus,
} from "@/components/sbmb/shared/SbmbIcons";
import { SbmbSectionAnchor } from "@/components/sbmb/shared/SectionCard";
import { SBMB_FORM_CONVERT, SBMB_FORM_QUEUE_WAIT } from "@/lib/sbmb/constants";
import { T } from "@/lib/sbmb/tokens";

const mobile = "@media (max-width: 767px)";

const Title = styled.h2`
  margin: 0 0 18px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: ${T.textPrimary};
`;

const Cards = styled.div`
  display: flex;
  gap: 16px;
  align-items: stretch;

  ${mobile} {
    flex-direction: column;
  }
`;

const Card = styled.div<{ $variant: "new" | "convert" }>`
  flex: 1;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: ${(p) =>
    p.$variant === "new" ? T.mintLight : T.convertBg};
  border: 2px solid
    ${(p) => (p.$variant === "new" ? T.mint : T.convertBorder)};
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const IconBox = styled.div<{ $variant: "new" | "convert" }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => (p.$variant === "new" ? T.mint : T.primary2)};
  color: ${(p) => (p.$variant === "new" ? T.mintDark : T.white)};
`;

const Badge = styled.span<{ $variant: "new" | "convert" }>`
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 9999px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 11px;
  background: ${(p) => (p.$variant === "new" ? T.mint : T.convertBg)};
  color: ${(p) => (p.$variant === "new" ? T.mintDark : T.convertBadge)};
  border: ${(p) =>
    p.$variant === "convert" ? `1px solid ${T.convertDot}` : "none"};
`;

const CardTitle = styled.h3`
  margin: 0;
  flex: 1;
  min-width: 140px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 18px;
`;

const Desc = styled.p`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 13px;
  line-height: 1.6;
  color: ${T.textMuted};
`;

const StepList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StepRow = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const StepNum = styled.span<{ $variant: "new" | "convert" }>`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 12px;
  background: ${(p) => (p.$variant === "new" ? T.mint : T.convertDot)};
  color: ${(p) => (p.$variant === "new" ? T.mintDark : T.convertBadge)};
`;

const StepText = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: ${T.textMuted};
  line-height: 22px;
`;

const BtnPrimary = styled.a<{ $variant: "new" | "convert" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 46px;
  border-radius: 12px;
  text-decoration: none;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 14px;
  border: none;
  cursor: pointer;
  background: ${(p) =>
    p.$variant === "new" ? T.mint : T.convertBorder};
  color: ${(p) => (p.$variant === "new" ? T.mintDark : T.white)};
`;

const Warning = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 10px;
  background: ${T.amberLight};
  border: 1px solid #fde68a;
  font-family: Inter, system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: ${T.amberText};
`;

export default function ApplySection() {
  return (
    <SbmbSectionAnchor id="apply" aria-labelledby="sbmb-apply-heading">
      <Title id="sbmb-apply-heading">SBMB 참여 신청</Title>
      <Cards>
        <Card $variant="new">
          <CardTop>
            <IconBox $variant="new">
              <IconUserPlus size={20} color={T.mintDark} />
            </IconBox>
            <Badge $variant="new">신규 참여</Badge>
            <CardTitle style={{ color: T.mintDark }}>10.5 MO 납부</CardTitle>
          </CardTop>
          <Desc>
            신규 참여는 안내된 절차에 따라 신청서 작성 및 납부 후, EVM 지갑을
            수령하고 에어드랍을 기다리게 됩니다.
          </Desc>
          <StepList>
            {[
              "연락 신청 (대기 알림)",
              "신청서 작성 후 납부",
              "EVM 지갑 수령",
              "에어드랍 대기",
            ].map((t, i) => (
              <StepRow key={t}>
                <StepNum $variant="new">{i + 1}</StepNum>
                <StepText>{t}</StepText>
              </StepRow>
            ))}
          </StepList>
          <BtnPrimary
            $variant="new"
            href={SBMB_FORM_QUEUE_WAIT}
            target="_blank"
            rel="noreferrer"
          >
            <IconExternalLink size={16} color={T.mintDark} />
            대기 신청하기 →
          </BtnPrimary>
        </Card>

        <Card $variant="convert">
          <CardTop>
            <IconBox $variant="convert">
              <IconArrowUpRight size={20} color={T.white} />
            </IconBox>
            <Badge $variant="convert">고액권 전환</Badge>
            <CardTitle style={{ color: T.convertBadge }}>
              고액권 보유자
            </CardTitle>
          </CardTop>
          <Desc>
            고액권 전환은 전환 신청·수수료 입금·고액권 제출 후 EVM 지갑을
            수령하는 순서로 진행됩니다.
          </Desc>
          <StepList>
            {[
              "전환 신청서 작성",
              "수수료 입금 (4%)",
              "고액권 직접 제출",
              "EVM 지갑 수령",
            ].map((t, i) => (
              <StepRow key={t}>
                <StepNum $variant="convert">{i + 1}</StepNum>
                <StepText>{t}</StepText>
              </StepRow>
            ))}
          </StepList>
          <BtnPrimary
            $variant="convert"
            href={SBMB_FORM_CONVERT}
            target="_blank"
            rel="noreferrer"
          >
            전환 신청하기 →
          </BtnPrimary>
        </Card>
      </Cards>
      <Warning>
        <span style={{ flexShrink: 0, display: "flex" }} aria-hidden>
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D97706"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        공식 안내된 링크와 공식 신청 폼만 이용해 주세요. 출처가 불분명한
        링크·DM은 피싱일 수 있습니다.
      </Warning>
    </SbmbSectionAnchor>
  );
}
