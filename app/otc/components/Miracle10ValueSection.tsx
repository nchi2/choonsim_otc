"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

/* ────────────────────────────────────────────────────────────
 * 색 토큰 (Figma 스펙 그대로 — 임의 변경 금지). 라이트 고정.
 * ──────────────────────────────────────────────────────────── */
const C = {
  brand: "#6b5fd0",
  heroBg: "#f5f3ff",
  heroSub: "#5a4fa8",
  ink: "#333333",
  grayPill: "#eaeaea",
  grayText: "#999999",
  grayNum: "#aaaaaa",
  arrow: "#c9c1f0",
  divider: "#edeaf8",
  sectionTitle: "#4a3baa",
  redLabel: "#c0392b",
  redDot: "#f5cccc",
  redBox: "#fef9f9",
  xIcon: "#ddaaaa",
  greenLabel: "#0f6e56",
  greenDot: "#c6e6d8",
  greenBox: "#f2faf7",
  usersIcon: "#7bc4a8",
  itemText: "#555555",
  numBgActive: "#6b5fd0",
  numBgIdle: "#eee9ff",
  numTextIdle: "#8b80d0",
  assistBg: "#eee9ff",
  assistText: "#7b70c0",
  footnote: "#de3939",
  reassure: "#aaaaaa",
  white: "#ffffff",
} as const;

// 한글은 Pretendard. (스펙의 "Inter"는 weight 매핑 용도)
const FONT = "Pretendard, Inter, system-ui, -apple-system, sans-serif";

/* ────────────────────────────────────────────────────────────
 * 콘텐츠 상수 — 문구 수정 용이하게 분리.
 * ──────────────────────────────────────────────────────────── */
type SkipTone = "red" | "green";

interface SkipGroup {
  tone: SkipTone;
  label: string;
  icon: "x" | "users";
  items: string[];
}

const SKIP_GROUPS: SkipGroup[] = [
  {
    tone: "red",
    label: "사전 준비가 필요 없어요",
    icon: "x",
    items: [
      "국내·해외 여러 거래소를 직접 오가며 준비하지 않음",
      "원화 입금·USDT 환전, 송금을 따로 거치지 않음",
    ],
  },
  {
    tone: "green",
    label: "안전하게 전송 및 확인을 도와드려요",
    icon: "users",
    items: ["신청서 주소 입력·USDT/BMB 전송", "TXID 대조·수수료 차이 확인"],
  },
  {
    tone: "green",
    label: "지갑·스왑도 현장에서 함께",
    icon: "users",
    items: ["모빅지갑·트러스트월렛 설치·백업", "bmbswap 스왑·가스비(BNB) 마련"],
  },
];

const STEPS: string[] = [
  "10모의 기적 All-in-One 참여 신청",
  "서초 모빅회관 춘심 사무실 방문",
  "지갑 수령 (따로 직접 수령)",
  "입금 확인 (WBMB·BNB)",
  "원하는 시점에 MOVN 청구",
];

const REASSURANCE: { key: "lock" | "users" | "clock"; label: string }[] = [
  { key: "lock", label: "안전한 처리" },
  { key: "users", label: "면대면 인증" },
  { key: "clock", label: "일정 예약 가능" },
];

/* ────────────────────────────────────────────────────────────
 * 아이콘 — lucide path를 인라인 SVG로 재현 (장식용 → aria-hidden).
 * ──────────────────────────────────────────────────────────── */
type IconProps = {
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
};

function Icon({
  size = 16,
  width,
  height,
  color = "currentColor",
  fill = false,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={width ?? size}
      height={height ?? size}
      viewBox="0 0 24 24"
      fill={fill ? color : "none"}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const IconUser = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

const IconUsers = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

const IconSparkles = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </Icon>
);

const IconArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icon>
);

const IconCircleSlash = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="9" y1="15" x2="15" y2="9" />
  </Icon>
);

const IconX = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);

const IconListChecks = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3 17 2 2 4-4" />
    <path d="m3 7 2 2 4-4" />
    <path d="M13 6h8" />
    <path d="M13 12h8" />
    <path d="M13 18h8" />
  </Icon>
);

const IconLock = (p: IconProps) => (
  <Icon {...p}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

const IconClock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icon>
);

const SKIP_TONE: Record<
  SkipTone,
  { label: string; dot: string; box: string; border: string }
> = {
  red: { label: C.redLabel, dot: C.redDot, box: C.redBox, border: C.redDot },
  green: {
    label: C.greenLabel,
    dot: C.greenDot,
    box: C.greenBox,
    border: C.greenDot,
  },
};

/* ────────────────────────────────────────────────────────────
 * Props
 * ──────────────────────────────────────────────────────────── */
export interface Miracle10ValueSectionProps {
  /** CTA 클릭 핸들러 (참여 폼 열기 등). startHref가 없을 때 사용. */
  onStart?: () => void;
  /** CTA를 링크로 동작시킬 때의 주소. 주어지면 <a>로 렌더. */
  startHref?: string;
  /** CTA 라벨 (기본: "5단계로 시작하기") */
  ctaLabel?: string;
  className?: string;
}

export default function Miracle10ValueSection({
  onStart,
  startHref,
  ctaLabel = "5단계로 시작하기",
  className,
}: Miracle10ValueSectionProps) {
  return (
    <Card className={className}>
      {/* 헤더(고정): 히어로 + 대비 스트립 */}
      <HeaderBlock>
        {/* 1. Hero */}
        <Hero>
          <HeroSub>복잡한 과정 없이</HeroSub>
          <HeadlineRow>
            <HeadStrong>5단계만</HeadStrong>
            <HeadNormal>하면 돼요</HeadNormal>
          </HeadlineRow>
        </Hero>

        {/* 2. Contrast Strip */}
        <Strip>
          <StripCol $w={119}>
            <GrayPill>
              <IconUser size={12} color={C.grayText} />
              <PillTextGray>혼자 하면</PillTextGray>
            </GrayPill>
            <NumGray>13단계</NumGray>
          </StripCol>

          <IconArrowRight width={24} height={18} color={C.arrow} />

          <StripCol $w={133}>
            <PurplePill>
              <IconSparkles size={12} color={C.white} />
              <PillTextWhite>춘심 올인원</PillTextWhite>
            </PurplePill>
            <NumBrand>5단계</NumBrand>
          </StripCol>
        </Strip>
      </HeaderBlock>

      {/* 본문(스크롤 영역) */}
      <ScrollArea>
        <Divider />

        {/* 3. Skip Section */}
        <SkipSection>
        <SectionHeader>
          <IconCircleSlash size={14} color={C.brand} />
          <SectionTitle>현장에서 같이 진행해요</SectionTitle>
        </SectionHeader>

        {SKIP_GROUPS.map((g, gi) => {
          const tone = SKIP_TONE[g.tone];
          return (
            <SkipGroupRow key={`${g.label}-${gi}`}>
              <LabelRow>
                <SkipDot $color={tone.dot} aria-hidden />
                <SkipLabel $color={tone.label}>{g.label}</SkipLabel>
              </LabelRow>
              <SkipBox $bg={tone.box} $border={tone.border}>
                {g.items.map((item) => (
                  <SkipItem key={item}>
                    <SkipItemIcon aria-hidden>
                      {g.icon === "x" ? (
                        <IconX size={12} color={C.xIcon} />
                      ) : (
                        <IconUsers size={12} color={C.usersIcon} />
                      )}
                    </SkipItemIcon>
                    <SkipItemText>{item}</SkipItemText>
                  </SkipItem>
                ))}
              </SkipBox>
            </SkipGroupRow>
          );
        })}
      </SkipSection>

      <Divider />

      {/* 4. Your 5 Steps */}
      <StepsSection>
        <StepsHeader>
          <SectionHeader>
            <IconListChecks size={14} color={C.brand} />
            <SectionTitle>춘심 올인원 신청 시 5단계</SectionTitle>
          </SectionHeader>
          <AssistBadge aria-hidden>*</AssistBadge>
        </StepsHeader>

        <StepList>
          {STEPS.map((step, i) => (
            <StepRow key={step}>
              <StepNum $active={i === 0}>{i + 1}</StepNum>
              <StepText>{step}</StepText>
            </StepRow>
          ))}
        </StepList>

        <StepFootnote>
          참여 이후 사용법 학습은 반드시 권장드립니다.
        </StepFootnote>
        </StepsSection>
      </ScrollArea>

      {/* 푸터(고정) — 스크롤과 무관하게 하단 고정 */}
      <Footer>
        {startHref ? (
          <Cta as="a" href={startHref}>
            <IconArrowRight size={17} color={C.white} />
            {ctaLabel}
          </Cta>
        ) : (
          <Cta type="button" onClick={onStart}>
            <IconArrowRight size={17} color={C.white} />
            {ctaLabel}
          </Cta>
        )}

        <Reassurance>
          {REASSURANCE.map((r) => (
            <ReassureItem key={r.key}>
              {r.key === "lock" && <IconLock size={11} color={C.reassure} />}
              {r.key === "users" && <IconUsers size={11} color={C.reassure} />}
              {r.key === "clock" && <IconClock size={11} color={C.reassure} />}
              {r.label}
            </ReassureItem>
          ))}
        </Reassurance>
      </Footer>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────
 * styled-components — 치수·색 스펙 그대로.
 * ──────────────────────────────────────────────────────────── */
const Card = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: ${C.white};
  font-family: ${FONT};
  color: ${C.ink};
  -webkit-font-smoothing: antialiased;
`;

/* 헤더(고정) — 히어로 + 대비 스트립 */
const HeaderBlock = styled.div`
  flex-shrink: 0;
`;

/* 본문(스크롤 영역) */
const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

/* 1. Hero */
const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 20px 24px;
  background: ${C.heroBg};

  @media (min-width: 768px) {
    padding: 28px 32px 24px;
  }
`;

const HeroSub = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: ${C.heroSub};
  text-align: center;
`;

const HeadlineRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
`;

const HeadStrong = styled.span`
  font-size: 28px;
  font-weight: 800;
  color: ${C.brand};
`;

const HeadNormal = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: ${C.ink};
`;

/* 2. Contrast Strip */
const Strip = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 20px 28px;
  background: ${C.heroBg};

  @media (min-width: 768px) {
    gap: 24px;
    padding: 8px 32px 28px;
  }
`;

const StripCol = styled.div<{ $w: number }>`
  width: ${(p) => p.$w}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const GrayPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  background: ${C.grayPill};
`;

const PurplePill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  background: ${C.brand};
`;

const PillTextGray = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${C.grayText};
  white-space: nowrap;
`;

const PillTextWhite = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${C.white};
  white-space: nowrap;
`;

const NumGray = styled.span`
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: ${C.grayNum};
`;

const NumBrand = styled.span`
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  color: ${C.brand};
`;

/* 구분선 */
const Divider = styled.div`
  height: 1px;
  background: ${C.divider};
`;

/* 공통 섹션 헤더 */
const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionTitle = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${C.sectionTitle};
`;

/* 3. Skip Section */
const SkipSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px 20px;

  @media (min-width: 768px) {
    padding: 22px 32px;
  }
`;

const SkipGroupRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SkipDot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  flex-shrink: 0;
  background: ${(p) => p.$color};
`;

const SkipLabel = styled.span<{ $color: string }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.$color};
`;

const SkipBox = styled.div<{ $bg: string; $border: string }>`
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 14px;
  border-radius: 10px;
  background: ${(p) => p.$bg};
  border: 1px solid ${(p) => p.$border};
`;

const SkipItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SkipItemIcon = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const SkipItemText = styled.span`
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
  color: ${C.itemText};
`;

/* 4. Your 5 Steps */
const StepsSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 20px;

  @media (min-width: 768px) {
    padding: 22px 32px;
  }
`;

const StepsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AssistBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 9px;
  border-radius: 20px;
  background: ${C.assistBg};
  font-size: 10px;
  font-weight: 500;
  color: ${C.assistText};
`;

const StepList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

const StepRow = styled.li`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;

  &:not(:last-child) {
    border-bottom: 1px solid ${C.divider};
  }
`;

const StepNum = styled.span<{ $active: boolean }>`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: ${(p) => (p.$active ? C.numBgActive : C.numBgIdle)};
  color: ${(p) => (p.$active ? C.white : C.numTextIdle)};
`;

const StepText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${C.ink};
`;

const StepFootnote = styled.p`
  margin: 0;
  text-align: right;
  font-size: 11px;
  font-weight: 400;
  color: ${C.footnote};
`;

/* 5. Footer */
const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 20px max(20px, env(safe-area-inset-bottom));
  background: ${C.white};
  border-top: 1px solid ${C.divider};

  @media (min-width: 768px) {
    padding: 16px 32px max(24px, env(safe-area-inset-bottom));
  }
`;

const Cta = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 14px;
  background: ${C.brand};
  color: ${C.white};
  font-family: ${FONT};
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition:
    filter 0.15s ease,
    transform 0.1s ease;

  &:hover {
    filter: brightness(0.96);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid ${C.numBgIdle};
    outline-offset: 2px;
  }
`;

const Reassurance = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const ReassureItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 400;
  color: ${C.reassure};
`;
