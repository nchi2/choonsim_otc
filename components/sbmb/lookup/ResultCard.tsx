"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  IconBookOpen,
  IconCircleCheck,
  IconCopy,
  IconExternalLink,
  IconInfo,
  IconMessageCircle,
  IconRotateCcw,
} from "@/components/sbmb/shared/SbmbIcons";
import { SBMB_KAKAO_INQUIRY_URL } from "@/lib/sbmb/constants";
import { getStatusStyle } from "@/lib/sbmb/statusStyles";
import { T } from "@/lib/sbmb/tokens";
import { walletDedupeKey } from "@/lib/sbmb/walletUtils";
import type {
  SbmbRoadmapItem,
  SbmbVerifyEntry,
  SbmbVerifyOk,
  SbmbVerifyWallet,
  SbmbVerifyWalletTokens,
} from "@/types/sbmb";

const AIRDROP_DOT = "#8FD8C7";
const AIRDROP_ROW_BG = "#F8FFFE";
const AIRDROP_ROW_BORDER = "#8FD8C7";
const SERVICE_DOT = "#E5E7EB";
const SERVICE_ROW_BG = "#F9FAFB";
const SERVICE_LEFT_BORDER = "#E5E7EB";

const SECTION_NEW_TEXT = "#085041";
const SECTION_CONVERT_TEXT = "#3C3489";
const SECTION_CONVERT_DOT = "#3C3489";

const TOKEN_KEYS_FULL = ["LDT", "PRR", "SBMB"] as const;
const TOKEN_KEYS_SERVICE = ["LDT", "PRR"] as const;

const DESIGN_BADGE_STYLES: Record<
  string,
  { background: string; color: string }
> = {
  초록고래: { background: "#E1F5EE", color: "#085041" },
  "모비기와 모랑이": { background: "#EEF4F9", color: "#1D6FA4" },
  봄냥이: { background: "#FBEAF0", color: "#993556" },
  블루캣: { background: "#E6F1FB", color: "#185FA5" },
  토성: { background: "#F1EFE8", color: "#5F5E5A" },
};

function isTokenEmpty(v: number | null | undefined): boolean {
  return (
    v === 0 ||
    v === null ||
    v === undefined ||
    (typeof v === "number" && Number.isNaN(v))
  );
}

function formatWalletTokenSummary(
  tokens: SbmbVerifyWalletTokens,
  includeSbmb: boolean,
): string {
  const keys = includeSbmb ? TOKEN_KEYS_FULL : TOKEN_KEYS_SERVICE;
  return keys
    .map((key) => {
      const v = tokens[key];
      const display = isTokenEmpty(v) ? "예정" : String(v);
      return `${key} ${display}`;
    })
    .join(" · ");
}

function designBadgeStyle(
  design: string | undefined,
): { background: string; color: string } | null {
  if (!design) return null;
  return DESIGN_BADGE_STYLES[design] ?? null;
}

/** 신규 참여 지갑 행 — 디자인 옆 고정 라벨 */
const NEW_ENTRY_UNIT_LABEL = "10 SBMB";
const NEW_ENTRY_UNIT_STYLE = { bg: "#E1F5EE", fg: "#085041" };

/** 고액권 전환 C열(단위) 텍스트별 배지 — 200/100/50모 순서로 판별 */
function convertUnitBadgeStyle(unit: string): { bg: string; fg: string } {
  const compact = unit.trim().replace(/\s+/g, "");
  if (/^200모/.test(compact)) {
    return { bg: "#171717", fg: "#fafafa" };
  }
  if (/^100모/.test(compact)) {
    return { bg: "#5c4033", fg: "#fdf8f3" };
  }
  if (/^50모/.test(compact)) {
    return { bg: "#6b7280", fg: "#f9fafb" };
  }
  return { bg: "#f3f4f6", fg: "#374151" };
}

/** API unit(200모 등) → 배지 문구 "200모 정액권" */
function formatConvertUnitForBadge(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) return "—";
  const t = String(raw).trim();
  if (t.includes("정액권")) return t;
  const c = t.replace(/\s+/g, "");
  const m = c.match(/^(50|100|200)모/);
  if (m) return `${m[1]}모 정액권`;
  return t;
}

/** 0x + 앞 16진 3자 … 끝 3자 (예: 0x12a…3dv). 겹치면 전체 그대로 */
function formatAddressShort(addr: string): string {
  const s = addr.trim();
  if (!s.startsWith("0x")) return s;
  const headLen = 2 + 3;
  const tailLen = 3;
  if (s.length <= headLen + tailLen) return s;
  const head = s.slice(0, headLen);
  const tail = s.slice(-tailLen);
  if (head.length + tail.length >= s.length) return s;
  return `${head}...${tail}`;
}

const mobile = "@media (max-width: 767px)";

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const EntrySection = styled.div<{ $convert: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  ${(p) =>
    p.$convert &&
    `
    padding: 4px;
    border-radius: 12px;
    border: 1px solid ${T.convertDot};
  `}
`;

const ResultHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding-bottom: 18px;
  border-bottom: 1px solid #eef2f7;

  ${mobile} {
    gap: 12px;
    padding-bottom: 16px;
  }
`;

const NameLine = styled.p`
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: ${T.textPrimary};

  ${mobile} {
    font-size: 17px;
  }
`;

const ResultTag = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Dot8 = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`;

const ResultTagText = styled.span`
  font-weight: 600;
  font-size: 12px;
  color: ${T.textSecondary};
  letter-spacing: 0.01em;
`;

const GroupSectionHeader = styled.div<{ $variant: "new" | "convert" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  width: 100%;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: ${(p) =>
    p.$variant === "new" ? SECTION_NEW_TEXT : SECTION_CONVERT_TEXT};
`;

const Block = styled.div`
  border: 1px solid ${T.border};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: ${T.white};
  box-sizing: border-box;
  overflow: hidden;
`;

const BlockTitle = styled.h3`
  margin: 0;
  font-weight: 700;
  font-size: 15px;
  color: ${T.textPrimary};
`;

const BlockIntroText = styled.p`
  margin: 0;
  font-weight: 400;
  font-size: 12px;
  color: ${T.textSecondary};
  line-height: 1.5;
`;

const KakaoInquiryBtn = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${T.kakaoYellow};
  border: 1px solid ${T.kakaoBorder};
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  color: ${T.kakaoText};
  text-decoration: none;
  box-sizing: border-box;
  width: 100%;
`;

const KakaoBottomWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const CompactRow = styled.div<{ $airdrop: boolean }>`
  min-height: 38px;
  box-sizing: border-box;
  padding: 8px 10px 8px 10px;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  background: ${(p) => (p.$airdrop ? AIRDROP_ROW_BG : SERVICE_ROW_BG)};
  ${(p) =>
    p.$airdrop
      ? `
    border: 1px solid ${AIRDROP_ROW_BORDER};
    border-left-width: 3px;
  `
      : `
    border-left: 3px solid ${SERVICE_LEFT_BORDER};
  `}

  ${mobile} {
    flex-wrap: wrap;
    row-gap: 6px;
    align-items: flex-start;
    min-height: auto;
    padding-top: 8px;
    padding-bottom: 8px;
  }
`;

const RowDot = styled.span<{ $airdrop: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(p) => (p.$airdrop ? AIRDROP_DOT : SERVICE_DOT)};
`;

const RowLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  flex-shrink: 1;
  flex-wrap: wrap;
  row-gap: 6px;

  ${mobile} {
    width: 100%;
    flex-basis: 100%;
  }
`;

/** 디자인 배지 + No를 한 줄·한 블록으로 묶어 동일 No·다른 디자인 구분 */
const WalletIdentityStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
`;

const WalletCaption = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: ${T.textPrimary};
  line-height: 1.35;
`;

const DesignBadge = styled.span<{ $bg: string; $fg: string }>`
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 9999px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
  flex-shrink: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 신규 10 SBMB / 고액권 C열 단위 */
const EntryUnitTag = styled.span<{ $bg: string; $fg: string }>`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 9999px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
  flex-shrink: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  flex: 1;
  min-width: 0;
  align-self: center;

  ${mobile} {
    flex-basis: 100%;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    flex-wrap: nowrap;
    gap: 20px;
  }
`;

const RowTokens = styled.span`
  font-weight: 500;
  font-size: 11px;
  color: ${T.textMuted};
  text-align: right;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${mobile} {
    text-align: left;
    white-space: normal;
    font-size: 10px;
    line-height: 1.45;
    word-break: keep-all;
    flex: 1 1 0;
    min-width: 0;
    padding-right: 4px;
  }
`;

const AddrCopyWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  ${mobile} {
    flex-shrink: 0;
    margin-left: auto;
  }
`;

const AddrShort = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${T.textMuted};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  max-width: 7.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${mobile} {
    font-size: 10px;
    max-width: 6.5rem;
  }
`;

const CopyIconBtn = styled.button`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${T.textMuted};

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: ${T.textPrimary};
  }

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }

  ${mobile} {
    flex-shrink: 0;
  }
`;

const WalletStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ExpandServiceBtn = styled.button`
  box-sizing: border-box;
  width: 100%;
  margin-top: 4px;
  border: 1px solid ${T.border};
  background: ${T.white};
  border-radius: 8px;
  height: 38px;
  font-weight: 600;
  font-size: 13px;
  color: ${T.textMuted};
  cursor: pointer;
`;

const ScannerHint = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.45;
`;

const ScannerHintLink = styled(Link)`
  font-weight: 600;
  color: #6b7280;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${T.textPrimary};
  }
`;

const StatusBadge = styled.span<{ $dot: string; $bg: string; $text: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  padding: 4px 10px;
  font-weight: 600;
  font-size: 12px;
  color: ${(p) => p.$text};
  background: ${(p) => p.$bg};
  &::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${(p) => p.$dot};
  }
`;

const MemoBox = styled.div`
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 10px 14px;
`;

const MemoHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 12px;
  color: ${T.kakaoText};
  margin-bottom: 6px;
`;

const MemoBody = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: ${T.kakaoText};
`;

const RoadmapRow = styled.div<{ $last?: boolean }>`
  min-height: 42px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: ${(p) => (p.$last ? "none" : `1px solid ${T.borderLight}`)};
`;

const RoadmapLabel = styled.span`
  font-size: 13px;
  color: ${T.textMuted};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NoticeLinkBox = styled.div`
  background: ${T.noticeLinkBg};
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const NoticeLinkText = styled.span`
  font-size: 13px;
  color: ${T.textMuted};
`;

const NoticeBtn = styled.button`
  border: none;
  cursor: pointer;
  background: ${T.primary};
  color: ${T.white};
  border-radius: 7px;
  padding: 6px 12px;
  font-weight: 600;
  font-size: 12px;
`;

const GuideBox = styled.div`
  margin-top: 4px;
  background: ${T.guideBg};
  border: 1.5px solid ${AIRDROP_ROW_BORDER};
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GuideTop = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const GuideIconWrap = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: ${T.mintLight};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const GuideTitle = styled.div`
  font-weight: 700;
  font-size: 14px;
  color: ${T.mintDark};
`;

const GuideSub = styled.div`
  font-size: 13px;
  color: ${T.textMuted};
  margin-top: 2px;
`;

const GuideCta = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  border-radius: 8px;
  background: ${T.mint};
  color: ${T.mintDark};
  font-weight: 700;
  font-size: 13px;
  border: none;
  cursor: pointer;
`;

const ResetOutlineBtn = styled.button`
  box-sizing: border-box;
  width: 100%;
  height: 36px;
  margin-top: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: ${T.white};
  color: #6b7280;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    sans-serif;
  font-weight: 500;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const RoadmapMuted = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${T.textTertiary};
`;

function WalletCompactRow({
  wallet: w,
  entryType,
}: {
  wallet: SbmbVerifyWallet;
  entryType: "신규참여" | "고액권전환";
}) {
  const [copied, setCopied] = useState(false);
  const isAirdropRange = w.no <= 1000;
  const badge = designBadgeStyle(w.design);
  const tokenSummary = formatWalletTokenSummary(w.tokens, isAirdropRange);

  const entryUnit =
    entryType === "신규참여"
      ? {
          label: NEW_ENTRY_UNIT_LABEL,
          bg: NEW_ENTRY_UNIT_STYLE.bg,
          fg: NEW_ENTRY_UNIT_STYLE.fg,
        }
      : {
          label: formatConvertUnitForBadge(w.unit),
          ...convertUnitBadgeStyle(w.unit ?? ""),
        };

  const badgeBg = badge?.background ?? "#f3f4f6";
  const badgeFg = badge?.color ?? T.textSecondary;

  const handleCopy = async () => {
    const addr = w.address?.trim();
    if (!addr) return;
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <CompactRow $airdrop={isAirdropRange}>
      <RowLeft>
        <RowDot $airdrop={isAirdropRange} aria-hidden />
        {isAirdropRange ? (
          <EntryUnitTag $bg={entryUnit.bg} $fg={entryUnit.fg}>
            {entryUnit.label}
          </EntryUnitTag>
        ) : null}
        <WalletIdentityStack>
          {w.design ? (
            <DesignBadge $bg={badgeBg} $fg={badgeFg}>
              {w.design}
            </DesignBadge>
          ) : null}
          <WalletCaption>
            {w.design ? `${w.design.trim()} ${w.no}` : `No. ${w.no}`}
          </WalletCaption>
        </WalletIdentityStack>
      </RowLeft>
      <RowRight>
        <RowTokens title={tokenSummary}>{tokenSummary}</RowTokens>
        {w.address?.trim() ? (
          <AddrCopyWrap>
            <AddrShort title={w.address.trim()}>
              {formatAddressShort(w.address.trim())}
            </AddrShort>
            <CopyIconBtn
              type="button"
              onClick={handleCopy}
              title={copied ? "복사됨" : "공개 주소 복사"}
              aria-label={copied ? "복사 완료" : "공개 주소 복사"}
            >
              {copied ? (
                <IconCircleCheck size={18} color={T.mintDark} />
              ) : (
                <IconCopy size={18} color="currentColor" />
              )}
            </CopyIconBtn>
          </AddrCopyWrap>
        ) : null}
      </RowRight>
    </CompactRow>
  );
}

function CompactWalletList({
  wallets,
  listKey,
  entryType,
}: {
  wallets: SbmbVerifyWallet[];
  listKey: string;
  entryType: "신규참여" | "고액권전환";
}) {
  const [expanded, setExpanded] = useState(false);
  const airdropWallets = wallets.filter((w) => w.no <= 1000);
  const serviceWallets = wallets.filter((w) => w.no > 1000);

  const renderRow = (w: SbmbVerifyWallet) => (
    <WalletCompactRow
      key={`${listKey}-${walletDedupeKey(w.design, w.no)}`}
      wallet={w}
      entryType={entryType}
    />
  );

  return (
    <WalletStack>
      {airdropWallets.map(renderRow)}
      {serviceWallets.length > 0 && expanded
        ? serviceWallets.map(renderRow)
        : null}
      {serviceWallets.length > 0 ? (
        <ExpandServiceBtn
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded
            ? `서비스 지갑 접기 ▲`
            : `서비스 지갑 ${serviceWallets.length}개 더 보기 ▼`}
        </ExpandServiceBtn>
      ) : null}
    </WalletStack>
  );
}

function VerifyEntryBlock({
  entry,
  idx,
}: {
  entry: SbmbVerifyEntry;
  idx: number;
}) {
  const isConvert = entry.entryType === "고액권전환";
  return (
    <EntrySection $convert={isConvert}>
      <Block>
        <div>
          <BlockTitle>내 지갑 목록</BlockTitle>
        </div>
        <CompactWalletList
          wallets={entry.wallets}
          listKey={`${entry.entryType}-${idx}`}
          entryType={entry.entryType}
        />
        <ScannerHint>
          <IconExternalLink size={12} color="#6B7280" aria-hidden />
          <span>지갑 잔고를 직접 확인하려면 →</span>
          <ScannerHintLink href="/scanner">EVM Wallet Scanner</ScannerHintLink>
        </ScannerHint>
        {entry.memo ? (
          <MemoBox>
            <MemoHead>
              <IconInfo size={14} color="#d97706" />
              안내
            </MemoHead>
            <MemoBody>{entry.memo}</MemoBody>
          </MemoBox>
        ) : null}
      </Block>
    </EntrySection>
  );
}

type Props = {
  result: SbmbVerifyOk;
  onReset: () => void;
  /** 모달 안에서 섹션으로 스크롤하기 전에 모달만 닫을 때 (예: 공지·가이드 버튼) */
  onDismissModal?: () => void;
};

export default function ResultCard({
  result,
  onReset,
  onDismissModal,
}: Props) {
  const [roadmap, setRoadmap] = useState<SbmbRoadmapItem[]>([]);
  const [roadmapErr, setRoadmapErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sbmb/roadmap");
        const data = await res.json();
        if (!cancelled) {
          if (!res.ok || !Array.isArray(data.items)) {
            setRoadmapErr(true);
          } else {
            setRoadmap(data.items);
            setRoadmapErr(false);
          }
        }
      } catch {
        if (!cancelled) setRoadmapErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollNotice = () => {
    onDismissModal?.();
    requestAnimationFrame(() => {
      document
        .getElementById("notice")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const scrollGuide = () => {
    onDismissModal?.();
    requestAnimationFrame(() => {
      document
        .getElementById("guide")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const showGuide = result.entries.some((e) =>
    e.airdropStatus.includes("대기"),
  );

  const newEntries = result.entries.filter((e) => e.entryType === "신규참여");
  const convertEntries = result.entries.filter(
    (e) => e.entryType === "고액권전환",
  );

  return (
    <Root>
      <ResultHeader>
        <ResultTag>
          <Dot8 $color={T.mint} />
          <ResultTagText>신청 현황 조회 결과</ResultTagText>
        </ResultTag>
        <NameLine>{result.name}</NameLine>
      </ResultHeader>

      {newEntries.length > 0 ? (
        <>
          <GroupSectionHeader $variant="new">
            <Dot8 $color={AIRDROP_DOT} />
            신규 참여
          </GroupSectionHeader>
          {newEntries.map((entry, i) => (
            <VerifyEntryBlock key={`신규참여-${i}`} entry={entry} idx={i} />
          ))}
        </>
      ) : null}

      {convertEntries.length > 0 ? (
        <>
          <GroupSectionHeader $variant="convert">
            <Dot8 $color={SECTION_CONVERT_DOT} />
            고액권 전환
          </GroupSectionHeader>
          {convertEntries.map((entry, i) => (
            <VerifyEntryBlock
              key={`고액권전환-${i}`}
              entry={entry}
              idx={i + newEntries.length}
            />
          ))}
        </>
      ) : null}

      <Block>
        <div>
          <BlockTitle>SBMB 전체 진행 현황</BlockTitle>
          <BlockIntroText>프로젝트 단계별 진행 상황입니다.</BlockIntroText>
        </div>
        {roadmapErr ? (
          <RoadmapMuted>로드맵을 불러오지 못했습니다.</RoadmapMuted>
        ) : roadmap.length === 0 ? (
          <RoadmapMuted>등록된 로드맵 항목이 없습니다.</RoadmapMuted>
        ) : (
          roadmap.map((item, i) => {
            const style = getStatusStyle(item.status);
            const last = i === roadmap.length - 1;
            return (
              <RoadmapRow key={`${item.label}-${i}`} $last={last}>
                <RoadmapLabel>
                  <Dot8 $color={style.dot} />
                  {item.label}
                </RoadmapLabel>
                <StatusBadge $dot={style.dot} $bg={style.bg} $text={style.text}>
                  {item.status}
                </StatusBadge>
              </RoadmapRow>
            );
          })
        )}
        <NoticeLinkBox>
          <NoticeLinkText>공지 및 변경 사항을 확인하세요.</NoticeLinkText>
          <NoticeBtn type="button" onClick={scrollNotice}>
            공지 확인하기 →
          </NoticeBtn>
        </NoticeLinkBox>
      </Block>

      {showGuide ? (
        <GuideBox>
          <GuideTop>
            <GuideIconWrap>
              <IconBookOpen size={18} color={T.mintDark} />
            </GuideIconWrap>
            <div>
              <GuideTitle>에어드랍 받을 준비가 됐나요?</GuideTitle>
              <GuideSub>Trust Wallet 설치부터 차근차근 따라해보세요.</GuideSub>
            </div>
          </GuideTop>
          <GuideCta type="button" onClick={scrollGuide}>
            참여 가이드 보기 →
          </GuideCta>
        </GuideBox>
      ) : null}

      <ResetOutlineBtn type="button" onClick={onReset}>
        <IconRotateCcw size={14} color="#6B7280" />
        처음으로 돌아가기
      </ResetOutlineBtn>

      <KakaoBottomWrap>
        <BlockIntroText>현황이 맞지 않거나 문의사항이 있으시면</BlockIntroText>
        <KakaoInquiryBtn
          href={SBMB_KAKAO_INQUIRY_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconMessageCircle size={18} color={T.kakaoText} />
          춘심이 동생 카카오톡 문의하기
        </KakaoInquiryBtn>
      </KakaoBottomWrap>
    </Root>
  );
}
