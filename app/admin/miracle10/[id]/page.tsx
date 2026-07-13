"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
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
  defaultPaperWalletCount,
  paperWalletPriceKrw,
} from "@/lib/otc-estimate";
import { isBusinessDayKst } from "@/lib/work-schedule";
import { WalletQrScanner } from "@/app/scanner/page/components/WalletQrScanner";
import { addressDedupKey } from "@/app/scanner/lib/utils";
import { StateBox } from "@/components/admin/ui";

const Page = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 1rem;
  }
`;

const BackLink = styled(Link)`
  font-size: 0.875rem;
  color: #6b7280;
  text-decoration: none;
  &:hover {
    color: #111827;
  }
`;

const Title = styled.h1`
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0.75rem 0 1.25rem;
  color: #111827;
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
  margin: 0 0 0.75rem;
`;

const SectionSub = styled.p`
  font-size: 0.78rem;
  color: #6b7280;
  margin: 0 0 0.75rem;
  line-height: 1.45;
`;

const Field = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-top: 1px solid #f5f5f5;
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
  color: #6b7280;
`;

const Val = styled.span`
  color: #111827;
  font-weight: 500;
  word-break: break-all;
`;

const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
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
  background: ${(p) => (p.$active ? p.$color : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : p.$color)};
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
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: ${(p) => (p.$hasValue ? "#111827" : "#9ca3af")};
`;

const CalendarDropdown = styled.div`
  margin-top: 0.5rem;
`;

const CalendarHint = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: #6b7280;
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
      p.$active ? "#4338ca" : p.$booked ? "#e5e7eb" : "#d1d5db"};
  background: ${(p) =>
    p.$active ? "#4338ca" : p.$booked ? "#f9fafb" : "#fff"};
  color: ${(p) => (p.$active ? "#fff" : "#374151")};
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
        ? "#b91c1c"
        : "#9ca3af"};
`;

const SaveScheduleBtn = styled.button`
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: #4338ca;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const ScheduleError = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: #dc2626;
`;

const OfficeSelect = styled.select`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
`;

/* ── 다음 액션 (상태별 주 버튼) ── */

const ActionCard = styled(Card)`
  border-color: #c7d2fe;
  background: #fafaff;
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
  background: #4338ca;
  color: #fff;
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
  border: 1.5px solid #4338ca;
  border-radius: 10px;
  background: #fff;
  color: #4338ca;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
`;

const ActionHint = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.5;
`;

const ConfirmBox = styled.div`
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  padding: 0.9rem 1rem;
`;

const CheckLabel = styled.label`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  font-size: 0.88rem;
  font-weight: 600;
  color: #111827;
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
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
`;

const ManualStatusDivider = styled.div`
  margin: 1rem 0 0.6rem;
  border-top: 1px dashed #e5e7eb;
  padding-top: 0.6rem;
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 600;
`;

/* ── 거래 기록 (내장 계산기) ── */

const CalcBox = styled.div`
  border: 1px solid #e0e7ff;
  background: #eef2ff;
  border-radius: 10px;
  padding: 0.9rem 1rem;
  margin-bottom: 1rem;
`;

const CalcRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.18rem 0;
  font-size: 0.85rem;
  color: #374151;
  strong {
    color: #111827;
  }
`;

const CalcActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.6rem;
`;

const SmallBtn = styled.button`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid #4338ca;
  background: #fff;
  color: #4338ca;
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
  border: 1px solid #4338ca;
  background: #fff;
  color: #4338ca;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
`;

const FloorNote = styled.span`
  display: inline-block;
  margin-left: 0.4rem;
  padding: 1px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
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
  color: #6b7280;
  margin-bottom: 0.3rem;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
  &:read-only {
    background: #f9fafb;
    color: #374151;
  }
`;

const DerivedValue = styled.div`
  padding: 0.55rem 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
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
  color: ${(p) => (p.$error ? "#dc2626" : "#059669")};
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
`;

const AddressText = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #111827;
  word-break: break-all;
`;

const AddrRemoveBtn = styled.button`
  flex-shrink: 0;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #fca5a5;
  background: #fff;
  color: #b91c1c;
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
  background: #fef3c7;
  color: #92400e;
  font-size: 0.76rem;
  font-weight: 600;
`;

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
  receiveWalletAddresses: string[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // 일정 확정 전 확인 단계 (P2P 판매 경험 체크)
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [p2pChecked, setP2pChecked] = useState(false);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (
    status: Miracle10Status,
    extra?: Record<string, unknown>,
  ) => {
    if (!data || (data.status === status && !extra) || saving) return;
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
        <StateBox $variant="loading">불러오는 중…</StateBox>
      </Page>
    );
  if (error)
    return (
      <Page>
        <StateBox $variant="error">{error}</StateBox>
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
      <BackLink href="/admin/miracle10">← 목록으로</BackLink>
      <Title>
        신청 #{data.id}{" "}
        <Badge $color={STATUS_COLORS[data.status]}>
          {STATUS_LABELS[data.status]}
        </Badge>
      </Title>

      <ActionCard>
        <SectionTitle>다음 액션</SectionTitle>

        {data.status === "PENDING" ? (
          <>
            <NextActionRow>
              <TelLinkBtn
                href={`tel:${data.customer.contact.replace(/[^+\d]/g, "")}`}
              >
                📞 {data.customer.contact}
              </TelLinkBtn>
              <PrimaryActionBtn
                disabled={saving}
                onClick={() => changeStatus("CONTACTED")}
              >
                연락 완료 처리
              </PrimaryActionBtn>
            </NextActionRow>
            <ActionHint>
              손님에게 전화로 연락한 뒤 「연락 완료 처리」를 눌러 다음 단계로
              넘겨주세요.
            </ActionHint>
          </>
        ) : null}

        {data.status === "CONTACTED" ? (
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
                onClick={() => {
                  if (window.confirm("거래 완료 처리하시겠습니까?")) {
                    changeStatus("COMPLETED");
                  }
                }}
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

        <ManualStatusDivider>상태 직접 변경</ManualStatusDivider>
        <StatusButtons>
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
      </ActionCard>

      <Card>
        <SectionTitle>신청인</SectionTitle>
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
      </Card>

      <Card>
        <SectionTitle>신청 내용</SectionTitle>
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
        {showScheduleEditor ? (
          <VisitScheduleEditor
            orderId={data.id}
            visitType={data.visitType}
            officeId={data.officeId}
            status={data.status}
            visitDate={data.visitDate}
            reservedStart={data.reservedStart}
            onSaved={load}
          />
        ) : (
          <>
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
        <Field>
          <Key>메모</Key>
          <Val>{data.memo || "-"}</Val>
        </Field>
      </Card>

      <DealRecordSection order={data} onSaved={load} />

      <Card>
        <SectionTitle>사전 파악</SectionTitle>
        <Field>
          <Key>USDT 필요</Key>
          <Val>{data.needUsdt || "-"}</Val>
        </Field>
        <Field>
          <Key>BMB 필요</Key>
          <Val>{data.needBmb || "-"}</Val>
        </Field>
        <Field>
          <Key>면대면 인증 필요</Key>
          <Val>{data.needFaceAuth || "-"}</Val>
        </Field>
      </Card>

      <Card>
        <SectionTitle>동의 / 접수</SectionTitle>
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
      </Card>
    </Page>
  );
}

interface VisitScheduleEditorProps {
  orderId: number;
  visitType: string | null;
  officeId: number | null;
  status: Miracle10Status;
  visitDate: string | null;
  reservedStart: string | null;
  onSaved: () => void;
}

function VisitScheduleEditor({
  orderId,
  visitType,
  officeId,
  status,
  visitDate,
  reservedStart,
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

  const hasChanges =
    draftDate !== (visitDate ?? "") ||
    draftStart !== (reservedStart ?? "") ||
    draftOfficeId !== officeId;

  const canSave =
    hasChanges &&
    activeOfficeId != null &&
    draftDate !== "" &&
    draftStart !== "";

  const saveSchedule = async () => {
    if (!canSave || saving || activeOfficeId == null) return;
    setSaving(true);
    setScheduleError(null);
    try {
      const payload: {
        visitDate: string;
        reservedStart: string;
        officeId: number;
      } = {
        visitDate: draftDate,
        reservedStart: draftStart,
        officeId: activeOfficeId,
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
              const showLastSpot = selectable && slot.remaining === 1;
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

      <SaveScheduleBtn type="button" disabled={!canSave || saving} onClick={saveSchedule}>
        {saving ? "저장 중…" : "일정 저장"}
      </SaveScheduleBtn>
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
  const [walletCountInput, setWalletCountInput] = useState(() =>
    String(order.paperWalletCount ?? defaultPaperWalletCount(initialQty)),
  );
  // 수령 지갑주소 — 여러 장(연속 스캔·직접 입력). dedup 키는 소문자 기준.
  const [addresses, setAddresses] = useState<string[]>(
    order.receiveWalletAddresses ?? [],
  );
  const addrKeysRef = useRef(
    new Set((order.receiveWalletAddresses ?? []).map(addressDedupKey)),
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
    setAddresses((prev) => [...prev, t]);
    return true;
  };

  const removeAddress = (addr: string) => {
    addrKeysRef.current.delete(addressDedupKey(addr));
    setAddresses((prev) => prev.filter((a) => a !== addr));
  };

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

  // 스캔 장수 ≠ 종이지갑 수량 — 참고 표시(강제 아님).
  const walletCountMismatch =
    walletCount != null &&
    walletCount > 0 &&
    addresses.length > 0 &&
    addresses.length !== walletCount;

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
          receiveWalletAddresses: addresses,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "저장 실패");
      }
      setSaveMsg({ text: "저장되었습니다." });
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
    <Card>
      <SectionTitle>거래 기록</SectionTitle>
      <SectionSub>
        평단가(호가 VWAP) 기준 + 마진 하한(10모당 3만원) 계산기입니다. 「계산
        결과 기입」 후 흥정에 맞게 단가를 수정하고 저장하세요.
      </SectionSub>

      <CalcBox>
        {calcLoading ? (
          <CalcRow>
            <span>시세 불러오는 중…</span>
          </CalcRow>
        ) : calcError ? (
          <CalcRow style={{ color: "#dc2626" }}>
            <span>{calcError}</span>
          </CalcRow>
        ) : calc ? (
          <CalcRow>
            <span>
              호가 평단가
              {calc.source === "ticker" ? " (현재가 대체)" : " (VWAP)"}
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
        <CalcRow style={{ alignItems: "center" }}>
          <span>
            <FieldLabel
              htmlFor="deal-usdt-krw"
              style={{ display: "inline", margin: 0, fontSize: "0.85rem", color: "#374151" }}
            >
              USDT 환율 (원)
            </FieldLabel>
            {usdtKrwOverride != null ? <FloorNote>수동</FloorNote> : null}
          </span>
          <TextInput
            id="deal-usdt-krw"
            style={{ width: "7rem", textAlign: "right" }}
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
            수령 지갑주소 ({addresses.length}개)
          </FieldLabel>
          {addresses.length > 0 ? (
            <AddressList>
              {addresses.map((a) => (
                <AddressRow key={addressDedupKey(a)}>
                  <AddressText>{a}</AddressText>
                  <AddrRemoveBtn type="button" onClick={() => removeAddress(a)}>
                    삭제
                  </AddrRemoveBtn>
                </AddressRow>
              ))}
            </AddressList>
          ) : null}
          {walletCountMismatch ? (
            <MismatchNote>
              참고: 주소 {addresses.length}개 · 종이지갑 {walletCount}장 —
              수량이 서로 다릅니다.
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
        {walletCount != null && walletCount > 0 ? (
          <SmallLinkBtn
            href={`/admin/wallet-inventory?type=OUT&orderId=${order.id}&count=${walletCount}&receiver=${encodeURIComponent(order.customer.name)}`}
            title="종이지갑 전달 후 재고 원장에 불출을 기록하세요 (자동 기록 아님)"
          >
            재고 불출 등록 →
          </SmallLinkBtn>
        ) : null}
        {saveMsg ? (
          <SaveMsg $error={saveMsg.error}>{saveMsg.text}</SaveMsg>
        ) : null}
      </RecordFootRow>
    </Card>
  );
}
