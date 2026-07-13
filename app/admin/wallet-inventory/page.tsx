"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { todayKst } from "@/lib/kst";
import { StateBox, adminColors } from "@/components/admin/ui";

const Page = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 1rem;
  }
`;

const TotalsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }
`;

const TotalCard = styled.div<{ $primary?: boolean }>`
  border: 1px solid
    ${(p) => (p.$primary ? adminColors.primaryBorder : adminColors.border)};
  border-radius: 12px;
  background: ${(p) => (p.$primary ? adminColors.primarySoft : "#fff")};
  padding: 1rem 1.1rem;
`;

const TotalLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${adminColors.textMuted};
  margin-bottom: 0.35rem;
`;

const TotalValue = styled.div<{ $primary?: boolean }>`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${(p) => (p.$primary ? adminColors.primary : adminColors.text)};
`;

const Card = styled.div`
  border: 1px solid ${adminColors.border};
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

const TypeToggle = styled.div`
  display: inline-flex;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.9rem;
`;

const TypeBtn = styled.button<{ $active: boolean; $out?: boolean }>`
  padding: 0.5rem 1.1rem;
  border: none;
  background: ${(p) =>
    p.$active ? (p.$out ? "#b91c1c" : adminColors.primary) : "#fff"};
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
  color: ${(p) => (p.$error ? "#dc2626" : "#059669")};
`;

const LedgerTable = styled.div`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
`;

const LedgerHead = styled.div`
  display: grid;
  grid-template-columns: 88px 72px 1fr 96px 64px;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  background: ${adminColors.bgSubtle};
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.textMuted};

  @media (max-width: 640px) {
    grid-template-columns: 78px 62px 1fr 56px;
  }
`;

const LedgerRow = styled.div`
  display: grid;
  grid-template-columns: 88px 72px 1fr 96px 64px;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border-top: 1px solid ${adminColors.rowDivider};
  font-size: 0.82rem;
  color: ${adminColors.text};
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: 78px 62px 1fr 56px;
  }
`;

/* 모바일 — 담당 컬럼 숨김 (내용 title 툴팁으로 확인) */
const HideMobile = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`;

const AdminCell = styled(HideMobile)`
  font-size: 0.75rem;
  color: ${adminColors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CountBadge = styled.span<{ $out: boolean }>`
  font-weight: 800;
  color: ${(p) => (p.$out ? "#b91c1c" : "#047857")};
  white-space: nowrap;
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

const DeleteBtn = styled.button`
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  border: 1px solid #fca5a5;
  background: #fff;
  color: #b91c1c;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface Totals {
  inTotal: number;
  outTotal: number;
  stock: number;
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
}

function WalletInventoryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 등록 폼 — 10모 상세에서 ?type=OUT&orderId=&count=&receiver= 프리필 진입 지원.
  const [type, setType] = useState<"IN" | "OUT">(
    searchParams.get("type") === "OUT" ? "OUT" : "IN",
  );
  const [countInput, setCountInput] = useState(searchParams.get("count") ?? "");
  const [dateInput, setDateInput] = useState(todayKst());
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/wallet-inventory");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "재고를 불러오지 못했습니다.");
      }
      setTotals(json.totals);
      setEntries(json.entries);
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
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "등록 실패");
      }
      setFormMsg({
        text: `${type === "IN" ? "입고" : "불출"} ${count}장 등록되었습니다.`,
      });
      setCountInput("");
      setMemoInput("");
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

  const removeEntry = async (id: number) => {
    if (deletingId != null) return;
    if (!window.confirm(`기록 #${id}을 삭제할까요? 재고에 바로 반영됩니다.`)) {
      return;
    }
    setDeletingId(id);
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
      setDeletingId(null);
    }
  };

  if (loading)
    return (
      <Page>
        <StateBox $variant="loading">불러오는 중…</StateBox>
      </Page>
    );

  return (
    <Page>
      {error ? <StateBox $variant="error">{error}</StateBox> : null}

      {totals ? (
        <TotalsRow>
          <TotalCard $primary>
            <TotalLabel>현재 재고</TotalLabel>
            <TotalValue $primary>{totals.stock}장</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>입고 누계</TotalLabel>
            <TotalValue>{totals.inTotal}장</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>불출 누계</TotalLabel>
            <TotalValue>{totals.outTotal}장</TotalValue>
          </TotalCard>
        </TotalsRow>
      ) : null}

      <Card>
        <SectionTitle>입고 / 불출 등록</SectionTitle>
        <TypeToggle role="group" aria-label="입출 구분">
          <TypeBtn
            type="button"
            $active={type === "IN"}
            onClick={() => setType("IN")}
          >
            입고 (+)
          </TypeBtn>
          <TypeBtn
            type="button"
            $active={type === "OUT"}
            $out
            onClick={() => setType("OUT")}
          >
            불출 (−)
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
              placeholder="예: 10"
            />
          </div>
          <div>
            <FieldLabel htmlFor="inv-date">날짜 (KST)</FieldLabel>
            <TextInput
              id="inv-date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </div>
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
              placeholder={type === "IN" ? "예: 2차 제작분 입고" : "예: 현장 수령"}
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
                : "불출 등록"}
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
            <HideMobile>담당</HideMobile>
            <span></span>
          </LedgerHead>
          {entries.map((en) => (
            <LedgerRow key={en.id}>
              <span>{en.entryDate}</span>
              <CountBadge $out={en.type === "OUT"}>
                {en.type === "OUT" ? "−" : "+"}
                {en.count}장
              </CountBadge>
              <RowDetail
                title={[
                  en.receiverName ? `수령: ${en.receiverName}` : null,
                  en.memo,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              >
                {en.orderId != null ? (
                  <Link href={`/admin/miracle10/${en.orderId}`}>
                    #{en.orderId}
                  </Link>
                ) : null}
                {en.orderId != null && (en.receiverName || en.memo) ? " " : ""}
                {en.receiverName ? `${en.receiverName} 수령` : ""}
                {en.receiverName && en.memo ? " · " : ""}
                {en.memo ?? ""}
                {!en.orderId && !en.receiverName && !en.memo ? "—" : ""}
              </RowDetail>
              <AdminCell>{en.adminName}</AdminCell>
              <span>
                <DeleteBtn
                  type="button"
                  disabled={deletingId != null}
                  onClick={() => removeEntry(en.id)}
                >
                  삭제
                </DeleteBtn>
              </span>
            </LedgerRow>
          ))}
        </LedgerTable>
      )}
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
