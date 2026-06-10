"use client";

import { useCallback, useState, type ReactNode } from "react";
import styled from "styled-components";
import {
  KAKAO_INQUIRY_URL,
  KAKAO_MAP_URL,
  MO_TO_WBMB,
  NAVER_MAP_URL,
  OFFICE_ADDRESS,
  OFFICE_MAP_IFRAME_URL,
  formatVisitDateLong,
} from "./apply10mo.constants";

const FONT =
  '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// ② 전용 색 토큰 — 문서값 고정.
const C = {
  successBg: "#f0faf5",
  iconRingBg: "#d4f0e4",
  iconStroke: "#7bc4a8",
  successTitle: "#1a4a36",
  successSub: "#4a7a62",
  brand: "#6b5fd0",
  estTitle: "#4a3baa",
  summaryBg: "#f7f6fc",
  summaryBorder: "#ddd8f5",
  summaryDivider: "#e8e4f8",
  rowLabel: "#7770a8",
  rowValue: "#222222",
  stepBg: "#f0eff8",
  stepDivider: "#eeeef8",
  stepIdleBg: "#eee9ff",
  stepIdleText: "#8b80d0",
  stepText: "#333333",
  stepSub: "#888888",
  addrBg: "#fafafa",
  addrBorder: "#eeeeee",
  addrMain: "#222222",
  addrSub: "#888888",
  naverBg: "#f5f4fc",
  naverBorder: "#ddd8f5",
  naverText: "#5a50a0",
  kakaoBg: "#fee500",
  kakaoText: "#3a1d00",
  emailBorder: "#e0deef",
  homeBg: "#fafafa",
  homeBorder: "#e8e8e8",
  homeText: "#666666",
  homeIcon: "#888888",
  divider: "#f0eff8",
} as const;

/* ── lucide-react 경로 기반 인라인 아이콘 (장식 → aria-hidden) ── */
function Svg({
  size,
  stroke,
  strokeWidth = 2,
  children,
}: {
  size: number;
  stroke: string;
  strokeWidth?: number;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const IconCircleCheckBig = ({ size, stroke }: { size: number; stroke: string }) => (
  <Svg size={size} stroke={stroke}>
    <path d="M21.801 10A10 10 0 1 1 17 3.335" />
    <path d="m9 11 3 3L22 4" />
  </Svg>
);
const IconReceiptText = ({ size, stroke }: { size: number; stroke: string }) => (
  <Svg size={size} stroke={stroke}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1Z" />
    <path d="M14 8H8" />
    <path d="M16 12H8" />
    <path d="M13 16H8" />
  </Svg>
);
const IconListChecks = ({ size, stroke }: { size: number; stroke: string }) => (
  <Svg size={size} stroke={stroke}>
    <path d="m3 17 2 2 4-4" />
    <path d="m3 7 2 2 4-4" />
    <path d="M13 6h8" />
    <path d="M13 12h8" />
    <path d="M13 18h8" />
  </Svg>
);
const IconMapPin = ({ size, stroke }: { size: number; stroke: string }) => (
  <Svg size={size} stroke={stroke}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);
const IconCopy = ({ size, stroke }: { size: number; stroke: string }) => (
  <Svg size={size} stroke={stroke}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Svg>
);
const IconNavigation = ({ size, stroke }: { size: number; stroke: string }) => (
  <Svg size={size} stroke={stroke}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </Svg>
);
const IconMail = ({ size, stroke }: { size: number; stroke: string }) => (
  <Svg size={size} stroke={stroke}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Svg>
);
const IconArrowLeft = ({ size, stroke }: { size: number; stroke: string }) => (
  <Svg size={size} stroke={stroke}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Svg>
);

export interface Apply10MoResultData {
  quantity: number; // 모 단위 신청값
  contact: string;
  visitDate: string | null; // "YYYY-MM-DD" | null
}

interface Apply10MoResultProps {
  submitted: Apply10MoResultData;
  /** 표시용 신청번호("M10-2026-0042"). 없으면 번호 pill 숨김. */
  applicationNo?: string | null;
  onRestart: () => void;
}

export default function Apply10MoResult({
  submitted,
  applicationNo,
  onRestart,
}: Apply10MoResultProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(OFFICE_ADDRESS);
      } else {
        const ta = document.createElement("textarea");
        ta.value = OFFICE_ADDRESS;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("[Apply10Mo] address copy failed:", err);
    }
  }, []);

  const wbmb = (submitted.quantity * MO_TO_WBMB).toLocaleString("ko-KR");
  const visitLabel = formatVisitDateLong(submitted.visitDate) ?? "방문 시 조율";

  return (
    <Card>
      {/* ① 성공 헤더 */}
      <Header>
        <IconRing aria-hidden="true">
          <IconCircleCheckBig size={32} stroke={C.iconStroke} />
        </IconRing>
        <HeaderText>
          <SuccessTitle>신청이 접수되었습니다</SuccessTitle>
          {applicationNo ? (
            <AppNoPill>#{applicationNo}</AppNoPill>
          ) : null}
          <SuccessSub>곧 연락드려 방문 일정을 확정해 드릴게요.</SuccessSub>
        </HeaderText>
      </Header>

      {/* ② 바디 */}
      <Body>
        {/* 접수 요약 */}
        <SummaryBox>
          <SectionHead>
            <IconReceiptText size={14} stroke={C.brand} />
            <SectionTitle>접수 요약</SectionTitle>
          </SectionHead>
          <Rule $color={C.summaryDivider} />
          <DataRow>
            <RowLabel>신청 수량</RowLabel>
            <RowValue $weight={700}>{wbmb} WBMB</RowValue>
          </DataRow>
          <DataRow>
            <RowLabel>연락처</RowLabel>
            <RowValue $weight={600}>{submitted.contact}</RowValue>
          </DataRow>
          <DataRow>
            <RowLabel>희망 방문일</RowLabel>
            <RowValue $weight={600}>{visitLabel}</RowValue>
          </DataRow>
        </SummaryBox>

        {/* 다음 단계 */}
        <Section>
          <SectionHead>
            <IconListChecks size={15} stroke={C.brand} />
            <SectionTitle>다음 단계</SectionTitle>
          </SectionHead>
          <StepList>
            <StepRow>
              <StepNum $active>1</StepNum>
              <StepText>담당자가 연락드려 일정을 확정합니다.</StepText>
            </StepRow>
            <Rule $color={C.stepDivider} />
            <StepRow>
              <StepNum>2</StepNum>
              <StepCol>
                <StepText as="span">강남 사무실 방문</StepText>
                <StepSub>신규 참여자는 간단한 면대면 인증</StepSub>
              </StepCol>
            </StepRow>
            <Rule $color={C.stepDivider} />
            <StepRow>
              <StepNum>3</StepNum>
              <StepText>10 BMB 수령 및 보관 도움.</StepText>
            </StepRow>
          </StepList>
        </Section>

        <Rule $color={C.divider} />

        {/* 방문 위치 */}
        <Section>
          <SectionHead>
            <IconMapPin size={15} stroke={C.brand} />
            <SectionTitle>방문 위치</SectionTitle>
          </SectionHead>
          <AddressCard>
            <AddressMain>서울 서초구 사임당로 149-5 지하층</AddressMain>
            <AddressSub>
              서초 모빅회관 내 · 강남역 5번 출구 도보 약 10분
            </AddressSub>
            <CopyRow type="button" onClick={copyAddress}>
              <IconCopy size={13} stroke={C.brand} />
              <span>{copied ? "복사됨" : "주소 복사"}</span>
            </CopyRow>
          </AddressCard>
          <MapEmbed>
            <iframe
              src={OFFICE_MAP_IFRAME_URL}
              title="방문 위치 지도"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </MapEmbed>
          <MapRow>
            <MapButton
              href={NAVER_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              $variant="naver"
            >
              <IconNavigation size={14} stroke={C.naverText} />
              <span>네이버지도 길찾기</span>
            </MapButton>
            <MapButton
              href={KAKAO_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              $variant="kakao"
            >
              <IconMapPin size={14} stroke={C.kakaoText} />
              <span>카카오맵 보기</span>
            </MapButton>
          </MapRow>
        </Section>
      </Body>

      {/* ③ 푸터 */}
      <Footer>
        <AuxRow>
          <AuxLink href={KAKAO_INQUIRY_URL}>
            <IconMail size={14} stroke={C.brand} />
            <span>이메일 문의</span>
          </AuxLink>
        </AuxRow>
        <HomeButton type="button" onClick={onRestart}>
          <IconArrowLeft size={15} stroke={C.homeIcon} />
          <span>처음으로</span>
        </HomeButton>
      </Footer>
    </Card>
  );
}

/* ───────────── styled ───────────── */

const Card = styled.div`
  /* 모달(Apply10MoModal)의 flush Body를 채우는 flex 컬럼.
     헤더(고정) / 본문(스크롤) / 푸터(고정) 3단 구조. */
  width: 100%;
  flex: 1;
  min-height: 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  font-family: ${FONT};
  color: ${C.rowValue};
`;

const Header = styled.div`
  flex-shrink: 0;
  background: ${C.successBg};
  padding: 40px 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;

  @media (min-width: 768px) {
    padding: 40px 32px 32px;
  }
`;

const IconRing = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: ${C.iconRingBg};
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const HeaderText = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const SuccessTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${C.successTitle};
  text-align: center;
  line-height: 1.4;
`;

const AppNoPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  color: ${C.successTitle};
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const SuccessSub = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: ${C.successSub};
  text-align: center;
  line-height: 1.5;
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 24px 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (min-width: 768px) {
    padding: 24px 32px 16px;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryBox = styled.div`
  background: ${C.summaryBg};
  border: 1px solid ${C.summaryBorder};
  border-radius: 12px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionTitle = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${C.estTitle};
`;

const Rule = styled.div<{ $color: string }>`
  width: 100%;
  height: 1px;
  background: ${(p) => p.$color};
`;

const DataRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const RowLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${C.rowLabel};
`;

const RowValue = styled.span<{ $weight: number }>`
  font-size: 14px;
  font-weight: ${(p) => p.$weight};
  color: ${C.rowValue};
  text-align: right;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  background: ${C.stepBg};
  border-radius: 12px;
  overflow: hidden;
`;

const StepRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
`;

const StepNum = styled.span<{ $active?: boolean }>`
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: ${(p) => (p.$active ? C.brand : C.stepIdleBg)};
  color: ${(p) => (p.$active ? "#ffffff" : C.stepIdleText)};
`;

const StepCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const StepText = styled.span`
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: ${C.stepText};
  line-height: 1.5;
`;

const StepSub = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: ${C.stepSub};
  line-height: 1.45;
`;

const AddressCard = styled.div`
  background: ${C.addrBg};
  border: 1px solid ${C.addrBorder};
  border-radius: 12px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AddressMain = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${C.addrMain};
  line-height: 1.45;
`;

const AddressSub = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: ${C.addrSub};
  line-height: 1.45;
`;

const CopyRow = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: ${C.brand};
  font-family: inherit;

  &:hover {
    opacity: 0.85;
  }
`;

const MapEmbed = styled.div`
  width: 100%;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${C.addrBorder};

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
`;

const MapRow = styled.div`
  display: flex;
  width: 100%;
  gap: 10px;
  align-items: center;
`;

const MapButton = styled.a<{ $variant: "naver" | "kakao" }>`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  transition: filter 0.12s ease;

  background: ${(p) => (p.$variant === "naver" ? C.naverBg : C.kakaoBg)};
  border: ${(p) =>
    p.$variant === "naver" ? `1px solid ${C.naverBorder}` : "none"};
  color: ${(p) => (p.$variant === "naver" ? C.naverText : C.kakaoText)};

  &:hover {
    filter: brightness(0.97);
  }
`;

const Footer = styled.div`
  flex-shrink: 0;
  background: #ffffff;
  border-top: 1px solid #f0eff8;
  padding: 16px 24px max(28px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (min-width: 768px) {
    padding: 16px 32px max(28px, env(safe-area-inset-bottom));
  }
`;

const AuxRow = styled.div`
  display: flex;
  width: 100%;
  gap: 10px;
  justify-content: center;
  align-items: center;
`;

const AuxLink = styled.a`
  flex: 0 1 auto;
  min-width: 200px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  background: none;
  border: 1px solid ${C.emailBorder};
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: ${C.brand};
  transition: background-color 0.12s ease;

  &:hover {
    background: #faf9ff;
  }
`;

const HomeButton = styled.button`
  width: 100%;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${C.homeBg};
  border: 1px solid ${C.homeBorder};
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: ${C.homeText};
  transition: background-color 0.12s ease;

  &:hover {
    background: #f3f3f3;
  }
`;
