"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import MonthCalendar, {
  defaultCalendarMaxDate,
} from "@/components/admin/MonthCalendar";
import {
  MIRACLE10_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  canAdminEditSchedule,
  formatAdminVisitTypeLabel,
  type Miracle10Status,
} from "@/lib/miracle10-status";
import {
  formatKstYmdLong,
  monthBoundsKst,
  todayKst,
} from "@/lib/kst";
import {
  MO_PER_PAPER_WALLET,
  PAPER_WALLET_UNIT_USDT,
  computeCustomerEstimate,
  paperWalletCountToPrepare,
  paperWalletPriceKrw,
} from "@/lib/otc-estimate";
import { isBusinessDayKst } from "@/lib/work-schedule";
import { WalletQrScanner } from "@/app/scanner/page/components/WalletQrScanner";
import { addressDedupKey } from "@/app/scanner/lib/utils";
import { CommentsSection } from "@/components/admin/CommentsSection";
import { useAdminPageHeader } from "@/components/admin/AdminPageHeaderContext";
import { adminColors } from "@/components/admin/ui";
import { ErrorState, Skeleton } from "@/components/admin/States";
import { invalidate } from "@/lib/admin-data";
import {
  DASHBOARD_KEY,
  INVENTORY_KEY,
  STATS_KEY,
} from "@/lib/admin-fetchers";

/** 10모 변경 액션 후 캐시 무효화 (invalidate 매핑 표 준수) */
function invalidateAfterMiracle10Change(opts?: { inventory?: boolean }) {
  invalidate("admin:list:miracle10");
  invalidate(STATS_KEY);
  invalidate(DASHBOARD_KEY);
  invalidate("admin:calendar");
  if (opts?.inventory) invalidate(INVENTORY_KEY);
}

const Page = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 1rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: ${adminColors.textMuted};
  text-decoration: none;
  &:hover {
    color: ${adminColors.text};
  }
`;

const Card = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${adminColors.textSub};
  margin: 0 0 0.75rem;
`;

const SectionSub = styled.p`
  font-size: 0.78rem;
  color: ${adminColors.textMuted};
  margin: 0 0 0.75rem;
  line-height: 1.45;
`;

const Field = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-top: 1px solid ${adminColors.borderFaint};
  font-size: 0.9rem;
  &:first-of-type {
    border-top: none;
  }

  /* 초소형 화면 — 라벨 위, 값 아래 */
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
`;

const Key = styled.span`
  color: ${adminColors.textMuted};
`;

const Val = styled.span`
  color: ${adminColors.text};
  font-weight: 500;
  word-break: break-all;
`;

const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${adminColors.white};
  background: ${(p) => p.$color};
`;

const StatusButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StatusButton = styled.button<{ $active: boolean; $color: string }>`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1.5px solid ${(p) => p.$color};
  background: ${(p) => (p.$active ? p.$color : adminColors.white)};
  color: ${(p) => (p.$active ? adminColors.white : p.$color)};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;


const DatePickerWrap = styled.div`
  position: relative;
  margin-bottom: 0.75rem;
`;

const DateSelectButton = styled.button<{ $hasValue: boolean }>`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  background: ${adminColors.white};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: ${(p) => (p.$hasValue ? adminColors.text : adminColors.textFaint)};
`;

const CalendarDropdown = styled.div`
  margin-top: 0.5rem;
`;

const CalendarHint = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: ${adminColors.textMuted};
  text-align: center;
`;

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }
`;

const SlotChip = styled.button<{ $active: boolean; $booked?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  min-height: 58px;
  padding: 0.75rem 0.5rem;
  border-radius: 10px;
  border: 1.5px solid
    ${(p) =>
      p.$active ? adminColors.primary : p.$booked ? adminColors.border : adminColors.borderInput};
  background: ${(p) =>
    p.$active ? adminColors.primary : p.$booked ? adminColors.bgSubtle : adminColors.white};
  color: ${(p) => (p.$active ? adminColors.white : adminColors.textSub)};
  cursor: ${(p) => (p.$booked ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.$booked ? 0.55 : 1)};
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
`;

const SlotChipTime = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
`;

const SlotChipMeta = styled.span<{ $active?: boolean; $emphasis?: boolean }>`
  font-size: 0.68rem;
  font-weight: ${(p) => (p.$emphasis ? 600 : 400)};
  color: ${(p) =>
    p.$active
      ? "rgba(255,255,255,0.85)"
      : p.$emphasis
        ? adminColors.dangerText
        : adminColors.textFaint};
`;

const SaveScheduleBtn = styled.button`
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: ${adminColors.primary};
  color: ${adminColors.white};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const ScheduleBtnRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ScheduleError = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: ${adminColors.danger};
`;

const OfficeSelect = styled.select`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  background: ${adminColors.white};
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
`;

/* ── 다음 액션 (상태별 주 버튼) ── */

const ActionCard = styled(Card)`
  border-color: ${adminColors.primaryBorder};
  background: ${adminColors.primarySofter};
`;

const NextActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
`;

const PrimaryActionBtn = styled.button`
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  border: none;
  background: ${adminColors.primary};
  color: ${adminColors.white};
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const TelLinkBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.1rem;
  border: 1.5px solid ${adminColors.primary};
  border-radius: 10px;
  background: ${adminColors.white};
  color: ${adminColors.primary};
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
`;

const ActionHint = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.78rem;
  color: ${adminColors.textMuted};
  line-height: 1.5;
`;

const ConfirmBox = styled.div`
  border: 1px solid ${adminColors.border};
  background: ${adminColors.white};
  border-radius: 10px;
  padding: 0.9rem 1rem;
`;

const CheckLabel = styled.label`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  font-size: 0.88rem;
  font-weight: 600;
  color: ${adminColors.text};
  line-height: 1.45;
  cursor: pointer;
  input {
    margin-top: 2px;
    flex-shrink: 0;
  }
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const GhostBtn = styled.button`
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: 1px solid ${adminColors.borderInput};
  background: ${adminColors.white};
  color: ${adminColors.textSub};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
`;

const CompleteWarnText = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${adminColors.danger};
`;

/* ── 접기 (상태 직접 변경 · 거래 기록 · 접수 정보) ── */

const CollapseCard = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  margin-bottom: 1.25rem;
  overflow: hidden;
`;

const CollapseHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.9rem 1.5rem;
  border: none;
  background: none;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${adminColors.textSub};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${adminColors.bgSubtle};
  }
`;

const CollapseBody = styled.div`
  padding: 0 1.5rem 1.25rem;
`;

/* 카드 안에서 쓰는 내장형 접기 (상태 직접 변경) */
const InlineCollapseHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 1rem;
  padding: 0.6rem 0 0;
  border: none;
  border-top: 1px dashed ${adminColors.border};
  width: 100%;
  background: none;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${adminColors.textFaint};
  cursor: pointer;
  text-align: left;

  &:hover {
    color: ${adminColors.textSub};
  }
`;

/* ── 연락 체크리스트 ── */

const ChecklistBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const ChecklistItem = styled.div<{ $done?: boolean }>`
  border: 1px solid
    ${(p) => (p.$done ? adminColors.successBorder : adminColors.border)};
  background: ${(p) => (p.$done ? adminColors.successSoft : adminColors.white)};
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
`;

const ChecklistMain = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: ${adminColors.text};
  cursor: pointer;

  input {
    margin-top: 3px;
    flex-shrink: 0;
    accent-color: ${adminColors.success};
  }
`;

const ChecklistSub = styled.div`
  margin: 0.45rem 0 0 1.6rem;
  font-size: 0.8rem;
  color: ${adminColors.textMuted};
  line-height: 1.55;
`;

const RequiredMark = styled.span`
  margin-left: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${adminColors.alertTextStrong};
`;

const OwnedInput = styled.input`
  width: 4rem;
  padding: 0.3rem 0.45rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 6px;
  font-size: 0.85rem;
  text-align: right;
`;

const CancelMiniBtn = styled.button`
  margin-left: 0.4rem;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  border: 1px solid ${adminColors.dangerBorder};
  background: ${adminColors.white};
  color: ${adminColors.danger};
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
`;

/* 3단 토글 — 필요/불필요/미확인(둘 다 해제) */
const TriRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
`;

const TriGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: ${adminColors.textSub};
`;

const TriBtn = styled.button<{ $active: boolean; $tone: "yes" | "no" }>`
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid
    ${(p) =>
      p.$active
        ? p.$tone === "yes"
          ? adminColors.success
          : adminColors.textMuted
        : adminColors.borderInput};
  background: ${(p) =>
    p.$active
      ? p.$tone === "yes"
        ? adminColors.successSoft
        : adminColors.bgHover
      : adminColors.white};
  color: ${(p) =>
    p.$active
      ? p.$tone === "yes"
        ? adminColors.success
        : adminColors.textSub
      : adminColors.textFaint};
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
`;

/* 작은 텍스트 링크 (우회 · 확정 없이 저장) */
const InlineTextLink = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  font-size: 0.75rem;
  color: ${adminColors.textFaint};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    color: ${adminColors.textSub};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const P2pOkBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: ${adminColors.successSoft};
  color: ${adminColors.success};
  font-size: 0.78rem;
  font-weight: 700;
`;

/* 사전 파악 요약 */
const PreCheckFaint = styled.span`
  color: ${adminColors.textFaint};
`;

const MiniEditBtn = styled.button`
  margin-left: 0.5rem;
  padding: 0.1rem 0.5rem;
  border-radius: 6px;
  border: 1px solid ${adminColors.borderInput};
  background: ${adminColors.white};
  color: ${adminColors.textMuted};
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
`;

const TestToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.9rem;
  padding-top: 0.6rem;
  border-top: 1px dashed ${adminColors.border};
  font-size: 0.78rem;
  font-weight: 600;
  color: ${adminColors.textMuted};
  cursor: pointer;

  input {
    margin: 0;
  }
`;

/* ── 거래 기록 (내장 계산기) ── */

const CalcBox = styled.div`
  border: 1px solid #e0e7ff;
  background: ${adminColors.primarySoft};
  border-radius: 10px;
  padding: 0.9rem 1rem;
  margin-bottom: 1rem;
`;

const CalcRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.18rem 0;
  font-size: 0.85rem;
  color: ${adminColors.textSub};
  strong {
    color: ${adminColors.text};
    text-align: right;
  }

  /* 좁은 폭 — 라벨 위 / 값 아래로 세로 전환 (라벨·값 뒤엉킴 방지) */
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.1rem;
    padding: 0.35rem 0;

    strong {
      text-align: left;
    }
  }
`;

/* 환율 입력 행 — 데스크탑 우측 정렬 입력, 모바일 전체 폭 */
const RateInput = styled.input`
  width: 7rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  font-size: 0.9rem;
  background: ${adminColors.white};
  text-align: right;

  @media (max-width: 480px) {
    width: 100%;
    text-align: left;
  }
`;

const CalcActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.6rem;

  @media (max-width: 480px) {
    button {
      flex: 1 1 40%;
    }
  }
`;

/* 일정 확정 후 다음 단계 안내 — 거래 기록 카드 상단 */
const NextStepNote = styled.p`
  margin: 0 0 0.85rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid ${adminColors.primaryBorder};
  border-radius: 8px;
  background: ${adminColors.primarySoft};
  color: ${adminColors.primaryHover};
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.5;
`;

const SmallBtn = styled.button`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid ${adminColors.primary};
  background: ${adminColors.white};
  color: ${adminColors.primary};
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SmallLinkBtn = styled(Link)`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid ${adminColors.primary};
  background: ${adminColors.white};
  color: ${adminColors.primary};
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
`;

const FloorNote = styled.span`
  display: inline-block;
  margin-left: 0.4rem;
  padding: 1px 8px;
  border-radius: 999px;
  background: ${adminColors.warnSoft};
  color: ${adminColors.warnText};
  font-size: 0.72rem;
  font-weight: 700;
`;

const RecordGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const RecordField = styled.div<{ $full?: boolean }>`
  ${(p) => (p.$full ? "grid-column: 1 / -1;" : "")}
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
  margin-bottom: 0.3rem;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  font-size: 0.9rem;
  background: ${adminColors.white};
  &:read-only {
    background: ${adminColors.bgSubtle};
    color: ${adminColors.textSub};
  }
`;

const DerivedValue = styled.div`
  padding: 0.55rem 0.7rem;
  border: 1px solid ${adminColors.border};
  border-radius: 8px;
  background: ${adminColors.bgSubtle};
  font-size: 0.9rem;
  font-weight: 600;
  color: ${adminColors.text};
  min-height: 2.35rem;
`;

const RecordFootRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
`;

const SaveMsg = styled.span<{ $error?: boolean }>`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${(p) => (p.$error ? adminColors.danger : adminColors.successStrong)};
`;

const ScanWrap = styled.div`
  margin-top: 0.6rem;
`;

/* ── 수령 지갑주소 목록 ── */

const AddressList = styled.ul`
  list-style: none;
  margin: 0 0 0.5rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const AddressRow = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid ${adminColors.border};
  border-radius: 8px;
  background: ${adminColors.bgSubtle};
`;

const AddressText = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: ${adminColors.text};
  word-break: break-all;
`;

/** 주소별 「우리 지갑」 체크 — 체크된 수만큼 완료 시 재고 불출. */
const OursCheck = styled.label<{ $checked: boolean }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$checked ? adminColors.successBorder : adminColors.border)};
  background: ${(p) => (p.$checked ? adminColors.successBg : adminColors.white)};
  color: ${(p) => (p.$checked ? adminColors.successDeep : adminColors.textFaint)};
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;

  input {
    margin: 0;
    accent-color: ${adminColors.success};
  }
`;

const AddrRemoveBtn = styled.button`
  flex-shrink: 0;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  border: 1px solid ${adminColors.dangerBorder};
  background: ${adminColors.white};
  color: ${adminColors.dangerText};
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
`;

const AddressAddRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  input {
    flex: 1;
    min-width: 0;
  }
`;

const MismatchNote = styled.p`
  margin: 0 0 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  background: ${adminColors.warnSoft};
  color: ${adminColors.warnText};
  font-size: 0.76rem;
  font-weight: 600;
`;

/** 수령 지갑 — isOurs=우리 종이지갑(재고 불출 대상). */
interface ReceiveWallet {
  address: string;
  isOurs: boolean;
}

/** 상세 응답에 병합된 코멘트 (CommentsSection 초기 데이터) */
interface DetailComment {
  id: number;
  createdAt: string;
  editedAt: string | null;
  authorId: number | null;
  authorName: string;
  body: string;
}

interface AvailableSlot {
  startTime: string;
  capacity: number;
  taken: number;
  remaining: number;
  available: boolean;
}

interface OfficeOption {
  id: number;
  name: string;
  isActive: boolean;
}

interface Detail {
  id: number;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: string | null;
  lastEditedByName: string | null;
  lastEditedAt: string | null;
  status: Miracle10Status;
  quantity: number;
  asset: string | null;
  settle: string;
  contactTimePref: string | null;
  visitType: string | null;
  visitDate: string | null;
  reservedStart: string | null;
  visitTimeSlot: string | null;
  officeId: number | null;
  needUsdt: string | null;
  needBmb: string | null;
  needFaceAuth: string | null;
  isSbmbMember: boolean;
  memo: string | null;
  agreePrivacy: boolean;
  // 거래 기록 — Decimal 필드는 JSON에서 string으로 온다.
  p2pExperienceConfirmed: boolean | null;
  dealQuantity: number | null;
  dealUnitPriceKrw: string | number | null;
  dealUnitPriceUsdt: string | number | null;
  dealCoinTotalKrw: string | number | null;
  paperWalletCount: number | null;
  paperWalletKrw: string | number | null;
  dealTotalKrw: string | number | null;
  receiveWallets: ReceiveWallet[];
  isTest: boolean;
  ownedPaperWalletCount: number | null;
  customer: {
    id: number;
    name: string;
    contact: string;
    verifiedAt: string | null;
    createdAt: string;
  };
}

export default function Miracle10DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [comments, setComments] = useState<DetailComment[]>([]);
  const [myAdminUserId, setMyAdminUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // 일정 확정 전 확인 단계 (P2P 판매 경험 체크)
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [p2pChecked, setP2pChecked] = useState(false);
  // 완료 시 거래 기록 미작성 경고 (경고만 — 진행은 허용)
  const [completeWarn, setCompleteWarn] = useState(false);
  // 상태 직접 변경 접기 (예외 처리용 — 기본 닫힘)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/miracle10/${id}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "불러오지 못했습니다.");
      }
      setData(json.order);
      setComments(json.comments ?? []);
      setMyAdminUserId(json.myAdminUserId ?? null);
      // 상세 열람 = 읽음 처리(서버) → 목록·셸 안읽음 배지·알림 벨 즉시 반영
      invalidate("admin:list:miracle10");
      invalidate(STATS_KEY);
      invalidate(DASHBOARD_KEY);
      invalidate("admin:unread");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  // 테스트 플래그 토글 — status를 함께 보내지 않는다 (배정/자동불출 경로 회피)
  const toggleTest = async (next: boolean) => {
    if (!data || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/miracle10/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTest: next }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "변경 실패");
      invalidateAfterMiracle10Change();
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 셸이 유일한 제목 소유자 — 배지 포함 제목을 헤더로 전달 (본문 h1 없음)
  const headerTitle = useMemo(
    () =>
      data ? (
        <>
          신청 #{data.id}
          <Badge $color={STATUS_COLORS[data.status]}>
            {STATUS_LABELS[data.status]}
          </Badge>
        </>
      ) : undefined,
    [data],
  );
  useAdminPageHeader(headerTitle);

  const changeStatus = async (
    status: Miracle10Status,
    extra?: Record<string, unknown>,
  ) => {
    if (!data || (data.status === status && !extra) || saving) return;

    // 완료 전환 — 거래 기록 미작성 경고 + 자동 불출 안내 후 확인 (저장된 기록 기준).
    const oursCount = (data.receiveWallets ?? []).filter(
      (w) => w.isOurs,
    ).length;
    if (status === "COMPLETED" && data.status !== "COMPLETED") {
      const dealMissing =
        decToNum(data.dealUnitPriceKrw) == null ||
        decToNum(data.dealTotalKrw) == null;
      if (dealMissing) setCompleteWarn(true);
      const warnPrefix = dealMissing
        ? "⚠ 거래 기록(단가·총액)이 아직 작성되지 않았습니다.\n계속하면 기록 없이 완료됩니다.\n\n"
        : "";
      const msg =
        oursCount > 0
          ? `${warnPrefix}거래 완료 처리하시겠습니까?\n\n저장된 거래 기록 기준, 우리 지갑 ${oursCount}장이 재고에서 자동 불출 기록됩니다.\n(이 신청으로 불출 기록이 이미 있으면 중복 기록되지 않습니다.)`
          : `${warnPrefix}거래 완료 처리하시겠습니까?\n\n「우리 지갑」으로 체크된 주소가 없어 재고 불출은 기록되지 않습니다.`;
      if (!window.confirm(msg)) return;
      setCompleteWarn(false);
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/miracle10/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "상태 변경 실패");
      }
      if (
        status === "COMPLETED" &&
        oursCount > 0 &&
        (json.walletAutoOut ?? 0) === 0
      ) {
        alert("이 신청의 불출 기록이 이미 있어 자동 불출은 생략되었습니다.");
      }
      invalidateAfterMiracle10Change({
        inventory: status === "COMPLETED",
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Page>
        <Skeleton variant="card" count={3} />
      </Page>
    );
  if (error)
    return (
      <Page>
        <ErrorState message={error} onRetry={load} />
      </Page>
    );
  if (!data) return null;

  const canEditSchedule =
    (data.visitType === "RESERVED" || data.visitType === "WALK_IN") &&
    canAdminEditSchedule(data.status);

  const showScheduleEditor = canEditSchedule;

  const visitTypeLabel = formatAdminVisitTypeLabel(data.visitType, {
    officeId: data.officeId,
    visitDate: data.visitDate,
    reservedStart: data.reservedStart,
  });

  return (
    <Page>
      <BackLink href="/admin/requests?type=miracle10">← 목록으로</BackLink>

      <ActionCard>
        <SectionTitle>다음 액션</SectionTitle>

        {data.status === "PENDING" ? (
          <ContactChecklist
            order={data}
            saving={saving}
            onComplete={(extra) => changeStatus("CONTACTED", extra)}
            onBypass={(extra) => {
              if (
                window.confirm(
                  "필수 항목 확인 없이 연락완료로 넘어갑니다. 입력·체크한 내용은 저장됩니다.",
                )
              ) {
                changeStatus("CONTACTED", extra);
              }
            }}
            onCancelOrder={() => {
              if (
                window.confirm(
                  "P2P 판매 이력이 없어 이용 불가 안내 후 취소 처리합니다. 진행할까요?",
                )
              ) {
                changeStatus("CANCELED");
              }
            }}
          />
        ) : null}

        {data.status === "CONTACTED" && data.p2pExperienceConfirmed === true ? (
          <>
            <NextActionRow>
              <PrimaryActionBtn
                disabled={saving}
                onClick={() =>
                  changeStatus("VERIFIED", { p2pExperienceConfirmed: true })
                }
              >
                {saving ? "확정 중…" : "일정 확정"}
              </PrimaryActionBtn>
              <P2pOkBadge>P2P 확인됨 ✓</P2pOkBadge>
            </NextActionRow>
            <ActionHint>
              연락 단계에서 P2P 판매 이력이 확인된 건입니다. 확정 시 세션
              운영자에게 배정되고 캘린더 정원에 반영됩니다.
              {data.officeId == null || !data.visitDate || !data.reservedStart
                ? " ⚠ 방문 일정이 아직 완전히 지정되지 않았습니다 — 아래 「방문 일정」에서 지정 후 확정을 권장합니다."
                : ""}
            </ActionHint>
          </>
        ) : null}

        {data.status === "CONTACTED" && data.p2pExperienceConfirmed !== true ? (
          verifyOpen ? (
            <ConfirmBox>
              <CheckLabel>
                <input
                  type="checkbox"
                  checked={p2pChecked}
                  onChange={(e) => setP2pChecked(e.target.checked)}
                />
                P2P 거래 앱에서의 판매 경험 여부를 확인했습니까?
              </CheckLabel>
              <ConfirmActions>
                <PrimaryActionBtn
                  disabled={!p2pChecked || saving}
                  onClick={() =>
                    changeStatus("VERIFIED", { p2pExperienceConfirmed: true })
                  }
                >
                  {saving ? "확정 중…" : "일정 확정"}
                </PrimaryActionBtn>
                <GhostBtn
                  type="button"
                  onClick={() => {
                    setVerifyOpen(false);
                    setP2pChecked(false);
                  }}
                >
                  취소
                </GhostBtn>
              </ConfirmActions>
              {data.officeId == null ||
              !data.visitDate ||
              !data.reservedStart ? (
                <ActionHint>
                  ⚠ 방문 일정(사무실·날짜·시간)이 아직 완전히 지정되지
                  않았습니다. 아래 「방문 일정」에서 지정 후 확정을 권장합니다.
                </ActionHint>
              ) : null}
            </ConfirmBox>
          ) : (
            <>
              <NextActionRow>
                <PrimaryActionBtn
                  disabled={saving}
                  onClick={() => setVerifyOpen(true)}
                >
                  일정 확정
                </PrimaryActionBtn>
              </NextActionRow>
              <ActionHint>
                확정 시 세션 운영자에게 배정되고 캘린더 정원에 반영됩니다. 확정
                전 P2P 판매 경험 확인 단계가 있습니다.
              </ActionHint>
            </>
          )
        ) : null}

        {data.status === "VERIFIED" ? (
          <>
            <NextActionRow>
              <PrimaryActionBtn
                disabled={saving}
                onClick={() => changeStatus("COMPLETED")}
              >
                거래 완료 처리
              </PrimaryActionBtn>
            </NextActionRow>
            <ActionHint>
              P2P 판매 경험 확인:{" "}
              {data.p2pExperienceConfirmed == null
                ? "기록 없음"
                : data.p2pExperienceConfirmed
                  ? "확인됨"
                  : "미확인"}
              {" · "}거래를 마쳤으면 아래 「거래 기록」을 저장한 뒤 완료
              처리하세요.
            </ActionHint>
          </>
        ) : null}

        {data.status === "COMPLETED" || data.status === "CANCELED" ? (
          <ActionHint style={{ marginTop: 0 }}>
            {data.status === "COMPLETED"
              ? "완료된 신청입니다. 필요 시 아래에서 상태를 직접 변경할 수 있습니다."
              : "취소된 신청입니다. 필요 시 아래에서 상태를 직접 변경할 수 있습니다."}
          </ActionHint>
        ) : null}

        {completeWarn ? (
          <CompleteWarnText role="alert">
            거래 기록을 먼저 작성해주세요. 아래 「거래 기록」에서 단가·총액을
            저장한 뒤 완료 처리하는 것을 권장합니다.
          </CompleteWarnText>
        ) : null}

        {/* 예외 처리용 — 기본 접힘 (다음 액션과 역할 중복 해소) */}
        <InlineCollapseHeader
          type="button"
          aria-expanded={statusMenuOpen}
          onClick={() => setStatusMenuOpen((o) => !o)}
        >
          {statusMenuOpen ? "▾" : "▸"} 상태 직접 변경
        </InlineCollapseHeader>
        {statusMenuOpen ? (
          <>
            <StatusButtons style={{ marginTop: "0.6rem" }}>
              {MIRACLE10_STATUSES.map((s) => (
                <StatusButton
                  key={s}
                  $active={data.status === s}
                  $color={STATUS_COLORS[s]}
                  disabled={saving || data.status === s}
                  onClick={() => changeStatus(s)}
                >
                  {STATUS_LABELS[s]}
                </StatusButton>
              ))}
            </StatusButtons>
            <TestToggleLabel>
              <input
                type="checkbox"
                checked={data.isTest}
                disabled={saving}
                onChange={(e) => toggleTest(e.target.checked)}
              />
              테스트 데이터 (목록·집계·공개 예약 자리에서 제외)
            </TestToggleLabel>
          </>
        ) : null}
      </ActionCard>

      {/* 신청인 + 신청 내용 병합 카드 */}
      <Card>
        <SectionTitle>신청인 · 신청 내용</SectionTitle>
        <Field>
          <Key>이름</Key>
          <Val>{data.customer.name}</Val>
        </Field>
        <Field>
          <Key>연락처</Key>
          <Val>{data.customer.contact}</Val>
        </Field>
        <Field>
          <Key>SBMB 회원</Key>
          <Val>{data.isSbmbMember ? "예" : "아니오"}</Val>
        </Field>
        <Field>
          <Key>면대면 인증</Key>
          <Val>
            {data.customer.verifiedAt
              ? new Date(data.customer.verifiedAt).toLocaleString("ko-KR")
              : "미완료"}
          </Val>
        </Field>
        <Field>
          <Key>수량</Key>
          <Val>{data.quantity}모 ({data.asset ?? "BMB"})</Val>
        </Field>
        <Field>
          <Key>연락 선호시간</Key>
          <Val>{data.contactTimePref || "-"}</Val>
        </Field>
        <Field>
          <Key>방문 방식</Key>
          <Val>{visitTypeLabel}</Val>
        </Field>
        <Field>
          <Key>메모</Key>
          <Val>{data.memo || "-"}</Val>
        </Field>
        {/* 사전 파악 — 별도 섹션 대신 요약 한 줄 + 인라인 편집 (체크리스트가 입력 지점) */}
        <PreCheckField order={data} saving={saving} onSaved={load} />
      </Card>

      {/* 방문 일정 — 독립 카드 */}
      <Card>
        {showScheduleEditor ? (
          <VisitScheduleEditor
            orderId={data.id}
            visitType={data.visitType}
            officeId={data.officeId}
            status={data.status}
            visitDate={data.visitDate}
            reservedStart={data.reservedStart}
            p2pConfirmed={data.p2pExperienceConfirmed === true}
            onSaved={load}
          />
        ) : (
          <>
            <SectionTitle>방문 일정</SectionTitle>
            <Field>
              <Key>방문 희망일</Key>
              <Val>
                {data.visitDate
                  ? (formatKstYmdLong(data.visitDate) ?? data.visitDate)
                  : "-"}
              </Val>
            </Field>
            <Field>
              <Key>방문 시간</Key>
              <Val>
                {data.reservedStart
                  ? `${data.reservedStart} 시작`
                  : data.visitTimeSlot || "-"}
              </Val>
            </Field>
          </>
        )}
      </Card>

      {/* 거래 기록 — VERIFIED 이상이면 자동 펼침 */}
      <Collapsible
        title="거래 기록"
        defaultOpen={
          data.status === "VERIFIED" || data.status === "COMPLETED"
        }
      >
        <DealRecordSection order={data} onSaved={load} />
      </Collapsible>

      <CommentsSection
        key={data.id}
        targetType="MIRACLE10"
        targetId={data.id}
        initialComments={comments}
        myAdminUserId={myAdminUserId}
      />

      {/* 접수 정보 — 읽기 전용 메타, 기본 접힘 */}
      <Collapsible title="접수 정보" defaultOpen={false}>
        <Field>
          <Key>개인정보 동의</Key>
          <Val>{data.agreePrivacy ? "동의" : "미동의"}</Val>
        </Field>
        <Field>
          <Key>접수일시</Key>
          <Val>{new Date(data.createdAt).toLocaleString("ko-KR")}</Val>
        </Field>
        <Field>
          <Key>최근 변경</Key>
          <Val>{new Date(data.updatedAt).toLocaleString("ko-KR")}</Val>
        </Field>
        <Field>
          <Key>최종 수정</Key>
          <Val>
            {data.lastEditedByName && data.lastEditedAt
              ? `${data.lastEditedByName} · ${new Date(data.lastEditedAt).toLocaleString("ko-KR")}`
              : "-"}
          </Val>
        </Field>
      </Collapsible>
    </Page>
  );
}

/* ── 접기 컨테이너 ── */

function Collapsible({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <CollapseCard>
      <CollapseHeader
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden>{open ? "▾" : "▸"}</span> {title}
      </CollapseHeader>
      {open ? <CollapseBody>{children}</CollapseBody> : null}
    </CollapseCard>
  );
}

/* ── 사전 파악 3단 값 공용 ── */

type TriValue = "yes" | "no" | null;

function triFromField(v: string | null): TriValue {
  return v === "yes" || v === "no" ? v : null;
}

const PRECHECK_LABELS: { key: "needFaceAuth" | "needUsdt" | "needBmb"; label: string }[] = [
  { key: "needFaceAuth", label: "대면 인증" },
  { key: "needUsdt", label: "USDT 준비" },
  { key: "needBmb", label: "BMB 준비" },
];

function TriToggle({
  value,
  onChange,
  disabled,
}: {
  value: TriValue;
  onChange: (v: TriValue) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <TriBtn
        type="button"
        $active={value === "yes"}
        $tone="yes"
        disabled={disabled}
        onClick={() => onChange(value === "yes" ? null : "yes")}
      >
        필요
      </TriBtn>
      <TriBtn
        type="button"
        $active={value === "no"}
        $tone="no"
        disabled={disabled}
        onClick={() => onChange(value === "no" ? null : "no")}
      >
        불필요
      </TriBtn>
    </>
  );
}

/* ── 연락 체크리스트 (PENDING 다음 액션) ── */

function ContactChecklist({
  order,
  saving,
  onComplete,
  onBypass,
  onCancelOrder,
}: {
  order: Detail;
  saving: boolean;
  onComplete: (extra: Record<string, unknown>) => void;
  onBypass: (extra: Record<string, unknown>) => void;
  onCancelOrder: () => void;
}) {
  // ① P2P — 저장값이 true면 체크된 상태로 시작
  const [p2pOk, setP2pOk] = useState(order.p2pExperienceConfirmed === true);
  // ② 종이지갑 안내 — 세션 로컬 확인 상태만 (저장·추론하지 않음)
  const [walletOk, setWalletOk] = useState(false);
  const [ownedInput, setOwnedInput] = useState(
    order.ownedPaperWalletCount != null
      ? String(order.ownedPaperWalletCount)
      : "0",
  );
  const [ownedTouched, setOwnedTouched] = useState(false);
  // ③④⑤ 3단 — 기존 값 반영
  const [needFaceAuth, setNeedFaceAuth] = useState<TriValue>(
    triFromField(order.needFaceAuth),
  );
  const [needUsdt, setNeedUsdt] = useState<TriValue>(
    triFromField(order.needUsdt),
  );
  const [needBmb, setNeedBmb] = useState<TriValue>(triFromField(order.needBmb));

  const owned = (() => {
    const n = Number(ownedInput.trim());
    return Number.isInteger(n) && n >= 0 ? n : null;
  })();
  const needTotal = Math.ceil(order.quantity / MO_PER_PAPER_WALLET);
  const toPrepare = paperWalletCountToPrepare(order.quantity, owned ?? 0);

  const canComplete = p2pOk && walletOk && owned != null;

  /** 입력·체크한 것만 payload에 담는다 — 안 채운 필드는 미전송(null 유지) */
  const buildPayload = (): Record<string, unknown> => {
    const extra: Record<string, unknown> = {};
    if (p2pOk) extra.p2pExperienceConfirmed = true;
    if (owned != null && (ownedTouched || order.ownedPaperWalletCount != null)) {
      extra.ownedPaperWalletCount = owned;
    }
    if (needFaceAuth != null) extra.needFaceAuth = needFaceAuth;
    if (needUsdt != null) extra.needUsdt = needUsdt;
    if (needBmb != null) extra.needBmb = needBmb;
    return extra;
  };

  const triState = { needFaceAuth, needUsdt, needBmb } as const;
  const triSetters = {
    needFaceAuth: setNeedFaceAuth,
    needUsdt: setNeedUsdt,
    needBmb: setNeedBmb,
  } as const;

  return (
    <ChecklistBox>
      <NextActionRow>
        <TelLinkBtn href={`tel:${order.customer.contact.replace(/[^+\d]/g, "")}`}>
          📞 {order.customer.contact}
        </TelLinkBtn>
      </NextActionRow>

      <ChecklistItem $done={p2pOk}>
        <ChecklistMain>
          <input
            type="checkbox"
            checked={p2pOk}
            onChange={(e) => setP2pOk(e.target.checked)}
          />
          1. P2P 거래소 판매 이력 있음
          <RequiredMark>필수</RequiredMark>
        </ChecklistMain>
        {!p2pOk ? (
          <ChecklistSub>
            이력이 없으면 이용이 불가합니다 — 안내 후
            <CancelMiniBtn type="button" disabled={saving} onClick={onCancelOrder}>
              취소 처리
            </CancelMiniBtn>{" "}
            또는 보류하세요.
          </ChecklistSub>
        ) : null}
      </ChecklistItem>

      <ChecklistItem $done={walletOk}>
        <ChecklistMain>
          <input
            type="checkbox"
            checked={walletOk}
            onChange={(e) => setWalletOk(e.target.checked)}
          />
          2. 종이지갑 안내
          <RequiredMark>필수</RequiredMark>
        </ChecklistMain>
        <ChecklistSub>
          신청 {order.quantity}모 → 필요 {needTotal}장 · 이미 보유{" "}
          <OwnedInput
            inputMode="numeric"
            value={ownedInput}
            onChange={(e) => {
              setOwnedInput(e.target.value);
              setOwnedTouched(true);
            }}
            aria-label="이미 보유한 종이지갑 장수"
          />
          장 → 우리가 준비 <strong>{owned != null ? toPrepare : "—"}장</strong>
          <br />
          보유분은 재고 소요에서 제외됩니다.
          {owned == null ? " (보유 장수를 숫자로 입력하세요)" : ""}
        </ChecklistSub>
      </ChecklistItem>

      <ChecklistItem>
        <TriRow>
          {PRECHECK_LABELS.map(({ key, label }, i) => (
            <TriGroup key={key}>
              <span>
                {i + 3}. {label}
              </span>
              <TriToggle
                value={triState[key]}
                onChange={(v) => triSetters[key](v)}
                disabled={saving}
              />
            </TriGroup>
          ))}
        </TriRow>
        <ChecklistSub style={{ margin: "0.4rem 0 0" }}>
          선택 항목 — 미선택 시 「미확인」으로 남습니다.
        </ChecklistSub>
      </ChecklistItem>

      <NextActionRow>
        <PrimaryActionBtn
          disabled={saving || !canComplete}
          onClick={() => onComplete(buildPayload())}
        >
          {saving ? "처리 중…" : "연락 완료 처리"}
        </PrimaryActionBtn>
      </NextActionRow>
      <InlineTextLink
        type="button"
        disabled={saving}
        onClick={() => onBypass(buildPayload())}
      >
        체크 없이 연락완료 처리
      </InlineTextLink>
    </ChecklistBox>
  );
}

/* ── 사전 파악 요약 + 인라인 편집 (신청 내용 카드 안) ── */

function PreCheckField({
  order,
  saving,
  onSaved,
}: {
  order: Detail;
  saving: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, TriValue>>({
    needFaceAuth: triFromField(order.needFaceAuth),
    needUsdt: triFromField(order.needUsdt),
    needBmb: triFromField(order.needBmb),
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/miracle10/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          needFaceAuth: values.needFaceAuth,
          needUsdt: values.needUsdt,
          needBmb: values.needBmb,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "저장 실패");
      setEditing(false);
      invalidateAfterMiracle10Change();
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const summaryParts: React.ReactNode[] = [];
  for (const { key, label } of PRECHECK_LABELS) {
    const v = triFromField(order[key]);
    if (v === "yes") summaryParts.push(<span key={key}>{label} 필요</span>);
    else if (v === "no")
      summaryParts.push(<PreCheckFaint key={key}>{label} 불필요</PreCheckFaint>);
  }

  return (
    <Field>
      <Key>사전 파악</Key>
      <Val>
        {editing ? (
          <span style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <TriRow>
              {PRECHECK_LABELS.map(({ key, label }) => (
                <TriGroup key={key}>
                  <span>{label}</span>
                  <TriToggle
                    value={values[key]}
                    onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
                    disabled={busy}
                  />
                </TriGroup>
              ))}
            </TriRow>
            <span>
              <MiniEditBtn type="button" disabled={busy} onClick={save}>
                {busy ? "저장 중…" : "저장"}
              </MiniEditBtn>
              <MiniEditBtn
                type="button"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                취소
              </MiniEditBtn>
            </span>
          </span>
        ) : (
          <>
            {summaryParts.length > 0
              ? summaryParts.map((part, i) => (
                  <span key={i}>
                    {i > 0 ? " · " : ""}
                    {part}
                  </span>
                ))
              : "-"}
            <MiniEditBtn
              type="button"
              disabled={saving}
              onClick={() => setEditing(true)}
            >
              수정
            </MiniEditBtn>
          </>
        )}
      </Val>
    </Field>
  );
}

interface VisitScheduleEditorProps {
  orderId: number;
  visitType: string | null;
  officeId: number | null;
  status: Miracle10Status;
  visitDate: string | null;
  reservedStart: string | null;
  /** 연락 단계에서 P2P 확인 완료 — true면 확정 시 확인 단계 스킵 */
  p2pConfirmed: boolean;
  onSaved: () => void;
}

function VisitScheduleEditor({
  orderId,
  visitType,
  officeId,
  status,
  visitDate,
  reservedStart,
  p2pConfirmed,
  onSaved,
}: VisitScheduleEditorProps) {
  const minDate = todayKst();
  const [draftOfficeId, setDraftOfficeId] = useState<number | null>(officeId);
  const [offices, setOffices] = useState<OfficeOption[]>([]);
  const [officesLoading, setOfficesLoading] = useState(true);
  const [draftDate, setDraftDate] = useState(visitDate ?? "");
  const [draftStart, setDraftStart] = useState(reservedStart ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = visitDate && visitDate >= minDate ? visitDate : minDate;
    return { y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 };
  });
  const [slotOpenDates, setSlotOpenDates] = useState<Set<string>>(
    () => new Set(),
  );
  const [daySlots, setDaySlots] = useState<AvailableSlot[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    setDraftOfficeId(officeId);
    setDraftDate(visitDate ?? "");
    setDraftStart(reservedStart ?? "");
  }, [officeId, visitDate, reservedStart]);

  useEffect(() => {
    let cancelled = false;
    setOfficesLoading(true);
    fetch("/api/admin/offices")
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) throw new Error(json.error);
        setOffices(
          (json.offices as OfficeOption[]).filter((o) => o.isActive),
        );
      })
      .catch(() => {
        if (!cancelled) setOffices([]);
      })
      .finally(() => {
        if (!cancelled) setOfficesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeOfficeId = draftOfficeId;

  useEffect(() => {
    if (activeOfficeId == null) {
      setSlotOpenDates(new Set());
      return;
    }
    let cancelled = false;
    setDaysLoading(true);
    const { from, to } = monthBoundsKst(viewMonth.y, viewMonth.m);
    fetch(
      `/api/miracle10/available-slots?officeId=${activeOfficeId}&from=${from}&to=${to}`,
    )
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) throw new Error(json.error);
        const dates = new Set<string>(
          (
            json.days as { date: string; slotCount: number }[]
          )
            .filter((d) => d.slotCount > 0)
            .map((d) => d.date),
        );
        if (visitDate) dates.add(visitDate);
        setSlotOpenDates(dates);
      })
      .catch(() => {
        if (!cancelled) setSlotOpenDates(visitDate ? new Set([visitDate]) : new Set());
      })
      .finally(() => {
        if (!cancelled) setDaysLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeOfficeId, viewMonth.y, viewMonth.m, visitDate]);

  useEffect(() => {
    if (!draftDate || activeOfficeId == null) {
      setDaySlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetch(
      `/api/miracle10/available-slots?officeId=${activeOfficeId}&date=${draftDate}`,
    )
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) throw new Error(json.error);
        setDaySlots(json.slots as AvailableSlot[]);
      })
      .catch(() => {
        if (!cancelled) setDaySlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draftDate, activeOfficeId]);

  const handleMonthChange = useCallback((y: number, m: number) => {
    setViewMonth((prev) => (prev.y === y && prev.m === m ? prev : { y, m }));
  }, []);

  const isDateEnabled = useCallback(
    (ymd: string) => isBusinessDayKst(ymd) && slotOpenDates.has(ymd),
    [slotOpenDates],
  );

  // 일정 확정 전 P2P 확인 단계 (다음 액션 카드와 동일 정책)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [p2pChecked, setP2pChecked] = useState(false);

  const hasChanges =
    draftDate !== (visitDate ?? "") ||
    draftStart !== (reservedStart ?? "") ||
    draftOfficeId !== officeId;

  const fieldsComplete =
    activeOfficeId != null && draftDate !== "" && draftStart !== "";

  // 임시 저장(상태 유지)은 변경이 있을 때만, 확정은 필드만 완성되면 가능
  // (임시 저장해 둔 일정을 그대로 확정하는 경우 포함).
  const canSaveDraft = hasChanges && fieldsComplete;
  const canConfirm = fieldsComplete;

  /** confirm=true면 일정 저장 + VERIFIED 전환을 한 요청(한 트랜잭션)으로. */
  const saveSchedule = async (confirm: boolean) => {
    if (saving || activeOfficeId == null || !fieldsComplete) return;
    if (!confirm && !hasChanges) return;
    setSaving(true);
    setScheduleError(null);
    try {
      const payload: Record<string, unknown> = {
        visitDate: draftDate,
        reservedStart: draftStart,
        officeId: activeOfficeId,
        ...(confirm
          ? { status: "VERIFIED", p2pExperienceConfirmed: true }
          : {}),
      };
      const res = await fetch(`/api/admin/miracle10/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "일정 저장 실패");
      }
      setConfirmOpen(false);
      setP2pChecked(false);
      invalidateAfterMiracle10Change();
      onSaved();
    } catch (e) {
      setScheduleError(
        e instanceof Error ? e.message : "일정 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ gridColumn: "1 / -1", paddingTop: "0.25rem" }}>
      <SectionTitle style={{ marginTop: "0.5rem" }}>방문 일정</SectionTitle>
      <SectionSub>
        {visitType === "WALK_IN"
          ? "워크인 건 — 사무실·날짜·시간을 지정하면 정식 예약과 동일하게 캘린더·정원에 반영됩니다."
          : status === "VERIFIED"
            ? "일정 확정 건 — 변경 시 기존 자리를 반환하고 새 시간에 재배정합니다."
            : "접수·연락완료 건 — 사무실·방문 희망일·시간을 지정·수정할 수 있습니다."}
      </SectionSub>

      <SectionSub style={{ marginBottom: "0.35rem" }}>사무실</SectionSub>
      <OfficeSelect
        value={draftOfficeId ?? ""}
        disabled={officesLoading || saving}
        onChange={(e) => {
          const next = Number(e.target.value);
          setDraftOfficeId(Number.isInteger(next) && next > 0 ? next : null);
          setDraftDate("");
          setDraftStart("");
          setCalendarOpen(false);
        }}
      >
        <option value="">
          {officesLoading ? "불러오는 중…" : "사무실 선택"}
        </option>
        {offices.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </OfficeSelect>
      {officeId != null && visitType === "RESERVED" ? (
        <CalendarHint style={{ textAlign: "left", marginBottom: "0.75rem" }}>
          신청 시 사무실이 자동 지정됐을 수 있습니다. 실제 방문지와 다르면 변경해
          주세요.
        </CalendarHint>
      ) : null}

      {activeOfficeId == null ? (
        <CalendarHint>사무실을 먼저 선택해 주세요.</CalendarHint>
      ) : (
        <>
      <DatePickerWrap>
        <DateSelectButton
          type="button"
          $hasValue={!!draftDate}
          onClick={() => setCalendarOpen((o) => !o)}
        >
          <span>
            {draftDate
              ? (formatKstYmdLong(draftDate) ?? draftDate)
              : "날짜 선택"}
          </span>
          <span aria-hidden="true">{calendarOpen ? "▴" : "▾"}</span>
        </DateSelectButton>
        {calendarOpen ? (
          <CalendarDropdown>
            <MonthCalendar
              valueDate={draftDate || minDate}
              minDate={minDate}
              maxDate={defaultCalendarMaxDate(minDate, 3)}
              isDateEnabled={isDateEnabled}
              onSelect={(s) => {
                setDraftDate(s);
                setDraftStart("");
                setCalendarOpen(false);
              }}
              onMonthChange={handleMonthChange}
            />
            {daysLoading ? (
              <CalendarHint>근무일 조회 중…</CalendarHint>
            ) : slotOpenDates.size === 0 ? (
              <CalendarHint>이 달에 운영 슬롯이 없습니다.</CalendarHint>
            ) : null}
          </CalendarDropdown>
        ) : null}
      </DatePickerWrap>

      {draftDate ? (
        slotsLoading ? (
          <CalendarHint>시간 조회 중…</CalendarHint>
        ) : daySlots.length === 0 ? (
          <CalendarHint>예약 가능한 시간이 없습니다.</CalendarHint>
        ) : (
          <SlotGrid>
            {daySlots.map((slot) => {
              const isCurrent =
                slot.startTime === reservedStart && draftDate === visitDate;
              const selectable = slot.available || isCurrent;
              const active = draftStart === slot.startTime;
              // 누가 차서 정말 마지막일 때만 — 캐파 1·전 슬롯 기본 상태(taken 0)에선 노이즈
              const showLastSpot =
                selectable && slot.remaining === 1 && slot.taken > 0;
              return (
                <SlotChip
                  key={slot.startTime}
                  type="button"
                  $active={active}
                  $booked={!selectable}
                  disabled={!selectable}
                  onClick={() => {
                    if (!selectable) return;
                    setDraftStart(active ? "" : slot.startTime);
                  }}
                >
                  <SlotChipTime>{slot.startTime}</SlotChipTime>
                  {!selectable ? (
                    <SlotChipMeta $active={active} $emphasis>
                      예약됨
                    </SlotChipMeta>
                  ) : showLastSpot ? (
                    <SlotChipMeta $active={active}>마지막 1자리</SlotChipMeta>
                  ) : null}
                </SlotChip>
              );
            })}
          </SlotGrid>
        )
      ) : null}

      {status === "VERIFIED" ? (
        <SaveScheduleBtn
          type="button"
          disabled={!canSaveDraft || saving}
          onClick={() => saveSchedule(false)}
        >
          {saving ? "저장 중…" : "일정 변경 저장"}
        </SaveScheduleBtn>
      ) : confirmOpen ? (
        <ConfirmBox style={{ marginTop: "0.75rem" }}>
          <CheckLabel>
            <input
              type="checkbox"
              checked={p2pChecked}
              onChange={(e) => setP2pChecked(e.target.checked)}
            />
            P2P 거래 앱에서의 판매 경험 여부를 확인했습니까? (판매 이력이
            있으면 이용 불가)
          </CheckLabel>
          <ConfirmActions>
            <PrimaryActionBtn
              disabled={!p2pChecked || saving}
              onClick={() => saveSchedule(true)}
            >
              {saving ? "확정 중…" : "일정 확정"}
            </PrimaryActionBtn>
            <GhostBtn
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                setP2pChecked(false);
              }}
            >
              취소
            </GhostBtn>
          </ConfirmActions>
        </ConfirmBox>
      ) : (
        <>
          <ScheduleBtnRow>
            <SaveScheduleBtn
              type="button"
              style={{ marginTop: 0 }}
              disabled={!canConfirm || saving}
              onClick={() => {
                // 연락 단계에서 P2P가 이미 확인됐으면 확인 단계 스킵
                if (p2pConfirmed) {
                  saveSchedule(true);
                } else {
                  setConfirmOpen(true);
                }
              }}
            >
              {saving ? "확정 중…" : "일정 확정"}
            </SaveScheduleBtn>
            {p2pConfirmed ? <P2pOkBadge>P2P 확인됨 ✓</P2pOkBadge> : null}
          </ScheduleBtnRow>
          <div style={{ marginTop: "0.5rem" }}>
            <InlineTextLink
              type="button"
              disabled={!canSaveDraft || saving}
              onClick={() => saveSchedule(false)}
              title="상태를 바꾸지 않고 일정만 저장 — 캘린더에 미확정으로 표시됩니다"
            >
              확정 없이 저장
            </InlineTextLink>
          </div>
          <ActionHint>
            「일정 확정」 = 일정 저장 + 상태 전환(운영자 배정·정원 반영).
          </ActionHint>
        </>
      )}
        </>
      )}
      {scheduleError ? <ScheduleError role="alert">{scheduleError}</ScheduleError> : null}
    </div>
  );
}

/* ── 거래 기록 — 내장 계산기(평단가 + 마진 하한) + 저장 ── */

/** 내장 계산기 마진 하한(%) — 어드민 계산기 MIN_MARGIN_PCT와 동일 정책. */
const DEAL_MIN_MARGIN_PCT = 1;

function toNumOrNull(raw: string): number | null {
  const t = raw.trim().replace(/,/g, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function toPosIntOrNull(raw: string): number | null {
  const n = toNumOrNull(raw);
  return n != null && Number.isInteger(n) && n > 0 ? n : null;
}

function toNonNegIntOrNull(raw: string): number | null {
  const n = toNumOrNull(raw);
  return n != null && Number.isInteger(n) ? n : null;
}

function fmtKrw(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

/** Prisma Decimal은 JSON에서 string으로 오므로 숫자로 정규화. */
function decToNum(v: string | number | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface CalcSnapshot {
  vwap: number;
  usdtKrw: number;
  vwapKrw: number;
  source: "orderbook" | "ticker";
}

function DealRecordSection({
  order,
  onSaved,
}: {
  order: Detail;
  onSaved: () => void;
}) {
  const initialQty = order.dealQuantity ?? order.quantity;
  const [qtyInput, setQtyInput] = useState(String(initialQty));
  const [unitKrwInput, setUnitKrwInput] = useState(() => {
    const n = decToNum(order.dealUnitPriceKrw);
    return n != null ? String(Math.round(n)) : "";
  });
  const [unitUsdtInput, setUnitUsdtInput] = useState(() => {
    const n = decToNum(order.dealUnitPriceUsdt);
    return n != null ? String(n) : "";
  });
  // 프리필 = 준비 장수(손님 보유분 차감) — 저장값이 있으면 그 값 우선
  const [walletCountInput, setWalletCountInput] = useState(() =>
    String(
      order.paperWalletCount ??
        paperWalletCountToPrepare(initialQty, order.ownedPaperWalletCount),
    ),
  );
  // 수령 지갑 — 여러 장(연속 스캔·직접 입력) + 주소별 「우리 지갑」 여부. dedup 키는 소문자 기준.
  const [wallets, setWallets] = useState<ReceiveWallet[]>(
    order.receiveWallets ?? [],
  );
  const addrKeysRef = useRef(
    new Set((order.receiveWallets ?? []).map((w) => addressDedupKey(w.address))),
  );
  const [addressInput, setAddressInput] = useState("");
  const [scanFlashTick, setScanFlashTick] = useState(0);
  const [scanOpen, setScanOpen] = useState(false);
  const [marginPctInput, setMarginPctInput] = useState(
    String(DEAL_MIN_MARGIN_PCT),
  );
  // USDT 환율 — 빈 값이면 자동 조회값, 입력 시 수동값이 우선.
  const [usdtKrwInput, setUsdtKrwInput] = useState("");

  const [calc, setCalc] = useState<CalcSnapshot | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  const qty = toPosIntOrNull(qtyInput);
  const unitKrw = toNumOrNull(unitKrwInput);
  const unitUsdt = toNumOrNull(unitUsdtInput);
  const walletCount = toNonNegIntOrNull(walletCountInput);
  const usdtKrwOverride = (() => {
    const n = toNumOrNull(usdtKrwInput);
    return n != null && n > 0 ? n : null;
  })();
  const marginPctRaw = Number(marginPctInput);
  const marginPct =
    Number.isFinite(marginPctRaw) && marginPctRaw > 0
      ? Math.max(DEAL_MIN_MARGIN_PCT, marginPctRaw)
      : DEAL_MIN_MARGIN_PCT;

  const loadCalc = useCallback(async () => {
    const q = toPosIntOrNull(qtyInput);
    if (q == null) {
      setCalcError("수량이 올바르지 않습니다.");
      return;
    }
    setCalcLoading(true);
    setCalcError(null);
    try {
      const res = await fetch(
        `/api/admin/otc-calc?quantity=${q}&direction=buy`,
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "시세를 불러오지 못했습니다.");
      }
      setCalc({
        vwap: json.vwap,
        usdtKrw: json.usdtKrw,
        vwapKrw: json.vwapKrw,
        source: json.source,
      });
    } catch (e) {
      setCalcError(e instanceof Error ? e.message : "시세 조회에 실패했습니다.");
    } finally {
      setCalcLoading(false);
    }
  }, [qtyInput]);

  // 최초 1회 자동 조회 — market-signals 없이 otc-calc(호가+환율)만.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadCalc();
  }, [loadCalc]);

  // 수동 환율이 있으면 그것을, 없으면 자동 조회 환율을 쓴다.
  const effectiveUsdtKrw = usdtKrwOverride ?? calc?.usdtKrw ?? null;

  // 환율 수정 시 단가(USDT)를 단가(원) 기준으로 함께 환산.
  const handleUsdtKrwChange = (raw: string) => {
    setUsdtKrwInput(raw);
    const n = toNumOrNull(raw);
    const rate = n != null && n > 0 ? n : (calc?.usdtKrw ?? null);
    const uk = toNumOrNull(unitKrwInput);
    if (rate != null && rate > 0 && uk != null) {
      setUnitUsdtInput((uk / rate).toFixed(4));
    }
  };

  const estimate =
    calc && qty != null && effectiveUsdtKrw != null
      ? computeCustomerEstimate({
          baseUsdt: calc.vwap,
          usdtKrw: effectiveUsdtKrw,
          quantity: qty,
          marginRate: marginPct / 100,
        })
      : null;
  const suggestedUnitUsdt =
    estimate && effectiveUsdtKrw != null
      ? estimate.perMoKrw / effectiveUsdtKrw
      : null;

  const applyEstimate = () => {
    if (!estimate || suggestedUnitUsdt == null) return;
    setUnitKrwInput(String(estimate.perMoKrw));
    setUnitUsdtInput(suggestedUnitUsdt.toFixed(4));
  };

  const coinTotalKrw =
    qty != null && unitKrw != null ? Math.round(qty * unitKrw) : null;
  const savedPaperKrw = decToNum(order.paperWalletKrw);
  const paperKrw =
    walletCount == null
      ? null
      : walletCount === 0
        ? 0
        : effectiveUsdtKrw != null
          ? paperWalletPriceKrw(walletCount, effectiveUsdtKrw)
          : walletCount === order.paperWalletCount && savedPaperKrw != null
            ? Math.round(savedPaperKrw)
            : null;
  const totalKrw =
    coinTotalKrw != null && paperKrw != null ? coinTotalKrw + paperKrw : null;

  const addAddress = (raw: string): boolean => {
    const t = raw.trim();
    if (!t) return false;
    const key = addressDedupKey(t);
    if (addrKeysRef.current.has(key)) return false;
    addrKeysRef.current.add(key);
    // 기본 = 우리 지갑 (대부분 우리 종이지갑을 전달)
    setWallets((prev) => [...prev, { address: t, isOurs: true }]);
    return true;
  };

  const removeAddress = (addr: string) => {
    addrKeysRef.current.delete(addressDedupKey(addr));
    setWallets((prev) => prev.filter((w) => w.address !== addr));
  };

  const toggleOurs = (addr: string) => {
    setWallets((prev) =>
      prev.map((w) =>
        w.address === addr ? { ...w, isOurs: !w.isOurs } : w,
      ),
    );
  };

  const oursCount = wallets.filter((w) => w.isOurs).length;

  const addManualAddress = () => {
    if (addAddress(addressInput)) setAddressInput("");
  };

  const handleScanDetected = (addr: string) => {
    if (!addAddress(addr)) return;
    setScanFlashTick((t) => t + 1);
    try {
      navigator.vibrate?.(40);
    } catch {
      /* 미지원 브라우저 */
    }
  };

  // 우리 지갑 수 ≠ 종이지갑 수량 — 참고 표시(강제 아님).
  const walletCountMismatch =
    walletCount != null &&
    walletCount > 0 &&
    wallets.length > 0 &&
    oursCount !== walletCount;

  const save = async () => {
    if (qty == null || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/miracle10/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealQuantity: qty,
          dealUnitPriceKrw: unitKrw,
          dealUnitPriceUsdt: unitUsdt,
          dealCoinTotalKrw: coinTotalKrw,
          paperWalletCount: walletCount,
          paperWalletKrw: paperKrw,
          dealTotalKrw: totalKrw,
          receiveWallets: wallets,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "저장 실패");
      }
      setSaveMsg({ text: "저장되었습니다." });
      invalidateAfterMiracle10Change();
      onSaved();
    } catch (e) {
      setSaveMsg({
        text: e instanceof Error ? e.message : "저장에 실패했습니다.",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {order.status === "VERIFIED" ? (
        <NextStepNote>
          다음 단계 — 호가 평단가 기준으로 「계산 결과 기입」을 눌러 단가를
          산정하고, 흥정 결과를 반영해 저장하세요. 저장 후 위에서 「거래 완료
          처리」를 진행합니다.
        </NextStepNote>
      ) : null}
      <SectionSub>
        호가 소진 평단가 기준 + 마진 하한(10모당 3만원) 계산기입니다. 「계산
        결과 기입」 후 흥정에 맞게 단가를 수정하고 저장하세요.
      </SectionSub>

      <CalcBox>
        {calcLoading ? (
          <CalcRow>
            <span>시세 불러오는 중…</span>
          </CalcRow>
        ) : calcError ? (
          <CalcRow style={{ color: adminColors.danger }}>
            <span>{calcError}</span>
          </CalcRow>
        ) : calc ? (
          <CalcRow>
            <span>
              호가 평단가
              {calc.source === "ticker" ? " (현재가 대체)" : ""}
            </span>
            <strong>
              {fmtKrw(
                effectiveUsdtKrw != null
                  ? calc.vwap * effectiveUsdtKrw
                  : calc.vwapKrw,
              )}
              원 · {calc.vwap.toFixed(4)} USDT
            </strong>
          </CalcRow>
        ) : null}
        <CalcRow>
          <span>
            <FieldLabel
              htmlFor="deal-usdt-krw"
              style={{ display: "inline", margin: 0, fontSize: "0.85rem", color: adminColors.textSub }}
            >
              USDT 환율 (원)
            </FieldLabel>
            {usdtKrwOverride != null ? <FloorNote>수동</FloorNote> : null}
          </span>
          <RateInput
            id="deal-usdt-krw"
            inputMode="decimal"
            value={usdtKrwInput}
            onChange={(e) => handleUsdtKrwChange(e.target.value)}
            placeholder={calc ? String(Math.round(calc.usdtKrw)) : "직접 입력"}
          />
        </CalcRow>
        {usdtKrwOverride != null && calc != null ? (
          <CalcRow>
            <span>자동 조회 환율 (비워두면 적용)</span>
            <span>{fmtKrw(calc.usdtKrw)}원</span>
          </CalcRow>
        ) : null}
        {estimate ? (
          <CalcRow>
            <span>
              손님 단가 제안 (마진 {marginPct}%)
              {estimate.floorApplied ? (
                <FloorNote>하한 적용 · 10모당 3만원</FloorNote>
              ) : null}
            </span>
            <strong>
              {fmtKrw(estimate.perMoKrw)}원
              {suggestedUnitUsdt != null
                ? ` · ${suggestedUnitUsdt.toFixed(4)} USDT`
                : ""}
            </strong>
          </CalcRow>
        ) : null}
        <CalcActions>
          <FieldLabel
            htmlFor="deal-margin-pct"
            style={{ margin: 0, alignSelf: "center" }}
          >
            마진 %
          </FieldLabel>
          <TextInput
            id="deal-margin-pct"
            style={{ width: "4.5rem" }}
            inputMode="decimal"
            value={marginPctInput}
            onChange={(e) => setMarginPctInput(e.target.value)}
          />
          <SmallBtn type="button" disabled={calcLoading} onClick={loadCalc}>
            시세 새로고침
          </SmallBtn>
          <SmallBtn type="button" disabled={!estimate} onClick={applyEstimate}>
            계산 결과 기입
          </SmallBtn>
        </CalcActions>
      </CalcBox>

      <RecordGrid>
        <RecordField>
          <FieldLabel htmlFor="deal-qty">거래 수량 (개)</FieldLabel>
          <TextInput
            id="deal-qty"
            inputMode="numeric"
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            placeholder={String(order.quantity)}
          />
        </RecordField>
        <RecordField>
          <FieldLabel htmlFor="deal-wallets">
            종이지갑 수량 (장 · 기본 = 수량/{MO_PER_PAPER_WALLET})
          </FieldLabel>
          <TextInput
            id="deal-wallets"
            inputMode="numeric"
            value={walletCountInput}
            onChange={(e) => setWalletCountInput(e.target.value)}
          />
        </RecordField>
        <RecordField>
          <FieldLabel htmlFor="deal-unit-krw">단가 (원)</FieldLabel>
          <TextInput
            id="deal-unit-krw"
            inputMode="decimal"
            value={unitKrwInput}
            onChange={(e) => setUnitKrwInput(e.target.value)}
            placeholder="계산 결과 기입 또는 직접 입력"
          />
        </RecordField>
        <RecordField>
          <FieldLabel htmlFor="deal-unit-usdt">단가 (USDT)</FieldLabel>
          <TextInput
            id="deal-unit-usdt"
            inputMode="decimal"
            value={unitUsdtInput}
            onChange={(e) => setUnitUsdtInput(e.target.value)}
          />
        </RecordField>
        <RecordField>
          <FieldLabel>코인 총액 (원) — 수량 × 단가 자동</FieldLabel>
          <DerivedValue>
            {coinTotalKrw != null ? `${fmtKrw(coinTotalKrw)}원` : "—"}
          </DerivedValue>
        </RecordField>
        <RecordField>
          <FieldLabel>
            종이지갑 가격 (원) — 장수 × {PAPER_WALLET_UNIT_USDT} USDT × 환율
            자동
          </FieldLabel>
          <DerivedValue>
            {paperKrw != null
              ? `${fmtKrw(paperKrw)}원`
              : "시세 조회 후 계산됩니다"}
          </DerivedValue>
        </RecordField>
        <RecordField $full>
          <FieldLabel>총 가격 (원) — 코인 총액 + 지갑 가격</FieldLabel>
          <DerivedValue style={{ fontSize: "1rem" }}>
            {totalKrw != null ? `${fmtKrw(totalKrw)}원` : "—"}
          </DerivedValue>
        </RecordField>
        <RecordField $full>
          <FieldLabel htmlFor="deal-address-input">
            수령 지갑주소 ({wallets.length}개 · 우리 지갑 {oursCount}개)
          </FieldLabel>
          {wallets.length > 0 ? (
            <AddressList>
              {wallets.map((w) => (
                <AddressRow key={addressDedupKey(w.address)}>
                  <OursCheck $checked={w.isOurs}>
                    <input
                      type="checkbox"
                      checked={w.isOurs}
                      onChange={() => toggleOurs(w.address)}
                    />
                    우리 지갑
                  </OursCheck>
                  <AddressText>{w.address}</AddressText>
                  <AddrRemoveBtn
                    type="button"
                    onClick={() => removeAddress(w.address)}
                  >
                    삭제
                  </AddrRemoveBtn>
                </AddressRow>
              ))}
            </AddressList>
          ) : null}
          {walletCountMismatch ? (
            <MismatchNote>
              참고: 우리 지갑 {oursCount}개 · 종이지갑 수량 {walletCount}장 —
              수가 서로 다릅니다. 손님 본인 지갑은 체크를 해제하세요.
            </MismatchNote>
          ) : null}
          <AddressAddRow>
            <TextInput
              id="deal-address-input"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManualAddress();
                }
              }}
              placeholder="0x… 직접 입력"
            />
            <SmallBtn
              type="button"
              disabled={!addressInput.trim()}
              onClick={addManualAddress}
            >
              추가
            </SmallBtn>
            <SmallBtn type="button" onClick={() => setScanOpen((o) => !o)}>
              {scanOpen ? "스캔 닫기" : "QR 연속 스캔"}
            </SmallBtn>
          </AddressAddRow>
          {scanOpen ? (
            <ScanWrap>
              <WalletQrScanner
                paused={false}
                continuous
                successFlashTick={scanFlashTick}
                onDetected={handleScanDetected}
                idleHint="연속 스캔: QR을 읽을 때마다 주소가 목록에 쌓입니다. 중복 주소는 무시되고 잔고는 조회하지 않습니다."
              />
            </ScanWrap>
          ) : null}
        </RecordField>
      </RecordGrid>

      <RecordFootRow>
        <PrimaryActionBtn
          type="button"
          disabled={qty == null || saving}
          onClick={save}
        >
          {saving ? "저장 중…" : "저장"}
        </PrimaryActionBtn>
        {oursCount > 0 ? (
          <SmallLinkBtn
            href={`/admin/wallet-inventory?type=OUT&orderId=${order.id}&count=${oursCount}&receiver=${encodeURIComponent(order.customer.name)}`}
            title="거래 완료 처리 시 자동 불출됩니다. 완료 전에 먼저 기록하려면 이 링크로 수동 등록하세요 (완료 시 중복 기록 안 됨)."
          >
            재고 불출 수동 등록 →
          </SmallLinkBtn>
        ) : null}
        {saveMsg ? (
          <SaveMsg $error={saveMsg.error}>{saveMsg.text}</SaveMsg>
        ) : null}
      </RecordFootRow>
    </div>
  );
}
