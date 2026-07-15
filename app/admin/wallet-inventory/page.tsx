"use client";

// 10모의 기적 지갑 재고 — 입고(IN)/불출(OUT) 원장 + 발주(ORDER, 입고 예정).
// ★ 발주는 재고(stock=IN−OUT)에 미반영 — 수령 확인 시 IN으로 반영.
// 입고·수령 확인 시 지갑 QR 연속 스캔으로 주소 기록(스캔 수 = 실수량 기본값).

import { Suspense, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { todayKst } from "@/lib/kst";
import { adminColors } from "@/components/admin/ui";
import {
  EmptyState,
  ErrorState,
  RefreshingBar,
  Skeleton,
} from "@/components/admin/States";
import { fetchAdminJson, invalidate, useAdminData } from "@/lib/admin-data";
import {
  DASHBOARD_KEY,
  INVENTORY_KEY,
  INVENTORY_TTL,
  STATS_KEY,
  STATS_TTL,
  inventoryFetcher,
  statsFetcher,
  type AdminStatsData,
} from "@/lib/admin-fetchers";
import { WalletQrScanner } from "@/app/scanner/page/components/WalletQrScanner";
import { addressDedupKey } from "@/app/scanner/lib/utils";

const Page = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1rem 1.5rem;

  @media (min-width: 768px) {
    padding: 0 1.5rem 2rem;
  }
`;

/* ── 상단 요약 ── */

const SummaryCard = styled.section<{ $warn: boolean }>`
  border: 1px solid
    ${(p) => (p.$warn ? adminColors.dangerBorder : adminColors.border)};
  border-radius: 14px;
  background: ${adminColors.white};
  padding: 1.1rem 1.25rem;
  margin-bottom: 1.25rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const SummaryLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
`;

const SummaryValue = styled.span<{ $tone?: "primary" | "danger" | "order" }>`
  font-size: 1.45rem;
  font-weight: 800;
  color: ${(p) =>
    p.$tone === "danger"
      ? adminColors.danger
      : p.$tone === "order"
        ? adminColors.alertTextStrong
        : p.$tone === "primary"
          ? adminColors.primary
          : adminColors.text};
`;

const SummarySub = styled.span`
  font-size: 0.74rem;
  color: ${adminColors.textMuted};
`;

const ShortageBanner = styled.p`
  margin: 0.85rem 0 0;
  padding: 0.55rem 0.8rem;
  border: 1px solid ${adminColors.dangerBorder};
  border-radius: 8px;
  background: ${adminColors.dangerSoft};
  color: ${adminColors.dangerTextStrong};
  font-size: 0.82rem;
  font-weight: 700;
`;

/* ── 등록 폼 ── */

const Card = styled.section`
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

const TypeToggle = styled.div`
  display: inline-flex;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.9rem;
`;

/* 흐름 안내 — 발주→수령 확인 순서 */
const FlowHint = styled.p`
  margin: 0 0 1rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid ${adminColors.primaryBorder};
  border-radius: 8px;
  background: ${adminColors.primarySoft};
  color: ${adminColors.primary};
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.5;
`;

/* 수동 조정 접기 */
const ManualCollapse = styled.div`
  margin-top: 1rem;
  border-top: 1px dashed ${adminColors.border};
  padding-top: 0.75rem;
`;

const ManualToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.3rem 0;
  border: none;
  background: none;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
  cursor: pointer;
  text-align: left;

  &:hover {
    color: ${adminColors.textSub};
  }
`;

const ManualBody = styled.div`
  margin-top: 0.6rem;
`;

const ManualNote = styled.p`
  margin: 0 0 0.7rem;
  font-size: 0.78rem;
  color: ${adminColors.textMuted};
  line-height: 1.5;
`;

const TypeBtn = styled.button<{ $active: boolean; $tone: "in" | "out" | "order" }>`
  padding: 0.5rem 1rem;
  border: none;
  background: ${(p) =>
    p.$active
      ? p.$tone === "out"
        ? adminColors.dangerText
        : p.$tone === "order"
          ? adminColors.alert
          : adminColors.primary
      : adminColors.white};
  color: ${(p) => (p.$active ? adminColors.white : adminColors.textSub)};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;

  &:not(:last-child) {
    border-right: 1px solid ${adminColors.borderInput};
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
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
`;

const SubmitBtn = styled.button`
  margin-top: 0.9rem;
  padding: 0.6rem 1.4rem;
  border-radius: 10px;
  border: none;
  background: ${adminColors.primary};
  color: ${adminColors.white};
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const FormMsg = styled.span<{ $error?: boolean }>`
  margin-left: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${(p) => (p.$error ? adminColors.danger : adminColors.successStrong)};
`;

/* ── 스캔 ── */

const ScanToggleBtn = styled.button`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid ${adminColors.primary};
  background: ${adminColors.white};
  color: ${adminColors.primary};
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
`;

const ScanCountNote = styled.p<{ $warn?: boolean }>`
  margin: 0.4rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: ${(p) => (p.$warn ? adminColors.danger : adminColors.textMuted)};
`;

const ScanAddrList = styled.ul`
  list-style: none;
  margin: 0.4rem 0 0;
  padding: 0;
  max-height: 8rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const ScanAddrItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: ${adminColors.textSub};
  word-break: break-all;

  button {
    flex-shrink: 0;
    padding: 0 0.4rem;
    border: 1px solid ${adminColors.dangerBorder};
    border-radius: 4px;
    background: ${adminColors.white};
    color: ${adminColors.danger};
    font-size: 0.68rem;
    cursor: pointer;
  }
`;

/* ── 원장 ── */

const LedgerTable = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  overflow: hidden;
`;

const LedgerHead = styled.div`
  display: grid;
  grid-template-columns: 88px 84px 1fr 96px 130px;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  background: ${adminColors.bgSubtle};
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.textMuted};

  @media (max-width: 640px) {
    grid-template-columns: 78px 72px 1fr 96px;
  }
`;

const LedgerRow = styled.div<{
  $pendingOrder?: boolean;
  $muted?: boolean;
  $order?: boolean;
}>`
  display: grid;
  grid-template-columns: 88px 84px 1fr 96px 130px;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border-top: 1px solid ${adminColors.rowDivider};
  font-size: 0.82rem;
  color: ${adminColors.text};
  align-items: center;
  ${(p) =>
    p.$pendingOrder
      ? `
  background: ${adminColors.alertSoft};
  border-top: 1px dashed ${adminColors.alertBorder};
  `
      : ""}
  ${(p) => (p.$muted ? "opacity: 0.55;" : "")}

  @media (max-width: 640px) {
    grid-template-columns: 78px 72px 1fr 96px;

    /* 발주(ORDER) 행 — 2단 세로 배치(버튼이 내용을 덮지 않게). 자식 순서:
       1 날짜 · 2 배지 · 3 내용 · 4 담당(숨김) · 5 버튼 */
    ${(p) =>
      p.$order
        ? `
    grid-template-columns: 76px 1fr;
    row-gap: 0.45rem;
    align-items: center;

    & > *:nth-child(1) { grid-column: 1; grid-row: 1; }
    & > *:nth-child(2) { grid-column: 2; grid-row: 1; justify-self: start; }
    & > *:nth-child(3) {
      grid-column: 1 / -1;
      grid-row: 2;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
    }
    & > *:nth-child(5) { grid-column: 1 / -1; grid-row: 3; justify-content: flex-end; }
    `
        : ""}
  }
`;

const TypeTag = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  white-space: nowrap;
  color: ${(p) =>
    p.$type === "OUT"
      ? adminColors.dangerText
      : p.$type === "ORDER"
        ? adminColors.alertTextStrong
        : "#047857"};
  background: ${(p) =>
    p.$type === "OUT"
      ? adminColors.dangerSoft
      : p.$type === "ORDER"
        ? adminColors.alertSoft
        : "#ecfdf5"};
  border: 1px ${(p) => (p.$type === "ORDER" ? "dashed" : "solid")}
    ${(p) =>
      p.$type === "OUT"
        ? adminColors.dangerBorder
        : p.$type === "ORDER"
          ? adminColors.alertBorder
          : "#a7f3d0"};
`;

const RowDetail = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  a {
    color: ${adminColors.primary};
    font-weight: 600;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const AdminCell = styled.span`
  font-size: 0.75rem;
  color: ${adminColors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 640px) {
    display: none;
  }
`;

const RowActions = styled.span`
  display: inline-flex;
  gap: 0.35rem;
  justify-content: flex-end;
`;

const MiniBtn = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  padding: 0.28rem 0.6rem;
  border-radius: 6px;
  border: 1px solid
    ${(p) =>
      p.$primary
        ? adminColors.primary
        : p.$danger
          ? adminColors.dangerBorder
          : adminColors.borderInput};
  background: ${(p) => (p.$primary ? adminColors.primary : adminColors.white)};
  color: ${(p) =>
    p.$primary ? adminColors.white : p.$danger ? adminColors.dangerText : adminColors.textSub};
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── 수령 확인 모달 ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
`;

const Modal = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${adminColors.white};
  border-radius: 14px;
  padding: 1.25rem 1.4rem;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 800;
  color: ${adminColors.text};
`;

const ModalSub = styled.p`
  margin: 0 0 0.9rem;
  font-size: 0.8rem;
  color: ${adminColors.textMuted};
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
`;

interface Totals {
  inTotal: number;
  outTotal: number;
  stock: number;
  onOrder: number;
}

interface Entry {
  id: number;
  createdAt: string;
  type: string;
  count: number;
  entryDate: string;
  memo: string | null;
  adminName: string;
  orderId: number | null;
  receiverName: string | null;
  status: string | null;
  expectedDate: string | null;
  linkedLedgerId: number | null;
  walletAddresses: string[] | null;
}

interface InventoryData {
  totals: Totals;
  entries: Entry[];
}

type FormType = "IN" | "OUT" | "ORDER";

function fmtExpected(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 액션 후 캐시 무효화 — 재고·집계·대시보드 (invalidate 매핑 표 준수) */
function invalidateInventory() {
  invalidate(INVENTORY_KEY);
  invalidate(STATS_KEY);
  invalidate(DASHBOARD_KEY);
}

/** 스캔 주소 수집 훅 대용 — dedup 키 기준 누적 */
function useScannedAddresses() {
  const [addrs, setAddrs] = useState<string[]>([]);
  const keysRef = useRef(new Set<string>());
  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    const key = addressDedupKey(t);
    if (keysRef.current.has(key)) return;
    keysRef.current.add(key);
    setAddrs((prev) => [...prev, t]);
  };
  const remove = (addr: string) => {
    keysRef.current.delete(addressDedupKey(addr));
    setAddrs((prev) => prev.filter((a) => a !== addr));
  };
  const clear = () => {
    keysRef.current.clear();
    setAddrs([]);
  };
  return { addrs, add, remove, clear };
}

function WalletInventoryPageInner() {
  const searchParams = useSearchParams();

  const inventory = useAdminData<InventoryData>(
    INVENTORY_KEY,
    inventoryFetcher as unknown as () => Promise<InventoryData>,
    { ttl: INVENTORY_TTL },
  );
  const statsData = useAdminData<AdminStatsData>(STATS_KEY, statsFetcher, {
    ttl: STATS_TTL,
  });

  // 등록 폼 — 기본 [발주 등록]. 10모 상세 「재고 불출 등록 →」(?type=OUT) 등 프리필 진입 지원.
  const initialType = searchParams.get("type");
  const [type, setType] = useState<FormType>(
    initialType === "OUT" ? "OUT" : initialType === "IN" ? "IN" : "ORDER",
  );
  // ?type=OUT/IN 으로 오면 수동 조정을 자동으로 열어 불출/입고 폼을 바로 보여준다.
  const [manualOpen, setManualOpen] = useState(
    initialType === "OUT" || initialType === "IN",
  );
  // 수동 조정 열기/닫기 — 닫으면 기본(발주)로 복귀, 열면 입고 모드로 시작.
  const toggleManual = () => {
    setManualOpen((open) => {
      const next = !open;
      if (next && type === "ORDER") setType("IN");
      if (!next) setType("ORDER");
      return next;
    });
  };
  const [countInput, setCountInput] = useState(searchParams.get("count") ?? "");
  const [dateInput, setDateInput] = useState(todayKst());
  const [expectedInput, setExpectedInput] = useState("");
  const [memoInput, setMemoInput] = useState("");
  const [orderIdInput, setOrderIdInput] = useState(
    searchParams.get("orderId") ?? "",
  );
  const [receiverInput, setReceiverInput] = useState(
    searchParams.get("receiver") ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // IN 직접 등록 스캔
  const inScan = useScannedAddresses();
  const [inScanOpen, setInScanOpen] = useState(false);

  // 수령 확인 모달 — 대상 발주 + 실수량 + 스캔
  const [receiveTarget, setReceiveTarget] = useState<Entry | null>(null);
  const [receiveCount, setReceiveCount] = useState("");
  const receiveScan = useScannedAddresses();
  const [receiveScanOpen, setReceiveScanOpen] = useState(false);
  // 스캔 수 자동 반영 후 수동으로 덮어썼는지
  const receiveCountTouched = useRef(false);

  const count = (() => {
    const n = Number(countInput.trim());
    return Number.isInteger(n) && n > 0 ? n : null;
  })();

  // IN: 스캔 수 = 장수 기본값 (수동 입력이 있으면 그대로 두고 경고만)
  const inScanMismatch =
    type === "IN" &&
    inScan.addrs.length > 0 &&
    count != null &&
    count !== inScan.addrs.length;

  const handleInScanDetected = (addr: string) => {
    inScan.add(addr);
  };

  // 스캔이 쌓이면 장수 입력이 비어있을 때 자동 채움
  if (type === "IN" && inScan.addrs.length > 0 && countInput.trim() === "") {
    setCountInput(String(inScan.addrs.length));
  }

  const submit = async () => {
    if (count == null || submitting) return;
    setSubmitting(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/admin/wallet-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          count,
          entryDate: dateInput,
          memo: memoInput.trim() || null,
          ...(type === "OUT"
            ? {
                orderId: orderIdInput.trim() || null,
                receiverName: receiverInput.trim() || null,
              }
            : {}),
          ...(type === "ORDER"
            ? { expectedDate: expectedInput || null }
            : {}),
          ...(type === "IN" && inScan.addrs.length > 0
            ? { walletAddresses: inScan.addrs }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "등록 실패");
      }
      const label =
        type === "IN" ? "입고" : type === "OUT" ? "불출" : "발주";
      setFormMsg({ text: `${label} ${count}장 등록되었습니다.` });
      setCountInput("");
      setMemoInput("");
      setExpectedInput("");
      setOrderIdInput("");
      setReceiverInput("");
      inScan.clear();
      setInScanOpen(false);
      invalidateInventory();
    } catch (e) {
      setFormMsg({
        text: e instanceof Error ? e.message : "등록에 실패했습니다.",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openReceive = (entry: Entry) => {
    setReceiveTarget(entry);
    setReceiveCount(String(entry.count));
    receiveScan.clear();
    setReceiveScanOpen(false);
    receiveCountTouched.current = false;
  };

  const handleReceiveScanDetected = (addr: string) => {
    receiveScan.add(addr);
  };

  // 스캔 수 = 실수량 자동 반영 (수동으로 만지지 않은 동안)
  if (
    receiveTarget &&
    receiveScan.addrs.length > 0 &&
    !receiveCountTouched.current &&
    receiveCount !== String(receiveScan.addrs.length)
  ) {
    setReceiveCount(String(receiveScan.addrs.length));
  }

  const receiveMismatch =
    receiveScan.addrs.length > 0 &&
    Number(receiveCount.trim()) !== receiveScan.addrs.length;

  const confirmReceive = async () => {
    if (!receiveTarget || busyId != null) return;
    const n = Number(receiveCount.trim());
    if (!Number.isInteger(n) || n <= 0) return;
    setBusyId(receiveTarget.id);
    try {
      const res = await fetch(
        `/api/admin/wallet-inventory/${receiveTarget.id}/receive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            count: n,
            ...(receiveScan.addrs.length > 0
              ? { walletAddresses: receiveScan.addrs }
              : {}),
          }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "입고 확정 실패");
      }
      setReceiveTarget(null);
      receiveScan.clear();
      invalidateInventory();
    } catch (e) {
      alert(e instanceof Error ? e.message : "입고 확정에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const cancelOrder = async (entry: Entry) => {
    if (busyId != null) return;
    if (!window.confirm(`발주 #${entry.id} (${entry.count}장)를 취소할까요?`)) {
      return;
    }
    setBusyId(entry.id);
    try {
      const res = await fetch(`/api/admin/wallet-inventory/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELED" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "취소 실패");
      invalidateInventory();
    } catch (e) {
      alert(e instanceof Error ? e.message : "취소에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const unreceiveOrder = async (entry: Entry) => {
    if (busyId != null) return;
    if (
      !window.confirm(
        `발주 #${entry.id} 수령을 취소할까요?\n\n연결된 입고(+${entry.count}장) 원장이 삭제되고 발주가 「수령 대기(PENDING)」로 되돌아갑니다.`,
      )
    ) {
      return;
    }
    setBusyId(entry.id);
    try {
      const res = await fetch(
        `/api/admin/wallet-inventory/${entry.id}/unreceive`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "수령 취소 실패");
      invalidateInventory();
    } catch (e) {
      alert(e instanceof Error ? e.message : "수령 취소에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const removeEntry = async (id: number) => {
    if (busyId != null) return;
    if (!window.confirm(`기록 #${id}을 삭제할까요? 재고에 바로 반영됩니다.`)) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/wallet-inventory/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "삭제 실패");
      }
      invalidateInventory();
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  if (inventory.isLoading) {
    return (
      <Page>
        <Skeleton variant="stat" count={3} />
        <div style={{ height: "1rem" }} />
        <Skeleton variant="table" count={5} />
      </Page>
    );
  }
  if (inventory.error && !inventory.data) {
    return (
      <Page>
        <ErrorState
          message={
            inventory.error instanceof Error
              ? inventory.error.message
              : undefined
          }
          onRetry={inventory.refresh}
        />
      </Page>
    );
  }

  const totals = inventory.data?.totals ?? null;
  const entries = inventory.data?.entries ?? [];
  const reserved = statsData.data?.wallet?.reserved ?? null;

  const stock = totals?.stock ?? 0;
  const onOrder = totals?.onOrder ?? 0;
  const shortage = reserved != null ? stock - reserved : null;
  const pendingOrders = entries.filter(
    (en) => en.type === "ORDER" && en.status === "PENDING",
  );
  const restEntries = entries.filter(
    (en) => !(en.type === "ORDER" && en.status === "PENDING"),
  );
  const nextExpected = pendingOrders
    .map((o) => o.expectedDate)
    .filter(Boolean)
    .sort()[0];

  return (
    <Page>
      <RefreshingBar
        active={inventory.isValidating && inventory.data != null}
      />

      <SummaryCard $warn={shortage != null && shortage < 0}>
        <SummaryGrid>
          <SummaryItem>
            <SummaryLabel>가용 재고</SummaryLabel>
            <SummaryValue $tone="primary">{stock}장</SummaryValue>
            <SummarySub>입고 {totals?.inTotal ?? 0} − 불출 {totals?.outTotal ?? 0}</SummarySub>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>확정 예약 소요</SummaryLabel>
            <SummaryValue>{reserved ?? "—"}장</SummaryValue>
            <SummarySub>확정 건 소요 = 준비 장수(손님 보유분 차감)</SummarySub>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>발주 중 (재고 미반영)</SummaryLabel>
            <SummaryValue $tone={onOrder > 0 ? "order" : undefined}>
              {onOrder}장
            </SummaryValue>
            <SummarySub>
              {onOrder > 0
                ? `수령 확인 시 입고 반영${nextExpected ? ` · 예상 ${fmtExpected(nextExpected)}` : ""}`
                : "진행 중인 발주 없음"}
            </SummarySub>
          </SummaryItem>
        </SummaryGrid>
        {shortage != null && shortage < 0 ? (
          <ShortageBanner role="alert">
            ⚠ 부족 {Math.abs(shortage)}장 — 확정 예약을 모두 소화하기에 재고가
            모자랍니다.{onOrder > 0 ? ` (발주 ${onOrder}장 수령 대기 중)` : " 발주가 필요합니다."}
          </ShortageBanner>
        ) : null}
      </SummaryCard>

      <Card>
        <SectionTitle>
          {type === "IN"
            ? "입고 등록 (수동)"
            : type === "OUT"
              ? "불출 등록 (수동)"
              : "발주 등록"}
        </SectionTitle>
        {type === "ORDER" ? (
          <FlowHint>
            지갑이 부족하면 [발주 등록] → 도착 시 발주 내역의 [수령 확인]을 누르면
            재고에 반영됩니다.
          </FlowHint>
        ) : null}

        <FormGrid>
          <div>
            <FieldLabel htmlFor="inv-count">장수</FieldLabel>
            <TextInput
              id="inv-count"
              inputMode="numeric"
              value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              placeholder="예: 22"
            />
            {inScanMismatch ? (
              <ScanCountNote $warn>
                ⚠ 스캔 {inScan.addrs.length}개 ≠ 입력 {count}장 — 스캔 수와
                다릅니다 (등록은 가능).
              </ScanCountNote>
            ) : null}
          </div>
          <div>
            <FieldLabel htmlFor="inv-date">
              {type === "ORDER" ? "발주일 (KST)" : "날짜 (KST)"}
            </FieldLabel>
            <TextInput
              id="inv-date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </div>
          {type === "ORDER" ? (
            <div>
              <FieldLabel htmlFor="inv-expected">예상 도착일 (선택)</FieldLabel>
              <TextInput
                id="inv-expected"
                type="date"
                value={expectedInput}
                onChange={(e) => setExpectedInput(e.target.value)}
              />
            </div>
          ) : null}
          {type === "OUT" ? (
            <>
              <div>
                <FieldLabel htmlFor="inv-order">
                  수령 신청 번호 (10모 · 선택)
                </FieldLabel>
                <TextInput
                  id="inv-order"
                  inputMode="numeric"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  placeholder="예: 12 — 연결 시 수령자 자동 기입"
                />
              </div>
              <div>
                <FieldLabel htmlFor="inv-receiver">수령자 (선택)</FieldLabel>
                <TextInput
                  id="inv-receiver"
                  value={receiverInput}
                  onChange={(e) => setReceiverInput(e.target.value)}
                  placeholder="신청 연결 시 비워도 됩니다"
                />
              </div>
            </>
          ) : null}
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldLabel htmlFor="inv-memo">메모 (선택)</FieldLabel>
            <TextInput
              id="inv-memo"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              placeholder={
                type === "IN"
                  ? "예: 직접 구입 입고"
                  : type === "OUT"
                    ? "예: 현장 수령"
                    : "예: 2차 제작 22장 발주"
              }
            />
          </div>
          {type === "IN" ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>지갑 주소 스캔 (선택 — 입고분 기록)</FieldLabel>
              <ScanToggleBtn
                type="button"
                onClick={() => setInScanOpen((o) => !o)}
              >
                {inScanOpen ? "스캔 닫기" : `QR 연속 스캔 (${inScan.addrs.length})`}
              </ScanToggleBtn>
              {inScanOpen ? (
                <div style={{ marginTop: "0.5rem" }}>
                  <WalletQrScanner
                    paused={false}
                    continuous
                    onDetected={handleInScanDetected}
                    idleHint="입고할 종이지갑 QR을 연속 스캔하세요. 스캔 수가 장수 기본값이 됩니다."
                  />
                </div>
              ) : null}
              {inScan.addrs.length > 0 ? (
                <ScanAddrList>
                  {inScan.addrs.map((a) => (
                    <ScanAddrItem key={addressDedupKey(a)}>
                      <span style={{ flex: 1 }}>{a}</span>
                      <button type="button" onClick={() => inScan.remove(a)}>
                        ×
                      </button>
                    </ScanAddrItem>
                  ))}
                </ScanAddrList>
              ) : null}
            </div>
          ) : null}
        </FormGrid>

        <div>
          <SubmitBtn
            type="button"
            disabled={count == null || submitting}
            onClick={submit}
          >
            {submitting
              ? "등록 중…"
              : type === "IN"
                ? "입고 등록"
                : type === "OUT"
                  ? "불출 등록"
                  : "발주 등록"}
          </SubmitBtn>
          {formMsg ? (
            <FormMsg $error={formMsg.error}>{formMsg.text}</FormMsg>
          ) : null}
        </div>

        <ManualCollapse>
          <ManualToggle
            type="button"
            onClick={toggleManual}
            aria-expanded={manualOpen}
          >
            {manualOpen ? "▾" : "▸"} 수동 조정 (직접 입고·불출)
          </ManualToggle>
          {manualOpen ? (
            <ManualBody>
              <ManualNote>
                발주 없이 직접 입고하거나 수동 불출할 때만 사용하세요.
              </ManualNote>
              <TypeToggle role="group" aria-label="수동 조정 구분">
                <TypeBtn
                  type="button"
                  $active={type === "IN"}
                  $tone="in"
                  onClick={() => setType("IN")}
                >
                  입고 (+)
                </TypeBtn>
                <TypeBtn
                  type="button"
                  $active={type === "OUT"}
                  $tone="out"
                  onClick={() => setType("OUT")}
                >
                  불출 (−)
                </TypeBtn>
              </TypeToggle>
            </ManualBody>
          ) : null}
        </ManualCollapse>
      </Card>

      <SectionTitle as="h2" style={{ margin: "0 0 0.6rem" }}>
        원장 (최근 200건)
      </SectionTitle>
      {entries.length === 0 ? (
        <EmptyState
          icon="📦"
          title="기록이 없습니다"
          desc="위에서 입고·발주를 등록하면 원장에 쌓입니다."
        />
      ) : (
        <LedgerTable>
          <LedgerHead>
            <span>날짜</span>
            <span>구분</span>
            <span>내용</span>
            <AdminCell as="span" style={{ display: "block" }}>
              담당
            </AdminCell>
            <span></span>
          </LedgerHead>
          {/* 진행 중 발주 — 상단 고정 + 구분 스타일 */}
          {pendingOrders.map((en) => (
            <LedgerRow key={en.id} $pendingOrder $order>
              <span>{en.entryDate}</span>
              <TypeTag $type="ORDER">발주 {en.count}장</TypeTag>
              <RowDetail
                title={[en.memo, en.expectedDate ? `예상 ${fmtExpected(en.expectedDate)}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              >
                {en.expectedDate ? `예상 도착 ${fmtExpected(en.expectedDate)}` : "도착일 미정"}
                {en.memo ? ` · ${en.memo}` : ""}
              </RowDetail>
              <AdminCell>{en.adminName}</AdminCell>
              <RowActions>
                <MiniBtn
                  type="button"
                  $primary
                  disabled={busyId != null}
                  onClick={() => openReceive(en)}
                >
                  수령 확인
                </MiniBtn>
                <MiniBtn
                  type="button"
                  $danger
                  disabled={busyId != null}
                  onClick={() => cancelOrder(en)}
                >
                  취소
                </MiniBtn>
              </RowActions>
            </LedgerRow>
          ))}
          {restEntries.map((en) => {
            const isOrder = en.type === "ORDER";
            const scanned = en.walletAddresses?.length ?? 0;
            return (
              <LedgerRow key={en.id} $muted={isOrder} $order={isOrder}>
                <span>{en.entryDate}</span>
                <TypeTag $type={en.type}>
                  {en.type === "IN"
                    ? `+${en.count}장`
                    : en.type === "OUT"
                      ? `−${en.count}장`
                      : `발주 ${en.count}장`}
                </TypeTag>
                <RowDetail
                  title={[
                    en.receiverName ? `수령: ${en.receiverName}` : null,
                    en.memo,
                    scanned > 0 ? `주소 ${scanned}개 기록됨` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  {isOrder ? (
                    <span>
                      {en.status === "RECEIVED" ? "입고 완료" : "취소됨"}
                      {en.linkedLedgerId != null
                        ? ` (입고 #${en.linkedLedgerId})`
                        : ""}
                      {en.memo ? ` · ${en.memo}` : ""}
                    </span>
                  ) : (
                    <>
                      {en.orderId != null ? (
                        <Link href={`/admin/miracle10/${en.orderId}`}>
                          #{en.orderId}
                        </Link>
                      ) : null}
                      {en.orderId != null && (en.receiverName || en.memo)
                        ? " "
                        : ""}
                      {en.receiverName ? `${en.receiverName} 수령` : ""}
                      {en.receiverName && en.memo ? " · " : ""}
                      {en.memo ?? ""}
                      {scanned > 0 ? ` · 주소 ${scanned}개` : ""}
                      {!en.orderId && !en.receiverName && !en.memo && !scanned
                        ? "—"
                        : ""}
                    </>
                  )}
                </RowDetail>
                <AdminCell>{en.adminName}</AdminCell>
                <RowActions>
                  {isOrder && en.status === "RECEIVED" ? (
                    <MiniBtn
                      type="button"
                      $danger
                      disabled={busyId != null}
                      onClick={() => unreceiveOrder(en)}
                    >
                      수령 취소
                    </MiniBtn>
                  ) : null}
                  {!isOrder ? (
                    <MiniBtn
                      type="button"
                      $danger
                      disabled={busyId != null}
                      onClick={() => removeEntry(en.id)}
                    >
                      삭제
                    </MiniBtn>
                  ) : null}
                </RowActions>
              </LedgerRow>
            );
          })}
        </LedgerTable>
      )}

      {receiveTarget ? (
        <Overlay onClick={() => busyId == null && setReceiveTarget(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>발주 수령 확인</ModalTitle>
            <ModalSub>
              발주 #{receiveTarget.id} · {receiveTarget.count}장. 지갑 QR을
              연속 스캔하면 <strong>스캔 수가 실수량으로 자동 반영</strong>
              됩니다. 확인 시 입고(IN)로 재고에 반영됩니다.
            </ModalSub>

            <ScanToggleBtn
              type="button"
              onClick={() => setReceiveScanOpen((o) => !o)}
            >
              {receiveScanOpen
                ? "스캔 닫기"
                : `QR 연속 스캔 (${receiveScan.addrs.length})`}
            </ScanToggleBtn>
            {receiveScanOpen ? (
              <div style={{ marginTop: "0.5rem" }}>
                <WalletQrScanner
                  paused={false}
                  continuous
                  onDetected={handleReceiveScanDetected}
                  idleHint="수령한 종이지갑 QR을 연속 스캔하세요. 중복은 무시됩니다."
                />
              </div>
            ) : null}
            {receiveScan.addrs.length > 0 ? (
              <ScanAddrList>
                {receiveScan.addrs.map((a) => (
                  <ScanAddrItem key={addressDedupKey(a)}>
                    <span style={{ flex: 1 }}>{a}</span>
                    <button type="button" onClick={() => receiveScan.remove(a)}>
                      ×
                    </button>
                  </ScanAddrItem>
                ))}
              </ScanAddrList>
            ) : null}

            <div style={{ marginTop: "0.8rem" }}>
              <FieldLabel htmlFor="receive-count">실수령 장수</FieldLabel>
              <TextInput
                id="receive-count"
                inputMode="numeric"
                value={receiveCount}
                onChange={(e) => {
                  receiveCountTouched.current = true;
                  setReceiveCount(e.target.value);
                }}
              />
              {receiveMismatch ? (
                <ScanCountNote $warn>
                  ⚠ 스캔 {receiveScan.addrs.length}개 ≠ 입력 {receiveCount}장 —
                  수량이 다릅니다 (진행은 가능).
                </ScanCountNote>
              ) : receiveScan.addrs.length > 0 ? (
                <ScanCountNote>
                  스캔 {receiveScan.addrs.length}개 = 실수량으로 반영됩니다.
                </ScanCountNote>
              ) : null}
            </div>

            <ModalActions>
              <MiniBtn
                type="button"
                disabled={busyId != null}
                onClick={() => setReceiveTarget(null)}
              >
                닫기
              </MiniBtn>
              <MiniBtn
                type="button"
                $primary
                disabled={
                  busyId != null ||
                  !Number.isInteger(Number(receiveCount.trim())) ||
                  Number(receiveCount.trim()) <= 0
                }
                onClick={confirmReceive}
              >
                {busyId != null ? "처리 중…" : "수령 확인 (입고 반영)"}
              </MiniBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      ) : null}
    </Page>
  );
}

export default function WalletInventoryPage() {
  return (
    <Suspense
      fallback={
        <Page>
          <Skeleton variant="stat" count={3} />
        </Page>
      }
    >
      <WalletInventoryPageInner />
    </Suspense>
  );
}
