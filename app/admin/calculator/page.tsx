"use client";

import { useCallback, useEffect, useMemo, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import BmbUsdtTicker from "@/app/page/components/BmbUsdtTicker";
import { marginFloorKrw } from "@/lib/otc-estimate";

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 1rem;
  }
`;

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 1rem;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
  min-width: 72px;
`;

const Input = styled.input`
  width: 120px;
  padding: 0.5rem 0.65rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 0.5rem 0.9rem;
  min-height: 2.5rem;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? "#4338ca" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#eef2ff" : "#fff")};
  color: ${(p) => (p.$active ? "#4338ca" : "#374151")};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
`;

const Segment = styled.div`
  display: inline-flex;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  overflow: hidden;
`;

const SegmentButton = styled.button<{
  $active: boolean;
  $tone: "buy" | "sell";
}>`
  padding: 0.6rem 1.2rem;
  min-height: 2.75rem;
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  background: ${(p) =>
    p.$active ? (p.$tone === "buy" ? "#dc2626" : "#2563eb") : "#fff"};
  color: ${(p) => (p.$active ? "#fff" : "#6b7280")};
  transition: background 0.12s ease;

  & + & {
    border-left: 1px solid #e5e7eb;
  }
`;

const RefreshButton = styled.button`
  padding: 0.45rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: #f9fafb;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Meta = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.5rem;
`;

const Orderbook = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const LevelRow = styled.div`
  display: grid;
  grid-template-columns: 96px 1fr 88px;
  gap: 8px;
  align-items: center;
  font-size: 0.9rem;
`;

const BarTrack = styled.div`
  height: 18px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

/** 체결 수량 막대 — filledQty / max(filledQty) × 100% (size 미사용). */
const BarFill = styled.div<{
  $pct: number;
  $partial: boolean;
  $tone: "buy" | "sell";
}>`
  height: 100%;
  width: ${(p) => Math.max(0, Math.min(100, p.$pct))}%;
  background: ${(p) =>
    p.$tone === "buy"
      ? p.$partial
        ? "#f87171"
        : "#dc2626"
      : p.$partial
        ? "#60a5fa"
        : "#2563eb"};
  border-radius: 4px;
`;

const LevelMeta = styled.span<{ $active: boolean; $tone: "buy" | "sell" }>`
  color: ${(p) =>
    p.$active ? (p.$tone === "buy" ? "#991b1b" : "#1e40af") : "#9ca3af"};
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  text-align: right;
  white-space: nowrap;
`;

const CollapseRow = styled.button`
  margin-top: 4px;
  width: 100%;
  padding: 0.5rem;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #f3f4f6;
  }
`;

const WarnBanner = styled.div<{ $severe?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  border: 1px solid ${(p) => (p.$severe ? "#dc2626" : "#fca5a5")};
  background: ${(p) => (p.$severe ? "#fef2f2" : "#fff5f5")};
  color: #991b1b;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.45;
  margin-bottom: 0.75rem;
`;

const WarnMark = styled.span`
  flex-shrink: 0;
  font-weight: 800;
`;

const NegotiationCard = styled.div`
  border: 1px solid #fcd34d;
  border-left: 3px solid #d97706;
  background: #fffbeb;
  border-radius: 14px;
  padding: 1.1rem 1.3rem;
  margin-bottom: 0.85rem;
`;

const NegotiationLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 800;
  color: #92400e;
  margin-bottom: 0.4rem;
`;

const NegotiationValue = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.5;
`;

const NegotiationSub = styled.div`
  font-size: 0.8rem;
  color: #78716c;
  margin-top: 0.4rem;
`;

const ErrorBox = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

// ─────────────────────────── 상단 안내 / 섹션 공통 ───────────────────────────

/** 상시 표시되는 최상단 운영 안내. */
const TopHint = styled.div`
  font-size: 0.8rem;
  line-height: 1.5;
  color: #4b5563;
  background: #f9fafb;
  border: 1px solid #eceef1;
  border-radius: 10px;
  padding: 0.55rem 0.9rem;
  margin-bottom: 1rem;
  strong {
    font-weight: 700;
  }
`;

/** ⓘ 호버 안내 아이콘. */
const InfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  margin-left: 6px;
  cursor: help;
  flex-shrink: 0;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem 1.25rem;
`;

const SummaryCell = styled.div`
  min-width: 0;
`;

const SummaryLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.2rem;
`;

const SummaryValue = styled.div<{ $accent?: boolean; $hero?: boolean }>`
  font-size: ${(p) => (p.$hero ? "1.7rem" : "1.2rem")};
  font-weight: ${(p) => (p.$hero ? 900 : 800)};
  line-height: 1.1;
  color: ${(p) =>
    p.$accent ? "#15803d" : p.$hero ? "#312e81" : "#111827"};

  @media (min-width: 768px) {
    font-size: ${(p) => (p.$hero ? "2.1rem" : "1.2rem")};
  }
`;

const SummaryUnit = styled.div<{ $hero?: boolean }>`
  font-size: ${(p) => (p.$hero ? "1.05rem" : "0.95rem")};
  font-weight: ${(p) => (p.$hero ? 700 : 600)};
  color: ${(p) => (p.$hero ? "#374151" : "#6b7280")};
  margin-top: 0.2rem;

  @media (min-width: 768px) {
    font-size: ${(p) => (p.$hero ? "1.15rem" : "0.95rem")};
  }
`;

const StatusDot = styled.span<{ $tone: StatusTone }>`
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: ${(p) => STATUS_STYLE[p.$tone].border};
  flex-shrink: 0;
`;

// ── 섹션 ② 단가 산정 ──

/** 시세 보드(BmbUsdtTicker) + 상태 배지 한 줄 묶음. */
const TickerWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;

    > *:first-child {
      flex: 1;
      min-width: 0;
    }
  }
`;

const QuoteLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.25rem;
  margin-bottom: 0.35rem;
`;

const QuoteItem = styled.span`
  font-size: 0.85rem;
  color: #6b7280;
  strong {
    color: #111827;
    font-weight: 800;
    margin-left: 4px;
  }
`;

const StatusBadge = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 1px solid ${(p) => STATUS_STYLE[p.$tone].border};
  background: ${(p) => STATUS_STYLE[p.$tone].bg};
  color: ${(p) => STATUS_STYLE[p.$tone].text};
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
`;

const StatusReasonLine = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.85rem;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 0.85rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.65rem 1.1rem;
  min-height: 2.75rem;
  border: none;
  background: none;
  font-size: 0.88rem;
  font-weight: ${(p) => (p.$active ? 800 : 600)};
  color: ${(p) => (p.$active ? "#4338ca" : "#9ca3af")};
  border-bottom: 2px solid ${(p) => (p.$active ? "#4338ca" : "transparent")};
  margin-bottom: -2px;
  cursor: pointer;
  transition: color 0.12s ease;
  &:hover {
    color: ${(p) => (p.$active ? "#4338ca" : "#374151")};
  }
`;

const TabDesc = styled.div`
  font-size: 0.75rem;
  line-height: 1.5;
  color: #9ca3af;
  margin-bottom: 0.75rem;
`;

const VwapInfoLine = styled.div`
  font-size: 0.85rem;
  color: #4b5563;
  margin-bottom: 0.75rem;
  strong {
    color: #111827;
    font-weight: 700;
  }
`;

/** 손님가(최종 결과) 박스 — 화면에서 가장 강조되는 "답". */
const FinalBox = styled.div`
  border: 2px solid #4338ca;
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfbff 0%, #fff 45%);
  padding: 1.1rem 1.3rem;
  margin-top: 0.85rem;
  box-shadow: 0 2px 10px rgba(67, 56, 202, 0.1);
`;

/** 호가 평단가 — 참고 기준(원가). 최종가로 오인되지 않게 절제된 박스. */
const VwapHero = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.15rem 0.6rem;
  border: 1px solid #eceef1;
  background: #f9fafb;
  border-radius: 10px;
  padding: 0.55rem 0.85rem;
  margin-bottom: 0.85rem;
`;

const VwapHeroLabel = styled.span`
  font-size: 0.76rem;
  font-weight: 700;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
`;

const VwapHeroValue = styled.span`
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;
  color: #374151;
`;

const VwapHeroSub = styled.span`
  font-size: 0.78rem;
  color: #9ca3af;
`;

// ── 시장 환경 시각 요소 ──

const TrendValue = styled.span<{ $color: string }>`
  color: ${(p) => p.$color};
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

const FgTrack = styled.div`
  position: relative;
  height: 6px;
  border-radius: 999px;
  margin-top: 0.5rem;
  background: linear-gradient(
    90deg,
    #b91c1c 0%,
    #ea580c 30%,
    #ca8a04 50%,
    #65a30d 70%,
    #16a34a 100%
  );
`;

const FgMarker = styled.span<{ $left: number }>`
  position: absolute;
  left: ${(p) => Math.max(0, Math.min(100, p.$left))}%;
  top: 50%;
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #374151;
  transform: translate(-50%, -50%);
`;

const CopyButton = styled.button<{ $copied: boolean }>`
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$copied ? "#0F6E56" : "#d1d5db")};
  background: ${(p) => (p.$copied ? "#0F6E56" : "#fff")};
  color: ${(p) => (p.$copied ? "#fff" : "#374151")};
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s ease;
  &:hover:not(:disabled) {
    background: ${(p) => (p.$copied ? "#0F6E56" : "#f9fafb")};
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

// 섹션 B — 시장 환경 카드 (사실·수치만, 색 판정 없음)
const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.6rem;
`;

const MetricBox = styled.div`
  background: #f9fafb;
  border: 1px solid #eceef1;
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
`;

const MetricLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.3rem;
`;

const MetricValue = styled.div`
  font-size: 1.05rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.25;
`;

const MetricSub = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.2rem;
`;

// 가격 포지션 막대 (위치 관계로 표시, 숫자 나열 대신)
const PositionList = styled.div`
  display: flex;
  flex-direction: column;
`;

const PositionRow = styled.div<{ $head?: boolean }>`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.2rem 0.75rem;
  align-items: baseline;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f3f5;
  ${(p) =>
    p.$head
      ? "background: #fafafa; border-radius: 8px; padding: 0.5rem 0.6rem;"
      : ""}

  @media (min-width: 768px) {
    grid-template-columns: 110px 1fr auto;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const PositionLabel = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
`;

const PositionVal = styled.span`
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
  white-space: nowrap;

  @media (min-width: 768px) {
    text-align: right;
  }
`;

const PositionDiff = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  grid-column: 1 / -1;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${(p) => p.$color};
  white-space: nowrap;

  @media (min-width: 768px) {
    grid-column: auto;
    justify-content: flex-end;
  }
`;

// 섹션 C — 매물대 분포 (펼치기)
const ToggleRow = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: none;
  padding: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #4f46e5;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const ProfileMeta = styled.div`
  font-size: 0.76rem;
  color: #6b7280;
  margin: 0.75rem 0 0.6rem;
`;

const ProfileRow = styled.div<{ $current?: boolean }>`
  display: grid;
  grid-template-columns: 132px 1fr 48px;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.76rem;
  padding: 0.18rem 0.35rem;
  border-radius: 6px;
  background: ${(p) => (p.$current ? "#fff7ed" : "transparent")};
  outline: ${(p) => (p.$current ? "1px solid #fdba74" : "none")};
`;

const ProfilePriceCell = styled.span`
  color: #475569;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
`;

const CurrentTag = styled.span`
  font-size: 0.64rem;
  font-weight: 700;
  color: #c2410c;
  background: #ffedd5;
  border-radius: 4px;
  padding: 0 0.25rem;
`;

const ProfileBarTrack = styled.div`
  height: 14px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
`;

const ProfileBarFill = styled.div<{ $pct: number; $current?: boolean }>`
  height: 100%;
  width: ${(p) => Math.max(0, Math.min(100, p.$pct))}%;
  background: ${(p) => (p.$current ? "#fb923c" : "#94a3b8")};
  border-radius: 4px;
`;

const ProfilePct = styled.span`
  text-align: right;
  font-weight: 600;
  color: #334155;
`;

const PartialNote = styled.div`
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: #9a3412;
`;

const StatusLoading = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
`;

/** 섹션 사용 안내 — "언제 보는지"만(수치 해석 아님). 12px, 보조색, 1줄. */
const SectionHint = styled.div`
  font-size: 0.75rem;
  line-height: 1.4;
  color: #9ca3af;
  margin: -0.4rem 0 0.85rem;
`;

const CopyHint = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.4;
`;

const ExtLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: #9ca3af;
  margin-left: 4px;
  &:hover {
    color: #4b5563;
  }
`;

function SourceLink({ href, title }: { href: string; title: string }) {
  return (
    <ExtLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </ExtLink>
  );
}

interface Level {
  price: number;
  size: number;
  filledQty: number;
}

type Direction = "buy" | "sell";

interface CalcData {
  quantity: number;
  direction: Direction;
  levels: Level[];
  vwap: number;
  totalUsdt: number;
  usdtKrw: number;
  totalKrw: number;
  vwapKrw: number;
  lastPrice: number | null;
  lastPriceKrw: number | null;
  source: string;
  asOf: string;
}

// ─── 시장 상태 바: market-signals 응답 미러 타입 (서버 모듈 직접 import 금지) ───

interface SignalBucket {
  lowPrice: number;
  highPrice: number;
  volumePct: number;
}

interface SignalBox {
  bound: "박스권" | "추세";
  widthPct: number;
  pricePosition: number;
}

interface SignalsData {
  bmb: {
    avg7: number | null;
    avg30: number | null;
    avg90: number | null;
    volToday: number | null;
    volPrevDay: number | null;
    volAvg7: number | null;
    volAvg30: number | null;
    volAvg90: number | null;
    volumeProfile: SignalBucket[];
    profileDays: number;
    profileFrom: string | null;
    profileTo: string | null;
    currentBucketIndex: number | null;
    boxByPeriod: {
      d7: SignalBox | null;
      d30: SignalBox | null;
      d90: SignalBox | null;
    };
    supportResistance: {
      currentZonePct: number;
      nearestResistance: SignalBucket | null;
      nearestSupport: SignalBucket | null;
    } | null;
  } | null;
  btc: {
    chg7: number | null;
    chg30: number | null;
    ma200Above: boolean | null;
  } | null;
  env: {
    fearGreed: { value: number; classification: string } | null;
    kimchiPremium: number | null;
    traditionalKimchi: number | null;
    fxUsdKrw: number | null;
  };
  lastPrice: number | null;
  lastPriceKrw: number | null;
  usdtKrw: number | null;
  marketStatus: "green" | "yellow" | "red";
  reasons: string[];
  analysisText: string;
  partial: boolean;
  failed: string[];
  asOf: string;
}

type StatusTone = "green" | "yellow" | "red" | "neutral";

/** 신호등 색/문구. green·yellow·red는 명세 색, neutral은 로딩/실패 대비. */
const STATUS_STYLE: Record<
  StatusTone,
  { border: string; bg: string; text: string; label: string }
> = {
  green: {
    border: "#0F6E56",
    bg: "#E1F5EE",
    text: "#085041",
    label: "시장 안정",
  },
  yellow: {
    border: "#BA7517",
    bg: "#FAEEDA",
    text: "#633806",
    label: "시장 주의",
  },
  red: {
    border: "#A32D2D",
    bg: "#FCEBEB",
    text: "#791F1F",
    label: "시장 주의 — 신중 검토",
  },
  neutral: {
    border: "#9ca3af",
    bg: "#f9fafb",
    text: "#4b5563",
    label: "시장 지표",
  },
};

/** 지표 근거 원본 소스. 소스가 바뀌면 여기만 수정. */
const SOURCE_LINKS = {
  /** 현재가/호가/평균/거래량/매물대/박스권 */
  bmb: "https://www.lbank.com/trade/bmb_usdt",
  /** BTC 등락/200일선/볼린저 */
  btc: "https://www.binance.com/en/trade/BTC_USDT",
  /** 공포·탐욕 지수 */
  fearGreed: "https://alternative.me/crypto/fear-and-greed-index/",
} as const;

/** 유동성/괴리 경고 임계치(%). 운영 중 조정 가능. */
const LIQUIDITY_THRESHOLDS = {
  /** 수량이 일거래량의 이 비율(%) 초과 → 즉시 체결 주의 */
  tightPct: 30,
  /** 수량이 일거래량의 이 비율(%) 초과 → 호가만으로 체결 불가 */
  blockPct: 100,
  /** 호가 소진 평단가가 현재가에서 이 %(절대값) 초과 괴리 → 비현실 단가 경고 */
  vwapGapPct: 10,
} as const;

const MARGIN_CHIPS = [1, 2] as const;

/** 마진 하한(%) — 1% 미만 입력 불가, 입력 시 1%로 보정. */
const MIN_MARGIN_PCT = 1;

/** 수량 입력 기본값 — blur 시 빈칸이면 복귀. */
const DEFAULT_QTY = 10;

const EXTRA_LEVELS = 8;

/** 상태 배지용 짧은 라벨. */
const BADGE_LABEL: Record<StatusTone, string> = {
  green: "안정",
  yellow: "주의",
  red: "주의 · 신중",
  neutral: "지표 대기",
};

function fmtUsdt(n: number) {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtKrw(n: number) {
  return Math.round(n).toLocaleString("ko-KR");
}

/** 원화 입력 요약 — 300만원 등 자연스러운 표기. */
function fmtKrwBrief(won: number): string {
  if (won >= 10_000 && won % 10_000 === 0) {
    return `${(won / 10_000).toLocaleString("ko-KR")}만원`;
  }
  return `${fmtKrw(won)}원`;
}

function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const v = Number(trimmed);
  if (!Number.isInteger(v) || v <= 0) return null;
  return v;
}

function parsePositiveKrw(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const v = Number(trimmed);
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.round(v);
}

/** 입력칸 포커스 시 전체 선택 — 바로 덮어쓰기 가능. */
function selectAllOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.currentTarget.select();
}

/** 호가 체결 수량 — 라벨·막대가 같은 값을 쓰도록 소수 2자리까지. */
function fmtLevelQty(n: number): string {
  const r = Math.round(n * 100) / 100;
  return r.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** 막대 채움(%) — 내 주문 중 이 호가가 차지한 비중 = filledQty / 입력수량. */
function levelFillBarPct(filledQty: number, totalQty: number): number {
  if (filledQty <= 0 || totalQty <= 0) return 0;
  return Math.min(100, (filledQty / totalQty) * 100);
}

function fmtPct(n: number) {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** % 1자리 부호 표시: +1.2% / −0.8% / 0.0% */
function fmtPctSigned(n: number | null): string {
  if (n == null) return "—";
  const v = Math.round(n * 10) / 10;
  const norm = v === 0 ? 0 : v;
  if (norm > 0) return `+${fmtPct(norm)}%`;
  if (norm < 0) return `−${fmtPct(Math.abs(norm))}%`;
  return "0.0%";
}

/** 공포·탐욕 영문 분류 → 한글(사실 분류명만, 색 판정 없음). */
const FEAR_GREED_KO: Record<string, string> = {
  "Extreme Fear": "극공포",
  Fear: "공포",
  Neutral: "중립",
  Greed: "탐욕",
  "Extreme Greed": "극탐욕",
};
function fearGreedKo(en: string | null | undefined): string {
  if (!en) return "—";
  return FEAR_GREED_KO[en] ?? en;
}

/** USDT 차이 부호 표시: +1.23 / −0.45 / 0.00 (가격 단위). */
function fmtUsdtSigned(n: number | null): string {
  if (n == null) return "—";
  const r = Math.round(n * 100) / 100;
  if (r > 0) return `+${fmtUsdt(r)}`;
  if (r < 0) return `−${fmtUsdt(Math.abs(r))}`;
  return "0.00";
}

/** Fear&Greed 공식 색 관습: 극공포 진빨강 ~ 극탐욕 초록. */
function fearGreedColor(v: number): string {
  if (v <= 24) return "#b91c1c";
  if (v <= 44) return "#ea580c";
  if (v <= 55) return "#ca8a04";
  if (v <= 74) return "#65a30d";
  return "#16a34a";
}

/** 김프 부호 색 — 한국 관습상 +김프(과열)=빨강, −=파랑, 0 근처 회색. */
function kimchiColor(v: number | null): string {
  if (v == null) return "#6b7280";
  const r = Math.round(v * 10) / 10;
  if (r > 0) return "#dc2626";
  if (r < 0) return "#2563eb";
  return "#6b7280";
}

/** ti-trending-up / ti-trending-down 형태의 인라인 SVG. */
function TrendIcon({ up }: { up: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ verticalAlign: "-2px" }}
    >
      {up ? (
        <>
          <polyline points="3 17 9 11 13 15 21 7" />
          <polyline points="14 7 21 7 21 14" />
        </>
      ) : (
        <>
          <polyline points="3 7 9 13 13 9 21 17" />
          <polyline points="14 17 21 17 21 10" />
        </>
      )}
    </svg>
  );
}

type InputMode = "qty" | "krw";

export default function AdminCalculatorPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>("qty");
  const [quantityInput, setQuantityInput] = useState(String(DEFAULT_QTY));
  const [krwInput, setKrwInput] = useState("");
  const [direction, setDirection] = useState<Direction>("buy");
  // 단가 산정 탭 — 기본 "평단가 기준". 탭마다 마진을 따로 둔다.
  const [priceTab, setPriceTab] = useState<"current" | "vwap">("vwap");
  const [marginCur, setMarginCur] = useState(1);
  const [customCur, setCustomCur] = useState("");
  const [marginVwap, setMarginVwap] = useState(1);
  const [customVwap, setCustomVwap] = useState("");
  const [usdtKrwOverride, setUsdtKrwOverride] = useState("");
  const [data, setData] = useState<CalcData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [signals, setSignals] = useState<SignalsData | null>(null);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalsError, setSignalsError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 직접 입력은 1% 미만이면 1%로 보정(MIN_MARGIN_PCT).
  const effMarginCur = useMemo(() => {
    if (customCur.trim() !== "") {
      const v = Number(customCur);
      if (Number.isFinite(v) && v > 0) return Math.max(MIN_MARGIN_PCT, v);
    }
    return marginCur;
  }, [customCur, marginCur]);

  const effMarginVwap = useMemo(() => {
    if (customVwap.trim() !== "") {
      const v = Number(customVwap);
      if (Number.isFinite(v) && v > 0) return Math.max(MIN_MARGIN_PCT, v);
    }
    return marginVwap;
  }, [customVwap, marginVwap]);

  const effectiveUsdtKrw = useMemo(() => {
    if (usdtKrwOverride.trim() !== "") {
      const v = Number(usdtKrwOverride.replace(/,/g, ""));
      if (Number.isFinite(v) && v > 0) return v;
    }
    return data?.usdtKrw ?? signals?.usdtKrw ?? null;
  }, [usdtKrwOverride, data?.usdtKrw, signals?.usdtKrw]);

  /** 원화→수량 환산·표시용 현재가 — otc-calc 응답 없어도 시장 지표로 환산 가능. */
  const lastPriceUsdtForConvert = useMemo(
    () => data?.lastPrice ?? signals?.lastPrice ?? null,
    [data?.lastPrice, signals?.lastPrice],
  );

  /** 모빅 1개당 원화 ≈ 현재가(USDT) × USDT환율 */
  const bmbKrwPerUnit = useMemo(() => {
    if (lastPriceUsdtForConvert == null || effectiveUsdtKrw == null) return null;
    return lastPriceUsdtForConvert * effectiveUsdtKrw;
  }, [lastPriceUsdtForConvert, effectiveUsdtKrw]);

  const parsedKrwInput = useMemo(
    () => parsePositiveKrw(krwInput),
    [krwInput],
  );

  /** 계산 파이프라인에 투입할 유효 수량 — 입력 모드에 따라 파싱/환산. */
  const effectiveQuantity = useMemo(() => {
    if (inputMode === "qty") {
      return parsePositiveInt(quantityInput);
    }
    if (parsedKrwInput == null || bmbKrwPerUnit == null || bmbKrwPerUnit <= 0) {
      return null;
    }
    const rounded = Math.round(parsedKrwInput / bmbKrwPerUnit);
    return rounded > 0 ? rounded : null;
  }, [inputMode, quantityInput, parsedKrwInput, bmbKrwPerUnit]);

  const inputHint = useMemo(() => {
    if (inputMode === "qty") {
      if (quantityInput.trim() === "") return "수량을 입력하세요";
      if (parsePositiveInt(quantityInput) == null) return "올바른 수량(양의 정수)을 입력하세요";
      return null;
    }
    if (krwInput.trim() === "") return "원화 금액을 입력하세요";
    if (parsedKrwInput == null) return "올바른 원화 금액(양의 정수)을 입력하세요";
    if (bmbKrwPerUnit == null) {
      return signalsLoading
        ? "시세·환율 조회 중…"
        : "현재가·환율 조회 후 환산됩니다";
    }
    if (effectiveQuantity == null) return "환산 수량이 0개입니다 — 금액을 늘려주세요";
    return null;
  }, [
    inputMode,
    quantityInput,
    krwInput,
    parsedKrwInput,
    bmbKrwPerUnit,
    effectiveQuantity,
    signalsLoading,
  ]);

  const fetchCalc = useCallback(async () => {
    if (effectiveQuantity == null) {
      // 수량 모드: 유효 수량 없으면 결과 비움. 원화 모드: 시세 참조용 data 유지.
      if (inputMode === "qty") {
        setData(null);
      }
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/otc-calc?quantity=${effectiveQuantity}&direction=${direction}`,
      );
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "호가를 불러오지 못했습니다.");
      }
      setData(json);
      setExpanded(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [effectiveQuantity, direction, inputMode, router]);

  // 400ms 디바운스 — 수량 타이핑 키스트로크마다 otc-calc를 부르지 않게 (B-6)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCalc();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchCalc]);

  // 시장 지표는 수량과 무관(5분 캐시). 마운트 1회 + 새로고침 시에만 호출.
  const fetchSignals = useCallback(async () => {
    setSignalsLoading(true);
    setSignalsError(null);
    try {
      const res = await fetch("/api/admin/market-signals?buckets=10");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "시장 지표를 불러오지 못했습니다.");
      }
      setSignals(json as SignalsData);
    } catch (e) {
      setSignalsError(
        e instanceof Error ? e.message : "시장 지표 조회에 실패했습니다.",
      );
    } finally {
      setSignalsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const isBuy = (data?.direction ?? direction) === "buy";

  const vwapUsdt = data?.vwap ?? null;
  const lastPriceUsdt = data?.lastPrice ?? signals?.lastPrice ?? null;

  // 탭별 기준가 — 산식은 동일(기준가 × (1±마진)), 기준가만 탭으로 선택.
  //   현재가 기준: 손님 판매 신청 응대 — LBANK 호가가 우리 매수가가 아님.
  //   평단가 기준: 호가를 실제 긁어 매입 — 호가 소진 평단가가 실제 원가.
  const activeMargin = priceTab === "current" ? effMarginCur : effMarginVwap;
  const baseUsdt = priceTab === "current" ? lastPriceUsdt : vwapUsdt;

  // 현재가 기준 탭의 "바닥값" = 현재가 × (1 ± 마진). 최소 마진을 보장하는 하한/상한.
  const currentFloorUsdt =
    lastPriceUsdt != null
      ? lastPriceUsdt * (1 + ((isBuy ? 1 : -1) * effMarginCur) / 100)
      : null;

  // 현재가 기준 탭 손님가:
  //   구매자(buy) = max(호가 평단가, 바닥값) — 호가가 이미 비싸면 호가를 따른다.
  //   판매자(sell) = min(호가 평단가, 바닥값) — 호가가 이미 싸면 호가를 따른다.
  //   바닥값은 어디까지나 최소 마진 보장용 하한/상한.
  const currentPriceSource: "vwap" | "floor" | null =
    priceTab !== "current" || currentFloorUsdt == null
      ? null
      : vwapUsdt == null
        ? "floor"
        : isBuy
          ? vwapUsdt >= currentFloorUsdt
            ? "vwap"
            : "floor"
          : vwapUsdt <= currentFloorUsdt
            ? "vwap"
            : "floor";

  const currentSourceLabel =
    currentPriceSource === "vwap"
      ? "호가 평단가 적용"
      : currentPriceSource === "floor"
        ? "현재가+최소마진 적용"
        : null;

  const customerPriceUsdt =
    priceTab === "current"
      ? currentFloorUsdt == null
        ? null
        : currentPriceSource === "vwap" && vwapUsdt != null
          ? vwapUsdt
          : currentFloorUsdt
      : vwapUsdt != null
        ? vwapUsdt * (1 + ((isBuy ? 1 : -1) * effMarginVwap) / 100)
        : null;

  const customerPriceKrw =
    customerPriceUsdt != null && effectiveUsdtKrw != null
      ? customerPriceUsdt * effectiveUsdtKrw
      : null;

  const vwapKrw =
    vwapUsdt != null && effectiveUsdtKrw != null
      ? vwapUsdt * effectiveUsdtKrw
      : null;

  const customerTotalUsdt =
    customerPriceUsdt != null && data
      ? customerPriceUsdt * data.quantity
      : null;
  const customerTotalKrw =
    customerTotalUsdt != null && effectiveUsdtKrw != null
      ? customerTotalUsdt * effectiveUsdtKrw
      : null;

  // 활성 탭 차익 = (손님가 − 기준가) × 수량 (우리 관점 부호: 양수=우리 이익)
  const profitTabUsdt =
    customerPriceUsdt != null && baseUsdt != null && data
      ? (isBuy ? customerPriceUsdt - baseUsdt : baseUsdt - customerPriceUsdt) *
        data.quantity
      : null;
  const profitTabKrw =
    profitTabUsdt != null && effectiveUsdtKrw != null
      ? profitTabUsdt * effectiveUsdtKrw
      : null;

  // 마진 하한 참고 — 손님 estimate와 동일한 하한((수량/10)×3만원).
  // 계산기 산식은 기존 유지하고, 활성 탭 차익이 하한에 못 미치면 참고로만 표시.
  const floorKrw = data ? marginFloorKrw(data.quantity) : null;
  const floorShortfall =
    floorKrw != null &&
    floorKrw > 0 &&
    profitTabKrw != null &&
    profitTabKrw < floorKrw;
  // 하한을 채우는 참고 단가 = 기준가 ± 하한/수량 (buy는 +, sell은 −)
  const floorRefPriceKrw =
    floorShortfall && baseUsdt != null && effectiveUsdtKrw != null && data
      ? baseUsdt * effectiveUsdtKrw +
        ((isBuy ? 1 : -1) * floorKrw) / data.quantity
      : null;

  // 복사 텍스트용 — 호가 소진 평단가 기준 / 현재가 기준 차익 둘 다(산식 기존 그대로).
  const profitUsdt =
    customerPriceUsdt != null && vwapUsdt != null && data
      ? (isBuy ? customerPriceUsdt - vwapUsdt : vwapUsdt - customerPriceUsdt) *
        data.quantity
      : null;
  const profitKrw =
    profitUsdt != null && effectiveUsdtKrw != null
      ? profitUsdt * effectiveUsdtKrw
      : null;

  const effMarginPct =
    customerPriceUsdt != null && vwapUsdt != null && vwapUsdt > 0
      ? (isBuy
          ? customerPriceUsdt / vwapUsdt - 1
          : 1 - customerPriceUsdt / vwapUsdt) * 100
      : null;

  const profitCurUsdt =
    customerPriceUsdt != null && lastPriceUsdt != null && data
      ? (isBuy
          ? customerPriceUsdt - lastPriceUsdt
          : lastPriceUsdt - customerPriceUsdt) * data.quantity
      : null;
  const profitCurKrw =
    profitCurUsdt != null && effectiveUsdtKrw != null
      ? profitCurUsdt * effectiveUsdtKrw
      : null;
  const curVsMarketPct =
    customerPriceUsdt != null && lastPriceUsdt != null && lastPriceUsdt > 0
      ? (isBuy
          ? customerPriceUsdt / lastPriceUsdt - 1
          : 1 - customerPriceUsdt / lastPriceUsdt) * 100
      : null;

  // 호가 소진 평단가 vs 현재가 — 탭 정보줄용(% / 가격 단위)
  const vwapVsCurUsdt =
    vwapUsdt != null && lastPriceUsdt != null ? vwapUsdt - lastPriceUsdt : null;

  const lastFilledIdx = useMemo(() => {
    if (!data?.levels.length) return -1;
    let idx = -1;
    data.levels.forEach((l, i) => {
      if (l.filledQty > 0) idx = i;
    });
    return idx;
  }, [data?.levels]);

  const visibleCount = lastFilledIdx + 1 + EXTRA_LEVELS;
  const hiddenCount = data ? Math.max(0, data.levels.length - visibleCount) : 0;
  const visibleLevels =
    data && !expanded
      ? data.levels.slice(0, visibleCount)
      : (data?.levels ?? []);

  const tone: "buy" | "sell" = isBuy ? "buy" : "sell";

  const statusTone: StatusTone = signals?.marketStatus ?? "neutral";
  const sig = signals;
  const sb = sig?.bmb ?? null;
  const sbtc = sig?.btc ?? null;
  const senv = sig?.env ?? null;

  // 전일(완료) 거래량 대비 7일 평균 비율 — 사실값(색 판정 없음).
  const volPrevVsAvgPct =
    sb?.volPrevDay != null && sb.volAvg7 != null && sb.volAvg7 > 0
      ? (sb.volPrevDay / sb.volAvg7) * 100
      : null;
  const fgValue = senv?.fearGreed?.value ?? null;

  // [1] 유동성 경고 — 주문 수량 vs 일거래량(7일 평균 우선, 없으면 오늘)
  const dailyVol = sb?.volAvg7 ?? sb?.volPrevDay ?? null;
  const volBasisLabel = sb?.volAvg7 != null ? "7일 평균 거래량" : "전일 거래량";
  const orderVolPct =
    dailyVol != null && dailyVol > 0 && effectiveQuantity != null
      ? (effectiveQuantity / dailyVol) * 100
      : null;
  const liquidityLevel: "block" | "tight" | null =
    orderVolPct == null
      ? null
      : orderVolPct > LIQUIDITY_THRESHOLDS.blockPct
        ? "block"
        : orderVolPct > LIQUIDITY_THRESHOLDS.tightPct
          ? "tight"
          : null;

  // [2] 호가 소진 평단가 괴리 경고 — 현재가에서 ±임계 초과
  const vwapGapPct =
    vwapUsdt != null && lastPriceUsdt != null && lastPriceUsdt > 0
      ? ((vwapUsdt - lastPriceUsdt) / lastPriceUsdt) * 100
      : null;
  const vwapGapExceeded =
    vwapGapPct != null &&
    Math.abs(vwapGapPct) > LIQUIDITY_THRESHOLDS.vwapGapPct;

  const hasLiquidityWarning = liquidityLevel != null || vwapGapExceeded;

  // [3] 협상 기준가 — 현재가 / 7일평균 / 30일평균 중 우리에게 유리한 쪽
  //   구매자(우리=판매측): 높은 쪽 / 판매자(우리=매입측): 낮은 쪽
  const avg7Usdt = sb?.avg7 ?? null;
  const avg30Usdt = sb?.avg30 ?? null;

  const negCandidates: { label: string; usdt: number }[] = [];
  if (lastPriceUsdt != null)
    negCandidates.push({ label: "현재가", usdt: lastPriceUsdt });
  if (avg7Usdt != null)
    negCandidates.push({ label: "7일평균", usdt: avg7Usdt });
  if (avg30Usdt != null)
    negCandidates.push({ label: "30일평균", usdt: avg30Usdt });

  const negBasis =
    negCandidates.length > 0
      ? negCandidates.reduce((best, c) =>
          isBuy
            ? c.usdt > best.usdt
              ? c
              : best
            : c.usdt < best.usdt
              ? c
              : best,
        )
      : null;
  const negPriceUsdt = negBasis?.usdt ?? null;
  const negPriceKrw =
    negPriceUsdt != null && effectiveUsdtKrw != null
      ? negPriceUsdt * effectiveUsdtKrw
      : null;
  const negCandidatesText = negCandidates
    .map((c) => `${c.label} ${fmtUsdt(c.usdt)}`)
    .join(" / ");

  // 섹션 A — 가격 위치: 각 평균/호가평단/제시가를 "현재가 대비 차이"로 표기.
  const avg90Usdt = sb?.avg90 ?? null;
  const positionRows: {
    key: string;
    label: string;
    value: number;
    tip: string;
  }[] = [];
  if (avg7Usdt != null)
    positionRows.push({
      key: "a7",
      label: "7일평균",
      value: avg7Usdt,
      tip: "최근 7일 종가 단순평균",
    });
  if (avg30Usdt != null)
    positionRows.push({
      key: "a30",
      label: "30일평균",
      value: avg30Usdt,
      tip: "최근 30일 종가 단순평균",
    });
  if (avg90Usdt != null)
    positionRows.push({
      key: "a90",
      label: "90일평균",
      value: avg90Usdt,
      tip: "최근 90일 종가 단순평균",
    });
  if (vwapUsdt != null)
    positionRows.push({
      key: "vwap",
      label: "호가 평단가",
      value: vwapUsdt,
      tip: "입력 수량만큼 호가를 긁었을 때의 가중평균 단가(호가 평단가)",
    });
  if (customerPriceUsdt != null)
    positionRows.push({
      key: "cust",
      label: "제시가(추천)",
      value: customerPriceUsdt,
      tip:
        priceTab === "current"
          ? "손님에게 제시하는 가격(현재가 기준)"
          : "손님에게 제시하는 가격(호가 평단가 기준)",
    });

  // 섹션 C — 매물대 분포(전체 이력). 고가→저가(위→아래)로 표시.
  const profile = sb?.volumeProfile ?? [];
  const profileMaxPct = profile.reduce(
    (m, b) => (b.volumePct > m ? b.volumePct : m),
    0,
  );
  const profileRowsDesc = profile
    .map((b, i) => ({ b, i }))
    .slice()
    .reverse();

  const buildCopyText = useCallback((): string => {
    if (!sig) return "";
    let text = sig.analysisText;

    const vwapStr =
      data?.vwap != null
        ? `${fmtUsdt(data.vwap)} USDT${
            data.vwapKrw != null ? ` (${fmtKrw(data.vwapKrw)}원/개)` : ""
          }`
        : "—";
    text = text.replace(
      "호가 평단가: (계산기 입력값 — 자리표시)",
      `호가 평단가: ${vwapStr}`,
    );

    const qtyLabel =
      effectiveQuantity != null
        ? effectiveQuantity.toLocaleString("ko-KR")
        : "—";
    const dirStr = isBuy
      ? `수량 ${qtyLabel}개 / 손님이 우리에게서 매수 (우리=판매측, 손님 판매가 책정)`
      : `수량 ${qtyLabel}개 / 손님이 우리에게 매도 (우리=매입측, 손님 매입가 책정)`;
    const basisText =
      priceTab === "current"
        ? `현재가 기준 (${currentSourceLabel ?? `마진 ${isBuy ? "+" : "−"}${fmtPct(activeMargin)}%`})`
        : `호가 평단가 기준 마진 ${isBuy ? "+" : "−"}${fmtPct(activeMargin)}%`;
    const customerLine =
      customerPriceUsdt != null
        ? `\n- 손님가: ${fmtUsdt(customerPriceUsdt)} USDT${
            customerPriceKrw != null
              ? ` (${fmtKrw(customerPriceKrw)}원/개)`
              : ""
          } · ${basisText}`
        : "";
    const profitLine =
      profitUsdt != null
        ? `\n- 예상 차익(실제 마진·호가 평단가 기준): ${fmtUsdt(profitUsdt)} USDT${
            profitKrw != null ? ` (${fmtKrw(profitKrw)}원)` : ""
          }${effMarginPct != null ? ` · ${fmtPctSigned(effMarginPct)}` : ""}`
        : "";
    const profitCurLine =
      profitCurUsdt != null
        ? `\n- 현재가 대비(시장가 기준): ${fmtUsdt(profitCurUsdt)} USDT${
            profitCurKrw != null ? ` (${fmtKrw(profitCurKrw)}원)` : ""
          }${curVsMarketPct != null ? ` · ${fmtPctSigned(curVsMarketPct)}` : ""}`
        : "";
    text = text.replace(
      "거래 수량/방향: (계산기 입력값 — 자리표시)",
      `거래 수량/방향: ${dirStr}${customerLine}${profitLine}${profitCurLine}`,
    );

    return text;
  }, [
    sig,
    data?.vwap,
    data?.vwapKrw,
    effectiveQuantity,
    isBuy,
    priceTab,
    activeMargin,
    currentSourceLabel,
    customerPriceUsdt,
    customerPriceKrw,
    effMarginPct,
    profitUsdt,
    profitKrw,
    profitCurUsdt,
    profitCurKrw,
    curVsMarketPct,
  ]);

  const handleCopy = useCallback(async () => {
    const text = buildCopyText();
    if (!text) return;
    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    try {
      await navigator.clipboard.writeText(text);
      markCopied();
      return;
    } catch {
      /* fallback */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      markCopied();
    } catch {
      alert("복사에 실패했습니다. 직접 선택해 복사해주세요.");
    }
  }, [buildCopyText]);

  const handleRefresh = useCallback(() => {
    fetchCalc();
    fetchSignals();
  }, [fetchCalc, fetchSignals]);

  return (
    <Page>
      <TopHint>
        시장 <strong>안정(초록)</strong>이면 제시가 그대로 안내.{" "}
        <strong>주의(노랑·빨강)</strong>면 아래 섹션을 확인하세요.
      </TopHint>

      {error ? <ErrorBox>{error}</ErrorBox> : null}

      {/* ── ① 응대 입력 ── */}
      <Card>
        <SectionTitle>① 응대 입력</SectionTitle>

        <Row>
          <Label>방향</Label>
          <Segment>
            <SegmentButton
              type="button"
              $tone="buy"
              $active={direction === "buy"}
              onClick={() => setDirection("buy")}
            >
              구매자
            </SegmentButton>
            <SegmentButton
              type="button"
              $tone="sell"
              $active={direction === "sell"}
              onClick={() => setDirection("sell")}
            >
              판매자
            </SegmentButton>
          </Segment>
          <span style={{ fontSize: 13, color: "#6b7280" }}>
            {direction === "buy"
              ? "손님이 우리에게서 매수 (우리가 판매)"
              : "손님이 우리에게 매도 (우리가 매입)"}
          </span>
        </Row>

        <Row>
          <Label>입력</Label>
          <Chip
            type="button"
            $active={inputMode === "qty"}
            onClick={() => setInputMode("qty")}
          >
            수량(개)
          </Chip>
          <Chip
            type="button"
            $active={inputMode === "krw"}
            onClick={() => setInputMode("krw")}
          >
            원화(₩)
          </Chip>
        </Row>

        <Row>
          <Label htmlFor={inputMode === "qty" ? "qty" : "krw"}>
            {inputMode === "qty" ? "수량(개)" : "원화(₩)"}
          </Label>
          {inputMode === "qty" ? (
            <Input
              id="qty"
              type="text"
              inputMode="numeric"
              placeholder={String(DEFAULT_QTY)}
              value={quantityInput}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "" || /^\d+$/.test(raw)) {
                  setQuantityInput(raw);
                }
              }}
              onFocus={selectAllOnFocus}
              onBlur={() => {
                if (quantityInput.trim() === "") {
                  setQuantityInput(String(DEFAULT_QTY));
                }
              }}
            />
          ) : (
            <Input
              id="krw"
              type="text"
              inputMode="numeric"
              placeholder="예: 3000000"
              value={krwInput}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (raw === "" || /^\d+$/.test(raw)) {
                  setKrwInput(raw);
                }
              }}
              onFocus={selectAllOnFocus}
              style={{ width: 160 }}
            />
          )}
          <RefreshButton
            type="button"
            onClick={handleRefresh}
            disabled={loading || signalsLoading}
          >
            {loading || signalsLoading ? "조회 중..." : "새로고침"}
          </RefreshButton>
        </Row>

        {inputHint ? (
          <Meta style={{ color: "#b45309", marginTop: 0 }}>{inputHint}</Meta>
        ) : null}

        {inputMode === "krw" &&
        parsedKrwInput != null &&
        effectiveQuantity != null &&
        bmbKrwPerUnit != null &&
        effectiveUsdtKrw != null ? (
          <Meta style={{ marginTop: inputHint ? 0 : undefined }}>
            입력 {fmtKrwBrief(parsedKrwInput)} ≈ 약{" "}
            {effectiveQuantity.toLocaleString("ko-KR")}개 (현재가 기준 어림)
            <br />
            {fmtKrw(parsedKrwInput)}원 = 약{" "}
            {fmtUsdt(parsedKrwInput / effectiveUsdtKrw)} USDT (환율{" "}
            {fmtKrw(effectiveUsdtKrw)} 기준)
            <br />
            <span style={{ color: "#9ca3af" }}>
              반올림 정수로 계산하므로 실제 총액은 입력 원화와 다를 수
              있습니다.
            </span>
          </Meta>
        ) : null}

        <Row>
          <Label htmlFor="usdt">USDT환율</Label>
          <Input
            id="usdt"
            type="text"
            placeholder={
              effectiveUsdtKrw != null
                ? String(Math.round(effectiveUsdtKrw))
                : "자동"
            }
            value={usdtKrwOverride}
            onChange={(e) => setUsdtKrwOverride(e.target.value)}
            style={{ width: 140 }}
          />
          {effectiveUsdtKrw != null ? (
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              자동: {fmtKrw(effectiveUsdtKrw)}원
            </span>
          ) : null}
        </Row>

        {data ? (
          <Meta>
            갱신: {new Date(data.asOf).toLocaleString("ko-KR")} · 소스:{" "}
            {data.source === "orderbook"
              ? `LBANK ${isBuy ? "매도" : "매수"}호가`
              : "티커(폴백)"}
          </Meta>
        ) : null}
      </Card>

      {/* ── ② 단가 산정 ── */}
      <Card>
        <SectionTitle>
          ② 단가 산정
          <SourceLink href={SOURCE_LINKS.bmb} title="LBANK BMB/USDT" />
        </SectionTitle>

        {lastPriceUsdt != null ? (
          <TickerWrap>
            <BmbUsdtTicker
              usdtPrice={lastPriceUsdt}
              krw={
                effectiveUsdtKrw != null
                  ? lastPriceUsdt * effectiveUsdtKrw
                  : null
              }
              usdtKrw={effectiveUsdtKrw}
            />
            <StatusBadge $tone={statusTone}>
              <StatusDot $tone={statusTone} />
              {BADGE_LABEL[statusTone]}
            </StatusBadge>
          </TickerWrap>
        ) : (
          <QuoteLine>
            <QuoteItem>
              현재가 <strong>—</strong>
            </QuoteItem>
            <StatusBadge $tone={statusTone}>
              <StatusDot $tone={statusTone} />
              {BADGE_LABEL[statusTone]}
            </StatusBadge>
          </QuoteLine>
        )}
        <StatusReasonLine>
          {sig && sig.reasons.length > 0
            ? sig.reasons[0]
            : signalsLoading
              ? "시장 지표 불러오는 중…"
              : signalsError
                ? "시장 지표 조회 실패 · 계산기는 정상 동작합니다."
                : ""}
        </StatusReasonLine>

        <VwapHero>
          <VwapHeroLabel>
            호가 평단가 (참고 기준)
            <InfoIcon title="입력 수량만큼 LBANK 호가를 실제로 긁었을 때의 가중평균 단가(우리 실제 매입/매도 원가). 최종 손님가가 아니라 산정 기준값.">
              i
            </InfoIcon>
          </VwapHeroLabel>
          <VwapHeroValue>
            {vwapKrw != null ? `${fmtKrw(vwapKrw)}원` : "—"}
            {vwapUsdt != null ? ` · ${fmtUsdt(vwapUsdt)} USDT/개` : ""}
          </VwapHeroValue>
          {vwapVsCurUsdt != null ? (
            <VwapHeroSub>
              현재가 대비 {fmtUsdtSigned(vwapVsCurUsdt)} USDT
            </VwapHeroSub>
          ) : null}
        </VwapHero>

        <Tabs>
          <TabButton
            type="button"
            $active={priceTab === "current"}
            onClick={() => setPriceTab("current")}
          >
            현재가 기준
          </TabButton>
          <TabButton
            type="button"
            $active={priceTab === "vwap"}
            onClick={() => setPriceTab("vwap")}
          >
            평단가 기준
          </TabButton>
        </Tabs>

        {priceTab === "current" ? (
          <>
            <TabDesc>
              판매 신청 손님 대상 — LBANK 호가가 우리 매수가가 아니므로 현재가
              기준으로 산정.
            </TabDesc>
            <VwapInfoLine>
              호가 평단가{" "}
              <strong>
                {vwapUsdt != null ? `${fmtUsdt(vwapUsdt)} USDT` : "—"}
              </strong>
              {vwapKrw != null ? <> ({fmtKrw(vwapKrw)}원/개)</> : null}
              {vwapGapPct != null ? (
                <> · 현재가 대비 {fmtPctSigned(vwapGapPct)}</>
              ) : null}
            </VwapInfoLine>
            <Row>
              <Label>마진%</Label>
              {MARGIN_CHIPS.map((m) => (
                <Chip
                  key={m}
                  type="button"
                  $active={customCur === "" && marginCur === m}
                  onClick={() => {
                    setMarginCur(m);
                    setCustomCur("");
                  }}
                >
                  {isBuy ? "+" : "−"}
                  {m}%
                </Chip>
              ))}
              <Input
                type="number"
                min={MIN_MARGIN_PCT}
                step={0.1}
                placeholder={`직접 (최소 ${MIN_MARGIN_PCT}%)`}
                value={customCur}
                onChange={(e) => setCustomCur(e.target.value)}
                onBlur={() => {
                  const v = Number(customCur);
                  if (
                    customCur.trim() !== "" &&
                    Number.isFinite(v) &&
                    v < MIN_MARGIN_PCT
                  )
                    setCustomCur(String(MIN_MARGIN_PCT));
                }}
                style={{ width: 130 }}
              />
            </Row>
          </>
        ) : (
          <>
            <TabDesc>
              LBANK 호가를 실제 긁어 매입할 때 — 호가 평단가가 실제 원가.
            </TabDesc>
            <VwapInfoLine>
              호가 평단가{" "}
              <strong>
                {vwapUsdt != null ? `${fmtUsdt(vwapUsdt)} USDT` : "—"}
              </strong>
              {vwapKrw != null ? <> ({fmtKrw(vwapKrw)}원/개)</> : null}
              {vwapVsCurUsdt != null ? (
                <> · 현재가 대비 {fmtUsdtSigned(vwapVsCurUsdt)} USDT</>
              ) : null}
            </VwapInfoLine>
            <Row>
              <Label>마진%</Label>
              {MARGIN_CHIPS.map((m) => (
                <Chip
                  key={m}
                  type="button"
                  $active={customVwap === "" && marginVwap === m}
                  onClick={() => {
                    setMarginVwap(m);
                    setCustomVwap("");
                  }}
                >
                  {isBuy ? "+" : "−"}
                  {m}%
                </Chip>
              ))}
              <Input
                type="number"
                min={MIN_MARGIN_PCT}
                step={0.1}
                placeholder={`직접 (최소 ${MIN_MARGIN_PCT}%)`}
                value={customVwap}
                onChange={(e) => setCustomVwap(e.target.value)}
                onBlur={() => {
                  const v = Number(customVwap);
                  if (
                    customVwap.trim() !== "" &&
                    Number.isFinite(v) &&
                    v < MIN_MARGIN_PCT
                  )
                    setCustomVwap(String(MIN_MARGIN_PCT));
                }}
                style={{ width: 130 }}
              />
            </Row>
          </>
        )}

        <FinalBox>
          <SummaryGrid>
            <SummaryCell>
              <SummaryLabel>
                {isBuy ? "손님 판매가 (최종 단가)" : "손님 매입가 (최종 단가)"}
                {hasLiquidityWarning ? " · 참고" : ""}
              </SummaryLabel>
              <SummaryValue $hero>
                {customerPriceKrw != null
                  ? `${fmtKrw(customerPriceKrw)}원`
                  : "—"}
              </SummaryValue>
              <SummaryUnit $hero>
                {customerPriceUsdt != null
                  ? `${fmtUsdt(customerPriceUsdt)} USDT/개`
                  : "—"}
                {priceTab === "current"
                  ? currentSourceLabel
                    ? ` · ${currentSourceLabel}`
                    : ""
                  : ` · 호가 평단 ${isBuy ? "+" : "−"}${fmtPct(activeMargin)}%`}
              </SummaryUnit>
            </SummaryCell>

            <SummaryCell>
              <SummaryLabel>
                총액 (
                {(effectiveQuantity ?? data?.quantity ?? 0).toLocaleString(
                  "ko-KR",
                )}
                개)
              </SummaryLabel>
              <SummaryValue>
                {customerTotalKrw != null
                  ? `${fmtKrw(customerTotalKrw)}원`
                  : "—"}
              </SummaryValue>
              <SummaryUnit>
                {customerTotalUsdt != null
                  ? `${fmtUsdt(customerTotalUsdt)} USDT`
                  : "—"}
              </SummaryUnit>
            </SummaryCell>

            <SummaryCell>
              <SummaryLabel>
                차익 (
                {priceTab === "current" ? "현재가 대비" : "호가 평단가 대비"})
              </SummaryLabel>
              <SummaryValue $accent>
                {profitTabKrw != null ? `${fmtKrw(profitTabKrw)}원` : "—"}
              </SummaryValue>
              <SummaryUnit>
                {profitTabUsdt != null ? `${fmtUsdt(profitTabUsdt)} USDT` : "—"}
              </SummaryUnit>
            </SummaryCell>
          </SummaryGrid>
        </FinalBox>

        {floorShortfall && floorKrw != null ? (
          <WarnBanner style={{ marginTop: "0.7rem", marginBottom: 0 }}>
            <WarnMark>⚠</WarnMark>
            <span>
              마진 하한 미달 (참고) — 차익{" "}
              {profitTabKrw != null ? `${fmtKrw(profitTabKrw)}원` : "—"} &lt;
              하한 {fmtKrw(floorKrw)}원 (10모당 3만원).
              {floorRefPriceKrw != null
                ? ` 하한 충족 참고 단가: ${fmtKrw(floorRefPriceKrw)}원/개.`
                : ""}
            </span>
          </WarnBanner>
        ) : null}

        {vwapGapPct != null && Math.abs(vwapGapPct) >= 0.05 ? (
          <SectionHint style={{ margin: "0.7rem 0 0" }}>
            호가 평단가가 현재가와 {fmtPctSigned(vwapGapPct)} 차이 — 호가가
            얇거나 주문 물량이 큼. 두 탭의 결과가 그만큼 달라집니다.
          </SectionHint>
        ) : null}

        {data && data.levels.length > 0 ? (
          <div style={{ marginTop: "1.1rem" }}>
            <SectionTitle as="h3" style={{ fontSize: "0.85rem" }}>
              호가 시각화 ({isBuy ? "매도호가" : "매수호가"})
            </SectionTitle>
            <SectionHint>
              싼 가격부터{" "}
              {(effectiveQuantity ?? data?.quantity ?? 0).toLocaleString(
                "ko-KR",
              )}
              개를 채울 때 각
              호가에서 체결되는 수량. 막대 채움 = 전체 주문 중 비중.
            </SectionHint>
            <Orderbook>
              {visibleLevels.map((lv, i) => {
                const qty = lv.filledQty;
                const filled = qty > 0;
                const partial = filled && qty < lv.size;
                const fillPct = levelFillBarPct(qty, data.quantity);
                const fillLabel = `${fmtLevelQty(qty)}개 체결`;
                return (
                  <LevelRow key={`${lv.price}-${i}`}>
                    <span style={{ color: "#374151", fontWeight: 500 }}>
                      {fmtUsdt(lv.price)}
                    </span>
                    <BarTrack>
                      {filled ? (
                        <BarFill
                          $pct={fillPct}
                          $partial={partial}
                          $tone={tone}
                          title={fillLabel}
                        />
                      ) : null}
                    </BarTrack>
                    <LevelMeta $active={filled} $tone={tone}>
                      {filled ? fillLabel : `${fmtLevelQty(lv.size)}`}
                    </LevelMeta>
                  </LevelRow>
                );
              })}
            </Orderbook>
            {hiddenCount > 0 ? (
              <CollapseRow type="button" onClick={() => setExpanded((v) => !v)}>
                {expanded
                  ? "접기"
                  : `이하 ${hiddenCount.toLocaleString("ko-KR")}개 호가 생략 · 전체 보기`}
              </CollapseRow>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* ── 경고 / 협상 기준가 (해당 시) ── */}
      {data && (hasLiquidityWarning || liquidityLevel != null) ? (
        <Card>
          {liquidityLevel === "block" ? (
            <WarnBanner $severe>
              <WarnMark>⚠</WarnMark>
              <span>
                호가만으로 체결 불가. 장외/분할 매입 필요.
                {orderVolPct != null
                  ? ` (주문이 ${volBasisLabel}의 ${fmtPct(orderVolPct)}%)`
                  : ""}
              </span>
            </WarnBanner>
          ) : liquidityLevel === "tight" ? (
            <WarnBanner>
              <WarnMark>⚠</WarnMark>
              <span>
                이 물량은 하루 거래량의{" "}
                {orderVolPct != null ? `${fmtPct(orderVolPct)}%` : "—"}. 호가
                즉시 체결 어려움.
              </span>
            </WarnBanner>
          ) : null}

          {vwapGapExceeded ? (
            <WarnBanner>
              <WarnMark>⚠</WarnMark>
              <span>
                호가를 끝까지 소진해 비현실적 단가(현재가 대비{" "}
                {fmtPctSigned(vwapGapPct)}). 실거래 불가 — 장외 협상 권장.
              </span>
            </WarnBanner>
          ) : null}

          {hasLiquidityWarning && negPriceUsdt != null ? (
            <NegotiationCard>
              <NegotiationLabel>
                장외 협상 기준가 ·{" "}
                {isBuy
                  ? "구매자(우리=판매측, 높을수록 유리)"
                  : "판매자(우리=매입측, 낮을수록 유리)"}
              </NegotiationLabel>
              <NegotiationValue>
                {fmtUsdt(negPriceUsdt)} USDT
                {negPriceKrw != null ? ` (${fmtKrw(negPriceKrw)}원)` : ""} 기준
                ± 협상
              </NegotiationValue>
              <NegotiationSub>
                {negBasis ? `${negBasis.label} 채택` : ""}
                {negCandidatesText ? ` · 후보 ${negCandidatesText}` : ""}. 위
                제시가는 호가 전량 소진을 가정한 참고치입니다.
              </NegotiationSub>
            </NegotiationCard>
          ) : null}
        </Card>
      ) : null}

      {/* ── 가격 위치 (BMB 평균 · 현재가 대비 차이) ── */}
      {data && lastPriceUsdt != null && positionRows.length > 0 ? (
        <Card>
          <SectionTitle>
            가격 위치 (현재가 대비)
            <InfoIcon title="7/30/90일 평균·호가 평단가·제시가가 현재가보다 높은지/낮은지 차이로 확인. 화살표·색은 방향 표시일 뿐 판단이 아님.">
              i
            </InfoIcon>
            <SourceLink href={SOURCE_LINKS.bmb} title="LBANK BMB/USDT" />
          </SectionTitle>

          <PositionList>
            <PositionRow $head>
              <PositionLabel>현재가 (기준)</PositionLabel>
              <PositionVal>{fmtUsdt(lastPriceUsdt)} USDT</PositionVal>
              <PositionDiff $color="#6b7280">—</PositionDiff>
            </PositionRow>
            {positionRows.map((r) => {
              const diff = r.value - lastPriceUsdt;
              const r2 = Math.round(diff * 100) / 100;
              const up = r2 > 0;
              const flat = r2 === 0;
              const color = flat ? "#6b7280" : up ? "#16a34a" : "#dc2626";
              return (
                <PositionRow key={r.key} title={r.tip}>
                  <PositionLabel>{r.label}</PositionLabel>
                  <PositionVal>{fmtUsdt(r.value)} USDT</PositionVal>
                  <PositionDiff $color={color}>
                    현재가 대비 {fmtUsdtSigned(diff)}
                    {!flat ? <TrendIcon up={up} /> : null}
                  </PositionDiff>
                </PositionRow>
              );
            })}
          </PositionList>
        </Card>
      ) : null}

      {/* ── ③ 시장 환경 (보조 지표, 색은 상태 구분용) ── */}
      <Card>
        <SectionTitle>
          ③ 시장 환경
          <InfoIcon title="시장 전체가 불안정할 때(BTC 급락·극공포 등) 거래 리스크를 가늠하는 보조 지표. 큰 금액 거래 전에 특히 참고.">
            i
          </InfoIcon>
        </SectionTitle>
        {!sig && signalsLoading ? (
          <StatusLoading>시장 지표 불러오는 중…</StatusLoading>
        ) : !sig && signalsError ? (
          <StatusLoading>
            시장 지표 조회 실패 · 계산기는 정상 동작합니다.
          </StatusLoading>
        ) : sig ? (
          <>
            <MetricGrid>
              <MetricBox title="Binance BTC/USDT 일봉 기준 N일 전 종가 대비 등락 / 200일 단순이평 대비 위치">
                <MetricLabel>
                  BTC
                  <SourceLink
                    href={SOURCE_LINKS.btc}
                    title="Binance BTC/USDT"
                  />
                </MetricLabel>
                <MetricValue>
                  7일{" "}
                  {sbtc?.chg7 != null ? (
                    <TrendValue $color={sbtc.chg7 >= 0 ? "#16a34a" : "#dc2626"}>
                      <TrendIcon up={sbtc.chg7 >= 0} />
                      {fmtPctSigned(sbtc.chg7)}
                    </TrendValue>
                  ) : (
                    "—"
                  )}{" "}
                  / 30일{" "}
                  {sbtc?.chg30 != null ? (
                    <TrendValue
                      $color={sbtc.chg30 >= 0 ? "#16a34a" : "#dc2626"}
                    >
                      <TrendIcon up={sbtc.chg30 >= 0} />
                      {fmtPctSigned(sbtc.chg30)}
                    </TrendValue>
                  ) : (
                    "—"
                  )}
                </MetricValue>
                <MetricSub>
                  {sbtc?.ma200Above != null
                    ? `200일선 ${sbtc.ma200Above ? "위" : "아래"}`
                    : "200일선 데이터 부족"}
                </MetricSub>
              </MetricBox>

              <MetricBox title="alternative.me 공포·탐욕 지수(0 극공포 ~ 100 극탐욕). 색은 Fear&Greed 공식 관습.">
                <MetricLabel>
                  공포·탐욕
                  <SourceLink
                    href={SOURCE_LINKS.fearGreed}
                    title="Fear & Greed Index"
                  />
                </MetricLabel>
                <MetricValue>
                  {fgValue != null ? (
                    <span style={{ color: fearGreedColor(fgValue) }}>
                      {fgValue}{" "}
                      <span style={{ fontSize: "0.8rem" }}>
                        ({fearGreedKo(senv?.fearGreed?.classification)})
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </MetricValue>
                {fgValue != null ? (
                  <FgTrack>
                    <FgMarker $left={fgValue} />
                  </FgTrack>
                ) : (
                  <MetricSub>—</MetricSub>
                )}
              </MetricBox>

              <MetricBox title="업비트 BTC 원화가를 공식 USD/KRW 환율로 환산해 바이낸스 달러가와 비교한 비율. +는 한국 시장 과열 관습색(빨강).">
                <MetricLabel>김치프리미엄(공식환율)</MetricLabel>
                <MetricValue>
                  <span
                    style={{
                      color: kimchiColor(senv?.traditionalKimchi ?? null),
                    }}
                  >
                    {fmtPctSigned(senv?.traditionalKimchi ?? null)}
                  </span>
                </MetricValue>
                <MetricSub>
                  {senv?.fxUsdKrw != null
                    ? `환율 ${fmtKrw(senv.fxUsdKrw)}원`
                    : "환율 —"}
                  {senv?.kimchiPremium != null
                    ? ` · USDT기준 ${fmtPctSigned(senv.kimchiPremium)}`
                    : ""}
                </MetricSub>
              </MetricBox>
            </MetricGrid>

            {sig.partial ? (
              <PartialNote>
                (일부 지표 조회 실패
                {sig.failed.length > 0 ? `: ${sig.failed.join(", ")}` : ""})
              </PartialNote>
            ) : null}
          </>
        ) : (
          <StatusLoading>시장 지표가 아직 없습니다.</StatusLoading>
        )}
      </Card>

      {/* ── ④ 매물대 (전체 이력, 펼치기) ── */}
      {sb && profile.length > 0 ? (
        <Card>
          <SectionTitle>
            <ToggleRow type="button" onClick={() => setProfileOpen((v) => !v)}>
              ④ 매물대 {profileOpen ? "접기 ▴" : "자세히 ▾"}
            </ToggleRow>
            <InfoIcon title="현재가가 과거 거래 몰린 구간인지 확인 — 대량·협상가 산정 시 참고.">
              i
            </InfoIcon>
          </SectionTitle>

          {profileOpen ? (
            <>
              <ProfileMeta title="전체 N일 일봉의 가격대별 거래량(코인 수) 비중">
                전체 {sb.profileDays}일
                {sb.profileFrom && sb.profileTo
                  ? ` (${sb.profileFrom} ~ ${sb.profileTo})`
                  : ""}{" "}
                기준 · 가격대별 거래량 비중
                {volPrevVsAvgPct != null
                  ? ` · 전일 거래량 7일평균 대비 ${fmtPct(volPrevVsAvgPct)}%`
                  : ""}
              </ProfileMeta>

              {profileRowsDesc.map(({ b, i }) => {
                const isCur = sb.currentBucketIndex === i;
                const barPct =
                  profileMaxPct > 0 ? (b.volumePct / profileMaxPct) * 100 : 0;
                return (
                  <ProfileRow key={`${b.lowPrice}-${i}`} $current={isCur}>
                    <ProfilePriceCell>
                      {fmtUsdt(b.lowPrice)}~{fmtUsdt(b.highPrice)}
                      {isCur ? <CurrentTag>현재가</CurrentTag> : null}
                    </ProfilePriceCell>
                    <ProfileBarTrack>
                      <ProfileBarFill $pct={barPct} $current={isCur} />
                    </ProfileBarTrack>
                    <ProfilePct>{fmtPct(b.volumePct)}%</ProfilePct>
                  </ProfileRow>
                );
              })}
            </>
          ) : (
            <ProfileMeta>
              전체 {sb.profileDays}일
              {sb.profileFrom && sb.profileTo
                ? ` (${sb.profileFrom} ~ ${sb.profileTo})`
                : ""}{" "}
              기준 · 펼쳐서 가격대별 분포 보기
            </ProfileMeta>
          )}
        </Card>
      ) : null}

      {/* ── ⑤ 분석 요청 복사 ── */}
      <Card>
        <SectionTitle>⑤ 분석 요청 복사</SectionTitle>
        <Row>
          <CopyButton
            type="button"
            $copied={copied}
            onClick={handleCopy}
            disabled={!sig}
          >
            {copied ? "복사됨 ✓" : "분석 요청 복사"}
          </CopyButton>
          <CopyHint>
            지표만으로 판단이 어려울 때, 전체 데이터를 복사해 AI(클로드)에
            붙여넣어 분석받으세요.
          </CopyHint>
        </Row>
      </Card>
    </Page>
  );
}
