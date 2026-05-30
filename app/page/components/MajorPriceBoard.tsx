"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

/**
 * 메인(/) · /otc 공용 가격 보드.
 *
 * - 데이터:
 *   - 메이저 8종 + BMB 24h 변동률 → `/api/market-prices/majors`
 *   - BMB 표시가격(LBANK 우선) + USDT/KRW + BMB/KRW(원화 환산) → `/api/market-prices`
 *   두 응답을 합쳐 BMB 강조 행을 구성하고 나머지 8개는 그리드로 렌더한다.
 *   기존 데이터 소스/캐시는 그대로 — 본 컴포넌트는 표시만 담당.
 * - 갱신: 30초 polling (기존 `OTCSection` 톤 유지).
 */

interface MajorItem {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
}

interface MajorsResponse {
  items: MajorItem[];
  updatedAt: string;
  errors?: Record<string, string>;
  source?: { majors: string; bmb: string };
  stale?: boolean;
}

interface MarketPricesResponse {
  usdtKrwPrice: number | null;
  bmbUsdtPrice: number | null;
  lbankKrwPrice: number | null;
}

/** 60초 — 서버 캐시(60s)와 정렬해 외부 호출 빈도를 낮춤. */
const REFRESH_MS = 60_000;
/** 파싱 실패 / 비정상 응답에 대한 사용자용 단일 메시지. 외부 본문은 절대 노출하지 않는다. */
const FALLBACK_ERROR_MESSAGE = "시세를 일시적으로 불러올 수 없습니다.";

/**
 * 안전 JSON 파서.
 *
 * - 어떤 응답이든 먼저 `text()`로 본문을 읽고 `JSON.parse`를 try/catch로 감싼다.
 * - 응답이 비-JSON(HTML 등)이거나 파싱 실패면 `null` 반환 — 본문 자체를 절대 화면에 흘리지 않는다.
 */
async function safeJson<T>(res: Response): Promise<T | null> {
  let body: string;
  try {
    body = await res.text();
  } catch {
    return null;
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

/**
 * BMB 로고 — 추후 교체 시 이 한 줄만 바꾸면 됨.
 * 로고 영역은 별도 `BmbLogo` 컴포넌트로 분리되어 있다.
 */
const BMB_LOGO_SRC = "/logo/Logo_BMB.png";

const PRICE_DECIMALS: Record<string, number> = {
  BMB: 3,
  BTC: 2,
  ETH: 2,
  XRP: 4,
  BNB: 2,
  SOL: 2,
  TRX: 4,
  DOGE: 5,
  USDC: 4,
};

/** 변동률 소수 자리 — 안정코인은 작은 변화를 보이게 4자리. */
const CHANGE_DECIMALS: Record<string, number> = {
  USDC: 4,
};

/**
 * 안정코인은 일정 임계값 이내(±0.05%)면 중립색으로 표시해
 * 1$ 페그 코인의 미세한 노이즈를 과한 빨강/초록으로 보이지 않게 한다.
 */
const STABLE_NEUTRAL_SYMBOLS: ReadonlySet<string> = new Set(["USDC"]);
const STABLE_NEUTRAL_THRESHOLD = 0.05;

function formatPrice(symbol: string, price: number): string {
  const decimals = PRICE_DECIMALS[symbol] ?? 4;
  return price.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatChange(symbol: string, pct: number): string {
  const sign = pct > 0 ? "+" : "";
  const decimals = CHANGE_DECIMALS[symbol] ?? 2;
  return `${sign}${pct.toFixed(decimals)}%`;
}

function changeColor(symbol: string, pct: number): string {
  /** 안정코인 미세 변동(±0.05% 이내)은 중립으로. */
  if (
    STABLE_NEUTRAL_SYMBOLS.has(symbol) &&
    Math.abs(pct) < STABLE_NEUTRAL_THRESHOLD
  ) {
    return "#374151";
  }
  if (pct > 0) return "#10b981";
  if (pct < 0) return "#dc2626";
  /** 0(완전 동일)도 "정상이지만 안 움직임"이 읽히도록 진한 회색. */
  return "#374151";
}

const BoardCard = styled.section`
  width: 100%;
  background: #ffffff;
  border: 1px solid #e8e2f4;
  border-radius: 12px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 1px 2px rgba(149, 128, 180, 0.05);
`;

const BoardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

const BoardTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
`;

const BoardSubtitle = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
`;

/* ===== BMB 강조 행 =====
 *
 * - PC(≥768px): 한 줄.
 *   [로고 + BMB / Mobick·LBANK + $가격 + 24h%]  …  [BMB/KRW][USDT/KRW]
 *   양쪽 그룹 자체는 밀집(gap 좁음), 가운데 빈 공간만 자연스럽게 벌어짐(space-between).
 * - 모바일(<768px): 왼쪽 그룹 한 줄, 원화 2종이 다음 줄로 줄바꿈(flex-wrap).
 * - 8개 메이저 카드 한 줄 높이와 비슷하게 padding/폰트 사이즈를 줄여 강조 톤은 배경+테두리로만.
 */
const BmbRow = styled.div`
  width: 100%;
  background: linear-gradient(135deg, #f3f0ff 0%, #ede9fe 100%);
  border: 1px solid #ddd6fe;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  min-width: 0;

  @media (min-width: 768px) {
    padding: 12px 18px;
    flex-wrap: nowrap;
    gap: 16px;
  }
`;

const BmbLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  @media (min-width: 768px) {
    gap: 14px;
  }
`;

/**
 * BMB 로고 프레임 — 다른 코인 아이콘(`IconFrame`)과 별도.
 * 추후 BMB 로고 교체는 `BMB_LOGO_SRC` 한 곳만 변경하면 된다.
 */
const BmbLogoFrame = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex: 0 0 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  border: 1px solid rgba(99, 102, 241, 0.18);

  > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
    display: block;
  }

  @media (min-width: 768px) {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
  }
`;

const BmbIdentity = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const BmbSymbolText = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
  color: #312e81;
  letter-spacing: -0.01em;
  line-height: 1.15;
`;

const BmbSubLabel = styled.span`
  font-size: 0.7rem;
  color: #6366f1;
  line-height: 1.15;
`;

const BmbPriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  min-width: 0;
`;

const BmbPrice = styled.span`
  font-size: 1rem;
  font-weight: 800;
  color: #1e1b4b;
  font-variant-numeric: tabular-nums;
  word-break: keep-all;
  line-height: 1.15;

  @media (min-width: 768px) {
    font-size: 1.05rem;
  }
`;

const BmbChange = styled.span<{ $color: string }>`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${(p) => p.$color};
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
`;

const BmbRight = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;

  @media (min-width: 768px) {
    flex-wrap: nowrap;
    gap: 18px;
  }
`;

const KrwItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 0;
`;

const KrwLabel = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  color: #6366f1;
  letter-spacing: -0.01em;
  line-height: 1.15;
`;

const KrwValue = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e1b4b;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
`;

/* ===== 메이저 8종 그리드 ===== */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Cell = styled.div`
  background: #fafaff;
  border: 1px solid #f0eef9;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const SymbolRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const IconFrame = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex: 0 0 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  overflow: hidden;

  > img {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: block;
  }
`;

const IconInitial = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: -0.02em;
`;

const Symbol = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
  flex: 0 0 auto;
`;

const CoinName = styled.span`
  font-size: 0.7rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

const Price = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  font-variant-numeric: tabular-nums;
  word-break: keep-all;
`;

const Change = styled.span<{ $color: string }>`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${(p) => p.$color};
  font-variant-numeric: tabular-nums;
`;

const Status = styled.div`
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
  padding: 12px 0;
`;

const StatusError = styled(Status)`
  color: #dc2626;
`;

const PartialErrorRow = styled.div`
  font-size: 0.72rem;
  color: #9ca3af;
  line-height: 1.4;
`;

/**
 * BMB 로고 컴포넌트 — 강조 행 전용.
 * 코인 8종은 `CoinIcon`(SVG) 사용. BMB만 별도 PNG/이미지로 관리.
 */
function BmbLogo() {
  return (
    <BmbLogoFrame aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BMB_LOGO_SRC} alt="" loading="lazy" decoding="async" />
    </BmbLogoFrame>
  );
}

/**
 * 메이저 8종용 코인 로고 — `public/coin-icons/{symbol}.svg` 정적 파일.
 * 출처: cryptocurrency-icons (MIT). 누락/로드 실패 시 이니셜 원형 폴백.
 */
function CoinIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <IconFrame aria-hidden="true">
        <IconInitial>{symbol.slice(0, 1)}</IconInitial>
      </IconFrame>
    );
  }
  return (
    <IconFrame aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/coin-icons/${symbol.toLowerCase()}.svg`}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </IconFrame>
  );
}

export default function MajorPriceBoard() {
  const [majors, setMajors] = useState<MajorsResponse | null>(null);
  const [marketPrices, setMarketPrices] =
    useState<MarketPricesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      let anyOk = false;
      try {
        const [majorsRes, mpRes] = await Promise.allSettled([
          fetch("/api/market-prices/majors", { signal: controller.signal }),
          fetch("/api/market-prices", { signal: controller.signal }),
        ]);

        if (majorsRes.status === "fulfilled" && majorsRes.value.ok) {
          const json = await safeJson<MajorsResponse>(majorsRes.value);
          if (json && !cancelled) {
            setMajors(json);
            anyOk = true;
          }
        }

        if (mpRes.status === "fulfilled" && mpRes.value.ok) {
          const json = await safeJson<MarketPricesResponse>(mpRes.value);
          if (json && !cancelled) {
            setMarketPrices(json);
            anyOk = true;
          }
        }

        if (!cancelled) setError(anyOk ? null : FALLBACK_ERROR_MESSAGE);
      } catch {
        /** AbortError 포함 모든 에러를 흡수. 외부 메시지/스택 절대 노출 금지. */
        if (controller.signal.aborted) return;
        if (!cancelled) setError(FALLBACK_ERROR_MESSAGE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  /** majors 응답에서 BMB 분리. */
  const bmbFromMajors = useMemo(
    () => majors?.items.find((it) => it.symbol === "BMB") ?? null,
    [majors],
  );
  const otherMajors = useMemo(
    () => (majors?.items ?? []).filter((it) => it.symbol !== "BMB"),
    [majors],
  );

  /**
   * BMB 강조 행 데이터 합성:
   * - price(USDT)  : `/api/market-prices` LBANK 우선 가격이 더 정확 → 1순위.
   *                  없으면 majors의 ccapi 가격으로 폴백.
   * - 24h %       : majors(ccapi 1h×25)
   * - BMB/KRW    : `/api/market-prices` lbankKrwPrice (= BMB/USDT × USDT/KRW)
   * - USDT/KRW   : `/api/market-prices` usdtKrwPrice
   */
  const bmbRow = useMemo(() => {
    const usdtPrice =
      marketPrices?.bmbUsdtPrice ?? bmbFromMajors?.price ?? null;
    const change = bmbFromMajors?.changePercent24h ?? null;
    const krw = marketPrices?.lbankKrwPrice ?? null;
    const usdtKrw = marketPrices?.usdtKrwPrice ?? null;
    if (usdtPrice == null) return null;
    return { usdtPrice, change, krw, usdtKrw };
  }, [marketPrices, bmbFromMajors]);

  const partialErrors = useMemo(() => {
    if (!majors?.errors) return [] as Array<[string, string]>;
    return Object.entries(majors.errors);
  }, [majors]);

  const hasAnyData = bmbRow != null || otherMajors.length > 0;

  return (
    <BoardCard aria-label="시세 보드">
      <BoardHeader>
        <BoardTitle>시세 보드</BoardTitle>
        <BoardSubtitle>USDT 기준 · 24h 변동</BoardSubtitle>
      </BoardHeader>

      {bmbRow && (
        <BmbRow>
          <BmbLeft>
            <BmbLogo />
            <BmbIdentity>
              <BmbSymbolText>BMB</BmbSymbolText>
              <BmbSubLabel>Mobick · LBANK</BmbSubLabel>
            </BmbIdentity>
            <BmbPriceBlock>
              <BmbPrice>${formatPrice("BMB", bmbRow.usdtPrice)}</BmbPrice>
              {bmbRow.change != null && (
                <BmbChange $color={changeColor("BMB", bmbRow.change)}>
                  {formatChange("BMB", bmbRow.change)}
                </BmbChange>
              )}
            </BmbPriceBlock>
          </BmbLeft>

          <BmbRight>
            {bmbRow.krw != null && (
              <KrwItem>
                <KrwLabel>BMB / KRW</KrwLabel>
                <KrwValue>
                  {Math.round(bmbRow.krw).toLocaleString()}원
                </KrwValue>
              </KrwItem>
            )}
            {bmbRow.usdtKrw != null && (
              <KrwItem>
                <KrwLabel>USDT / KRW</KrwLabel>
                <KrwValue>
                  {Math.round(bmbRow.usdtKrw).toLocaleString()}원
                </KrwValue>
              </KrwItem>
            )}
          </BmbRight>
        </BmbRow>
      )}

      {loading && !hasAnyData && (
        <Status>시세를 불러오는 중...</Status>
      )}

      {!loading && !hasAnyData && error && (
        <StatusError>{error}</StatusError>
      )}

      {!loading && !hasAnyData && !error && (
        <Status>표시할 시세가 없습니다.</Status>
      )}

      {otherMajors.length > 0 && (
        <Grid>
          {otherMajors.map((it) => (
            <Cell key={it.symbol}>
              <SymbolRow>
                <CoinIcon symbol={it.symbol} />
                <Symbol>{it.symbol}</Symbol>
                <CoinName>{it.name}</CoinName>
              </SymbolRow>
              <Price>${formatPrice(it.symbol, it.price)}</Price>
              <Change $color={changeColor(it.symbol, it.changePercent24h)}>
                {formatChange(it.symbol, it.changePercent24h)}
              </Change>
            </Cell>
          ))}
        </Grid>
      )}

      {hasAnyData && partialErrors.length > 0 && (
        <PartialErrorRow>
          일부 코인 시세 조회 실패:{" "}
          {partialErrors.map(([s, r]) => `${s} (${r})`).join(", ")}
        </PartialErrorRow>
      )}
    </BoardCard>
  );
}
