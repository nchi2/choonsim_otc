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
  padding: 0.5rem 1.1rem;
  border: none;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  background: ${(p) =>
    p.$active ? (p.$tone === "buy" ? "#4f46e5" : "#dc2626") : "#fff"};
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

const BarFill = styled.div<{
  $pct: number;
  $filled: boolean;
  $partial: boolean;
  $tone: "buy" | "sell";
}>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${(p) =>
    p.$filled
      ? p.$tone === "buy"
        ? p.$partial
          ? "#818cf8"
          : "#4f46e5"
        : p.$partial
          ? "#f87171"
          : "#dc2626"
      : "transparent"};
  opacity: ${(p) => (p.$filled ? 1 : 0.25)};
  border-radius: 4px;
`;

const LevelMeta = styled.span<{ $active: boolean }>`
  color: ${(p) => (p.$active ? "#312e81" : "#9ca3af")};
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

const HeadlineCard = styled.div<{ $tone: "buy" | "sell" }>`
  border: 1px solid ${(p) => (p.$tone === "buy" ? "#a5b4fc" : "#fca5a5")};
  border-radius: 14px;
  background: ${(p) => (p.$tone === "buy" ? "#eef2ff" : "#fef2f2")};
  padding: 1.25rem 1.4rem;
  margin-bottom: 0.85rem;
`;

const HeadlineLabel = styled.div<{ $tone: "buy" | "sell" }>`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${(p) => (p.$tone === "buy" ? "#4338ca" : "#b91c1c")};
  margin-bottom: 0.35rem;
`;

const HeadlineValue = styled.div`
  font-size: 2rem;
  font-weight: 900;
  color: #111827;
  line-height: 1.1;
`;

const HeadlineSub = styled.div`
  font-size: 0.95rem;
  color: #4b5563;
  margin-top: 0.4rem;
`;

const MarketNote = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.85rem;
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
`;

const ResultCard = styled.div<{ $highlight?: boolean }>`
  border: 1px solid ${(p) => (p.$highlight ? "#86efac" : "#e5e7eb")};
  border-radius: 12px;
  background: ${(p) => (p.$highlight ? "#f0fdf4" : "#fafafa")};
  padding: 1rem 1.1rem;
`;

const ResultLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 0.35rem;
`;

const ResultMain = styled.div<{ $accent?: boolean }>`
  font-size: 1.15rem;
  font-weight: 800;
  color: ${(p) => (p.$accent ? "#15803d" : "#111827")};
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

const MARGIN_CHIPS = [0.5, 1, 1.5] as const;

const EXTRA_LEVELS = 8;

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
  const [direction, setDirection] = useState<Direction>("buy");
  const [marginPct, setMarginPct] = useState(1);
  const [customMargin, setCustomMargin] = useState("");
  const [usdtKrwOverride, setUsdtKrwOverride] = useState("");
  const [data, setData] = useState<CalcData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
      const res = await fetch(
        `/api/admin/otc-calc?quantity=${quantity}&direction=${direction}`,
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
  }, [quantity, direction, router]);

  useEffect(() => {
    fetchCalc();
  }, [fetchCalc]);

  const maxSize = useMemo(() => {
    if (!data?.levels.length) return 1;
    return Math.max(...data.levels.map((l) => l.size), 1);
  }, [data?.levels]);

  const isBuy = (data?.direction ?? direction) === "buy";

  const vwapUsdt = data?.vwap ?? null;
  const lastPriceUsdt = data?.lastPrice ?? null;

  const currentBasedUsdt =
    lastPriceUsdt != null
      ? lastPriceUsdt * (1 + (isBuy ? 1 : -1) * (effectiveMargin / 100))
      : null;

  let customerPriceUsdt: number | null = null;
  let appliedMode: "min-margin" | "vwap" | "no-current" = "vwap";
  if (vwapUsdt != null) {
    if (currentBasedUsdt == null) {
      customerPriceUsdt = vwapUsdt;
      appliedMode = "no-current";
    } else if (isBuy) {
      if (currentBasedUsdt >= vwapUsdt) {
        customerPriceUsdt = currentBasedUsdt;
        appliedMode = "min-margin";
      } else {
        customerPriceUsdt = vwapUsdt;
        appliedMode = "vwap";
      }
    } else {
      if (currentBasedUsdt <= vwapUsdt) {
        customerPriceUsdt = currentBasedUsdt;
        appliedMode = "min-margin";
      } else {
        customerPriceUsdt = vwapUsdt;
        appliedMode = "vwap";
      }
    }
  }

  const customerPriceKrw =
    customerPriceUsdt != null && effectiveUsdtKrw != null
      ? customerPriceUsdt * effectiveUsdtKrw
      : null;

  const vwapKrw =
    vwapUsdt != null && effectiveUsdtKrw != null
      ? vwapUsdt * effectiveUsdtKrw
      : null;
  const lastPriceKrw =
    lastPriceUsdt != null && effectiveUsdtKrw != null
      ? lastPriceUsdt * effectiveUsdtKrw
      : null;

  const marketTotalUsdt = data?.totalUsdt ?? null;
  const marketTotalKrw =
    marketTotalUsdt != null && effectiveUsdtKrw != null
      ? marketTotalUsdt * effectiveUsdtKrw
      : null;

  const customerTotalUsdt =
    customerPriceUsdt != null && data
      ? customerPriceUsdt * data.quantity
      : null;
  const customerTotalKrw =
    customerTotalUsdt != null && effectiveUsdtKrw != null
      ? customerTotalUsdt * effectiveUsdtKrw
      : null;

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

  const appliedLabel =
    appliedMode === "min-margin"
      ? "최소 마진 적용"
      : appliedMode === "vwap"
        ? "평단가 적용"
        : "현재가 조회 불가 · 최소마진 미적용";

  const totalCardUsdt = isBuy ? marketTotalUsdt : customerTotalUsdt;
  const totalCardKrw = isBuy ? marketTotalKrw : customerTotalKrw;

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

  return (
    <Page>
      <AdminTopBar title="BMB OTC 단가 계산기" displayName={displayName} />

      {error ? <ErrorBox>{error}</ErrorBox> : null}

      <Card>
        <SectionTitle>입력</SectionTitle>

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
              ? "우리가 LBANK에서 매입 (매도호가 기준)"
              : "손님이 우리에게 매도 (매수호가 기준)"}
          </span>
        </Row>

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
              {isBuy ? "+" : "−"}
              {m}%
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
            {data.source === "orderbook"
              ? `LBANK ${isBuy ? "매도" : "매수"}호가`
              : "티커(폴백)"}
          </Meta>
        ) : null}
      </Card>

      {data ? (
        <Card>
          <SectionTitle>결과</SectionTitle>

          <HeadlineCard $tone={tone}>
            <HeadlineLabel $tone={tone}>
              {isBuy ? "손님 판매가" : "손님 매입가"} · {appliedLabel}
            </HeadlineLabel>
            <HeadlineValue>
              {customerPriceKrw != null
                ? `${fmtKrw(customerPriceKrw)}원/개`
                : "-"}
            </HeadlineValue>
            <HeadlineSub>
              {customerPriceUsdt != null
                ? `${fmtUsdt(customerPriceUsdt)} USDT/개`
                : "-"}
              {effMarginPct != null
                ? ` · 실효 마진 ${isBuy ? "+" : "−"}${fmtPct(Math.abs(effMarginPct))}%`
                : ""}
            </HeadlineSub>
          </HeadlineCard>

          <MarketNote>
            {lastPriceUsdt != null
              ? `현재가 ${fmtUsdt(lastPriceUsdt)} USDT${lastPriceKrw != null ? ` (${fmtKrw(lastPriceKrw)}원/개)` : ""}`
              : "현재가 조회 불가 · 최소마진 미적용"}
            {vwapUsdt != null
              ? ` · 평단가 ${fmtUsdt(vwapUsdt)} USDT${vwapKrw != null ? ` (${fmtKrw(vwapKrw)}원/개)` : ""}`
              : ""}
            {customerPriceUsdt != null
              ? ` · 손님가 ${fmtUsdt(customerPriceUsdt)} USDT`
              : ""}
          </MarketNote>

          <ResultGrid>
            <ResultCard>
              <ResultLabel>
                {isBuy ? "매입 평단가 (VWAP)" : "시장 평단가 (VWAP)"}
              </ResultLabel>
              <ResultMain>{fmtUsdt(data.vwap)} USDT</ResultMain>
              <ResultSub>
                {vwapKrw != null ? `${fmtKrw(vwapKrw)}원/개` : "-"}
              </ResultSub>
            </ResultCard>

            <ResultCard>
              <ResultLabel>{isBuy ? "총 매입액" : "총 지급액"}</ResultLabel>
              <ResultMain>
                {totalCardUsdt != null ? `${fmtUsdt(totalCardUsdt)} USDT` : "-"}
              </ResultMain>
              <ResultSub>
                {totalCardKrw != null ? `${fmtKrw(totalCardKrw)}원` : "-"}
              </ResultSub>
            </ResultCard>

            <ResultCard $highlight>
              <ResultLabel>
                예상 차익
                {effMarginPct != null
                  ? ` (실효 마진 ${fmtPct(effMarginPct)}%)`
                  : ""}
              </ResultLabel>
              <ResultMain $accent>
                {profitKrw != null ? `${fmtKrw(profitKrw)}원` : "-"}
              </ResultMain>
              <ResultSub>
                {profitUsdt != null ? `${fmtUsdt(profitUsdt)} USDT` : "-"}
              </ResultSub>
            </ResultCard>
          </ResultGrid>
        </Card>
      ) : null}

      {data && data.levels.length > 0 ? (
        <Card>
          <SectionTitle>
            호가 시각화 ({isBuy ? "매도호가" : "매수호가"})
          </SectionTitle>
          <Orderbook>
            {visibleLevels.map((lv, i) => {
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
                      $tone={tone}
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
          {hiddenCount > 0 ? (
            <CollapseRow type="button" onClick={() => setExpanded((v) => !v)}>
              {expanded
                ? "접기"
                : `이하 ${hiddenCount.toLocaleString("ko-KR")}개 호가 생략 · 전체 보기`}
            </CollapseRow>
          ) : null}
        </Card>
      ) : null}
    </Page>
  );
}
