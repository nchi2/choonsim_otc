"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import AdminTopBar from "@/components/admin/AdminTopBar";

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
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
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? "#4f46e5" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#eef2ff" : "#fff")};
  color: ${(p) => (p.$active ? "#4338ca" : "#374151")};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
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
  grid-template-columns: 88px 1fr 72px;
  gap: 8px;
  align-items: center;
  font-size: 0.8rem;
`;

const BarTrack = styled.div`
  height: 18px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const BarFill = styled.div<{ $pct: number; $filled: boolean; $partial: boolean }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${(p) =>
    p.$filled ? (p.$partial ? "#818cf8" : "#4f46e5") : "transparent"};
  opacity: ${(p) => (p.$filled ? 1 : 0.25)};
  border-radius: 4px;
`;

const LevelMeta = styled.span<{ $active: boolean }>`
  color: ${(p) => (p.$active ? "#312e81" : "#9ca3af")};
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  text-align: right;
  white-space: nowrap;
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
`;

const ResultCard = styled.div<{ $highlight?: boolean }>`
  border: 1px solid ${(p) => (p.$highlight ? "#a5b4fc" : "#e5e7eb")};
  border-radius: 12px;
  background: ${(p) => (p.$highlight ? "#eef2ff" : "#fafafa")};
  padding: 1rem 1.1rem;
`;

const ResultLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.35rem;
`;

const ResultMain = styled.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: #111827;
`;

const ResultSub = styled.div`
  font-size: 0.85rem;
  color: #4b5563;
  margin-top: 0.25rem;
`;

const ErrorBox = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

interface Level {
  price: number;
  size: number;
  filledQty: number;
}

interface CalcData {
  quantity: number;
  levels: Level[];
  vwap: number;
  totalUsdt: number;
  usdtKrw: number;
  totalKrw: number;
  vwapKrw: number;
  source: string;
  asOf: string;
}

const MARGIN_CHIPS = [0.5, 1, 1.5] as const;

function fmtUsdt(n: number) {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtKrw(n: number) {
  return Math.round(n).toLocaleString("ko-KR");
}

function fmtPct(n: number) {
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default function AdminCalculatorPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [marginPct, setMarginPct] = useState(1);
  const [customMargin, setCustomMargin] = useState("");
  const [usdtKrwOverride, setUsdtKrwOverride] = useState("");
  const [data, setData] = useState<CalcData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const json = await res.json();
        if (json.ok) setDisplayName(json.displayName);
      })
      .catch(() => {});
  }, [router]);

  const effectiveMargin = useMemo(() => {
    if (customMargin.trim() !== "") {
      const v = Number(customMargin);
      if (Number.isFinite(v) && v >= 0) return v;
    }
    return marginPct;
  }, [customMargin, marginPct]);

  const effectiveUsdtKrw = useMemo(() => {
    if (usdtKrwOverride.trim() !== "") {
      const v = Number(usdtKrwOverride.replace(/,/g, ""));
      if (Number.isFinite(v) && v > 0) return v;
    }
    return data?.usdtKrw ?? null;
  }, [usdtKrwOverride, data?.usdtKrw]);

  const fetchCalc = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/otc-calc?quantity=${quantity}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "호가를 불러오지 못했습니다.");
      }
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [quantity, router]);

  useEffect(() => {
    fetchCalc();
  }, [fetchCalc]);

  const maxSize = useMemo(() => {
    if (!data?.levels.length) return 1;
    return Math.max(...data.levels.map((l) => l.size), 1);
  }, [data?.levels]);

  const marginPriceUsdt =
    data && effectiveUsdtKrw != null
      ? data.vwap * (1 + effectiveMargin / 100)
      : null;
  const marginPriceKrw =
    marginPriceUsdt != null && effectiveUsdtKrw != null
      ? marginPriceUsdt * effectiveUsdtKrw
      : null;
  const marginTotalUsdt =
    marginPriceUsdt != null && data ? marginPriceUsdt * data.quantity : null;
  const marginTotalKrw =
    marginTotalUsdt != null && effectiveUsdtKrw != null
      ? marginTotalUsdt * effectiveUsdtKrw
      : null;

  const displayVwapKrw =
    data && effectiveUsdtKrw != null ? data.vwap * effectiveUsdtKrw : null;
  const displayTotalKrw =
    data && effectiveUsdtKrw != null ? data.totalUsdt * effectiveUsdtKrw : null;

  return (
    <Page>
      <AdminTopBar title="OTC 단가 계산기" displayName={displayName} />

      {error ? <ErrorBox>{error}</ErrorBox> : null}

      <Card>
        <SectionTitle>입력</SectionTitle>
        <Row>
          <Label htmlFor="qty">수량(개)</Label>
          <Input
            id="qty"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isInteger(v) && v > 0) setQuantity(v);
            }}
          />
          <RefreshButton type="button" onClick={fetchCalc} disabled={loading}>
            {loading ? "조회 중..." : "새로고침"}
          </RefreshButton>
        </Row>

        <Row>
          <Label>마진%</Label>
          {MARGIN_CHIPS.map((m) => (
            <Chip
              key={m}
              type="button"
              $active={customMargin === "" && marginPct === m}
              onClick={() => {
                setMarginPct(m);
                setCustomMargin("");
              }}
            >
              +{m}%
            </Chip>
          ))}
          <Input
            type="number"
            min={0}
            step={0.1}
            placeholder="직접"
            value={customMargin}
            onChange={(e) => setCustomMargin(e.target.value)}
            style={{ width: 88 }}
          />
        </Row>

        <Row>
          <Label htmlFor="usdt">USDT환율</Label>
          <Input
            id="usdt"
            type="text"
            placeholder={data ? String(Math.round(data.usdtKrw)) : "자동"}
            value={usdtKrwOverride}
            onChange={(e) => setUsdtKrwOverride(e.target.value)}
            style={{ width: 140 }}
          />
          {data ? (
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              자동: {fmtKrw(data.usdtKrw)}원
            </span>
          ) : null}
        </Row>

        {data ? (
          <Meta>
            갱신: {new Date(data.asOf).toLocaleString("ko-KR")} · 소스:{" "}
            {data.source === "orderbook" ? "LBANK 호가" : "티커(폴백)"}
          </Meta>
        ) : null}
      </Card>

      {data && data.levels.length > 0 ? (
        <Card>
          <SectionTitle>호가 시각화 (매도호가)</SectionTitle>
          <Orderbook>
            {data.levels.map((lv, i) => {
              const barPct = (lv.size / maxSize) * 100;
              const filled = lv.filledQty > 0;
              const partial = filled && lv.filledQty < lv.size;
              return (
                <LevelRow key={`${lv.price}-${i}`}>
                  <span style={{ color: "#374151", fontWeight: 500 }}>
                    {fmtUsdt(lv.price)}
                  </span>
                  <BarTrack>
                    <BarFill
                      $pct={barPct}
                      $filled={filled}
                      $partial={partial}
                    />
                  </BarTrack>
                  <LevelMeta $active={filled}>
                    {filled
                      ? `${lv.filledQty.toLocaleString("ko-KR")}개 체결`
                      : `${lv.size.toLocaleString("ko-KR")}`}
                  </LevelMeta>
                </LevelRow>
              );
            })}
          </Orderbook>
        </Card>
      ) : null}

      {data ? (
        <Card>
          <SectionTitle>결과</SectionTitle>
          <ResultGrid>
            <ResultCard>
              <ResultLabel>체결 평단가 (VWAP)</ResultLabel>
              <ResultMain>{fmtUsdt(data.vwap)} USDT</ResultMain>
              <ResultSub>
                {displayVwapKrw != null
                  ? `${fmtKrw(displayVwapKrw)}원/개`
                  : "-"}
              </ResultSub>
            </ResultCard>

            <ResultCard>
              <ResultLabel>총 매입액</ResultLabel>
              <ResultMain>{fmtUsdt(data.totalUsdt)} USDT</ResultMain>
              <ResultSub>
                {displayTotalKrw != null
                  ? `${fmtKrw(displayTotalKrw)}원`
                  : "-"}
              </ResultSub>
            </ResultCard>

            <ResultCard $highlight>
              <ResultLabel>마진 적용가 (+{fmtPct(effectiveMargin)}%)</ResultLabel>
              <ResultMain>
                {marginPriceUsdt != null
                  ? `${fmtUsdt(marginPriceUsdt)} USDT`
                  : "-"}
              </ResultMain>
              <ResultSub>
                {marginPriceKrw != null
                  ? `${fmtKrw(marginPriceKrw)}원/개`
                  : "-"}
              </ResultSub>
              {marginTotalUsdt != null ? (
                <ResultSub style={{ marginTop: 8 }}>
                  합계 {fmtUsdt(marginTotalUsdt)} USDT
                  {marginTotalKrw != null
                    ? ` · ${fmtKrw(marginTotalKrw)}원`
                    : ""}
                </ResultSub>
              ) : null}
            </ResultCard>
          </ResultGrid>
        </Card>
      ) : null}
    </Page>
  );
}
