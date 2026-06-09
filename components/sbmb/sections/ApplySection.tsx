"use client";

import styled, { css, keyframes } from "styled-components";
import { SbmbSectionAnchor } from "@/components/sbmb/shared/SectionCard";
import { SBMB_FORM_CONVERT } from "@/lib/sbmb/constants";
import { T } from "@/lib/sbmb/tokens";

const mobile = "@media (max-width: 767px)";

// 신규 참여 신청 폼(10모 단위).
const SBMB_FORM_NEW = "https://forms.gle/yy7RXUAS3ix1wK1c8";

// 접수 상태 — 'OPEN'이면 접수중/CTA 활성, 'CLOSED'면 마감/CTA 비활성.
type ApplyStatus = "OPEN" | "CLOSED";
const MIRACLE10_STATUS: ApplyStatus = "OPEN";
const CONVERSION_STATUS: ApplyStatus = "OPEN";

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

const Card = styled.div<{ $variant: "new" | "convert"; $closed: boolean }>`
  flex: 1;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: ${(p) => (p.$variant === "new" ? "#FAFEFD" : "#FBFBFE")};
  border: 1px solid ${(p) => (p.$variant === "new" ? "#DDEFEA" : "#DCD6F2")};
  opacity: ${(p) => (p.$closed ? 0.7 : 1)};
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
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

const StatusPill = styled.span<{ $bg: string; $fg: string }>`
  margin-left: auto;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  padding: 5px 13px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 12px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
`;

const coralPulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(216, 90, 48, 0.5);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(216, 90, 48, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(216, 90, 48, 0);
  }
`;

const PillDot = styled.span<{ $color: string; $pulse?: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(p) => p.$color};
  ${(p) =>
    p.$pulse
      ? css`
          animation: ${coralPulse} 1.8s ease-in-out infinite;
        `
      : ""}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardTitle = styled.h3<{ $variant: "new" | "convert" }>`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 22px;
  line-height: 1.25;
  white-space: nowrap;
  color: ${(p) => (p.$variant === "new" ? T.mintDark : T.convertBadge)};

  ${mobile} {
    white-space: normal;
  }
`;

const CardSub = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: ${T.textSecondary};
`;

const StepList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StepRow = styled.li<{ $variant: "new" | "convert" }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;

  &:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 9px;
    top: 22px;
    bottom: -18px;
    width: 2px;
    background: ${(p) => (p.$variant === "new" ? T.mint : T.convertDot)};
  }
`;

const StepNum = styled.span<{ $variant: "new" | "convert" }>`
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 11px;
  background: ${(p) => (p.$variant === "new" ? T.mint : T.convertDot)};
  color: ${(p) => (p.$variant === "new" ? T.mintDark : T.convertBadge)};
`;

const StepText = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: ${T.textMuted};
  line-height: 20px;
`;

const BtnPrimary = styled.a<{ $variant: "new" | "convert" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 46px;
  margin-top: auto;
  border-radius: 12px;
  text-decoration: none;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 14px;
  border: none;
  cursor: pointer;
  background: ${(p) => (p.$variant === "new" ? T.mint : T.convertBorder)};
  color: ${(p) => (p.$variant === "new" ? T.mintDark : T.white)};

  &:focus-visible {
    outline: 2px solid ${(p) => (p.$variant === "new" ? T.mintDark : T.primary)};
    outline-offset: 2px;
  }
`;

const BtnDisabled = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 46px;
  margin-top: auto;
  border-radius: 12px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 14px;
  background: ${T.bgGray};
  color: ${T.textTertiary};
  cursor: not-allowed;
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

function StatusBadge({ status }: { status: ApplyStatus }) {
  if (status === "OPEN") {
    return (
      <StatusPill $bg="#FBEAE4" $fg="#993C1D">
        <PillDot $color="#D85A30" $pulse aria-hidden />
        접수중
      </StatusPill>
    );
  }
  return (
    <StatusPill $bg="#ECECEF" $fg="#6B6B73">
      <PillDot $color="#A6A6AE" aria-hidden />
      접수 마감
    </StatusPill>
  );
}

const NEW_STEPS = [
  "신청서 작성 및 입금",
  "참여 안내 문자 수신 (다음날)",
  "EVM 지갑 수령",
  "에어드랍 대기",
];

const CONVERT_STEPS = [
  "전환 신청서 작성",
  "참여비 입금 (4%)",
  "고액권 직접 제출",
  "EVM 지갑 수령",
];

export default function ApplySection() {
  const newClosed = MIRACLE10_STATUS === "CLOSED";
  const convertClosed = CONVERSION_STATUS === "CLOSED";

  return (
    <SbmbSectionAnchor id="apply" aria-labelledby="sbmb-apply-heading">
      <Title id="sbmb-apply-heading">SBMB 참여 신청</Title>
      <Cards>
        {/* 좌측 — 신규 참여 */}
        <Card $variant="new" $closed={newClosed}>
          <CardTop>
            {/* <IconBox $variant="new">
              <IconUserPlus size={20} color={T.mintDark} />
            </IconBox> */}
            <Badge $variant="new">신규 참여</Badge>
            <StatusBadge status={MIRACLE10_STATUS} />
          </CardTop>
          <TitleBlock>
            <CardTitle $variant="new">10모 단위 · 10.5 MO</CardTitle>
            <CardSub>참여 신청</CardSub>
          </TitleBlock>
          <StepList>
            {NEW_STEPS.map((t, i) => (
              <StepRow key={t} $variant="new">
                <StepNum $variant="new">{i + 1}</StepNum>
                <StepText>{t}</StepText>
              </StepRow>
            ))}
          </StepList>
          {newClosed ? (
            <BtnDisabled aria-disabled="true">접수 마감</BtnDisabled>
          ) : (
            <BtnPrimary
              $variant="new"
              href={SBMB_FORM_NEW}
              target="_blank"
              rel="noopener noreferrer"
            >
              참여 신청하기 →
            </BtnPrimary>
          )}
        </Card>

        {/* 우측 — 고액권 전환 */}
        <Card $variant="convert" $closed={convertClosed}>
          <CardTop>
            {/* <IconBox $variant="convert">
              <IconArrowUpRight size={20} color={T.white} />
            </IconBox> */}
            <Badge $variant="convert">고액권 전환</Badge>
            <StatusBadge status={CONVERSION_STATUS} />
          </CardTop>
          <TitleBlock>
            <CardTitle $variant="convert">고액권 SBMB 전환</CardTitle>
            <CardSub>참여 신청</CardSub>
          </TitleBlock>
          <StepList>
            {CONVERT_STEPS.map((t, i) => (
              <StepRow key={t} $variant="convert">
                <StepNum $variant="convert">{i + 1}</StepNum>
                <StepText>{t}</StepText>
              </StepRow>
            ))}
          </StepList>
          {convertClosed ? (
            <BtnDisabled aria-disabled="true">접수 마감</BtnDisabled>
          ) : (
            <BtnPrimary
              $variant="convert"
              href={SBMB_FORM_CONVERT}
              target="_blank"
              rel="noopener noreferrer"
            >
              전환 신청하기 →
            </BtnPrimary>
          )}
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
