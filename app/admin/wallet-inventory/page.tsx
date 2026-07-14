"use client";

// 10모의 기적 지갑 재고 — 입고(IN)/불출(OUT) 원장 + 발주(ORDER, 입고 예정).
// ★ 발주는 재고(stock=IN−OUT)에 반영되지 않는 기록 — 중복 발주 방지용. 수령 확인 시 IN으로 반영.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { todayKst } from "@/lib/kst";
import { StateBox, adminColors } from "@/components/admin/ui";

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
  background: #fff;
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
  background: #fff;
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

const TypeBtn = styled.button<{ $active: boolean; $tone: "in" | "out" | "order" }>`
  padding: 0.5rem 1rem;
  border: none;
  background: ${(p) =>
    p.$active
      ? p.$tone === "out"
        ? "#b91c1c"
        : p.$tone === "order"
          ? adminColors.alert
          : adminColors.primary
      : "#fff"};
  color: ${(p) => (p.$active ? "#fff" : adminColors.textSub)};
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
  background: #fff;
`;

const SubmitBtn = styled.button`
  margin-top: 0.9rem;
  padding: 0.6rem 1.4rem;
  border-radius: 10px;
  border: none;
  background: ${adminColors.primary};
  color: #fff;
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
  color: ${(p) => (p.$error ? adminColors.danger : "#059669")};
`;

/* ── 원장 ── */

const LedgerTable = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: #fff;
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

const LedgerRow = styled.div<{ $pendingOrder?: boolean; $muted?: boolean }>`
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
  }
`;

const TypeTag = styled.span<{ $type: string; $muted?: boolean }>`
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  white-space: nowrap;
  color: ${(p) =>
    p.$type === "OUT"
      ? "#b91c1c"
      : p.$type === "ORDER"
        ? adminColors.alertTextStrong
        : "#047857"};
  background: ${(p) =>
    p.$type === "OUT"
      ? "#fef2f2"
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
  background: ${(p) => (p.$primary ? adminColors.primary : "#fff")};
  color: ${(p) =>
    p.$primary ? "#fff" : p.$danger ? "#b91c1c" : adminColors.textSub};
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
`;

const Modal = styled.div`
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 14px;
  padding: 1.25rem 1.4rem;
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
}

type FormType = "IN" | "OUT" | "ORDER";

function fmtExpected(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function WalletInventoryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [reserved, setReserved] = useState<number | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 등록 폼 — 10모 상세에서 ?type=OUT&orderId=&count=&receiver= 프리필 진입 지원.
  const initialType = searchParams.get("type");
  const [type, setType] = useState<FormType>(
    initialType === "OUT" ? "OUT" : initialType === "ORDER" ? "ORDER" : "IN",
  );
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

  // 수령 확인 모달 — 대상 발주 + 실수량
  const [receiveTarget, setReceiveTarget] = useState<Entry | null>(null);
  const [receiveCount, setReceiveCount] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const [invRes, statsRes] = await Promise.all([
        fetch("/api/admin/wallet-inventory"),
        fetch("/api/admin/stats"),
      ]);
      if (invRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      const inv = await invRes.json();
      if (!invRes.ok || !inv.ok) {
        throw new Error(inv.error || "재고를 불러오지 못했습니다.");
      }
      setTotals(inv.totals);
      setEntries(inv.entries);
      const stats = statsRes.ok ? await statsRes.json() : null;
      if (stats?.ok) setReserved(stats.stats?.wallet?.reserved ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const count = (() => {
    const n = Number(countInput.trim());
    return Number.isInteger(n) && n > 0 ? n : null;
  })();

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
      await load();
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
  };

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
          body: JSON.stringify({ count: n }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "입고 확정 실패");
      }
      setReceiveTarget(null);
      await load();
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
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "취소에 실패했습니다.");
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
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading)
    return (
      <Page>
        <StateBox $variant="loading">불러오는 중…</StateBox>
      </Page>
    );

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
      {error ? <StateBox $variant="error">{error}</StateBox> : null}

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
            <SummarySub>확정(VERIFIED) 건이 전부 나가면 필요한 장수</SummarySub>
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
        <SectionTitle>입고 / 불출 / 발주 등록</SectionTitle>
        <TypeToggle role="group" aria-label="기록 구분">
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
          <TypeBtn
            type="button"
            $active={type === "ORDER"}
            $tone="order"
            onClick={() => setType("ORDER")}
          >
            발주 (예정)
          </TypeBtn>
        </TypeToggle>

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
      </Card>

      <SectionTitle as="h2" style={{ margin: "0 0 0.6rem" }}>
        원장 (최근 200건)
      </SectionTitle>
      {entries.length === 0 ? (
        <StateBox $variant="empty">기록이 없습니다.</StateBox>
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
            <LedgerRow key={en.id} $pendingOrder>
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
            return (
              <LedgerRow key={en.id} $muted={isOrder}>
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
                      {!en.orderId && !en.receiverName && !en.memo ? "—" : ""}
                    </>
                  )}
                </RowDetail>
                <AdminCell>{en.adminName}</AdminCell>
                <RowActions>
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
              발주 #{receiveTarget.id} · {receiveTarget.count}장. 실제 수령한
              장수를 입력하세요 — 확인 시 입고(IN)로 재고에 반영됩니다.
            </ModalSub>
            <FieldLabel htmlFor="receive-count">실수령 장수</FieldLabel>
            <TextInput
              id="receive-count"
              inputMode="numeric"
              value={receiveCount}
              onChange={(e) => setReceiveCount(e.target.value)}
              autoFocus
            />
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
    <Suspense fallback={<StateBox $variant="loading">불러오는 중…</StateBox>}>
      <WalletInventoryPageInner />
    </Suspense>
  );
}
