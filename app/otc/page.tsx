"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import OTCSection from "../page/components/OTCSection";
import * as HubS from "../page/styles";
import MajorPriceBoard from "../page/components/MajorPriceBoard";
import Apply10MoModal from "./components/Apply10MoModal";
import Apply10MoSuspendedDialog from "./components/Apply10MoSuspendedDialog";
import { MIRACLE10_APPLY_SUSPENDED } from "./components/apply10mo.constants";
import OtcRequestModal, {
  type OtcRequestSide,
} from "./components/OtcRequestModal";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  primaryPurple: "#434392",
  accentPurple: "#434392",
  lightPurple: "#AFA5DD",
  bgGray: "#F5F5F7",
  borderLightPurple: "#E8E2F4",
  gray600: "#4B5563",
  gray700: "#374151",
};

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${COLORS.bgGray};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0 8px;
  background-color: ${COLORS.bgGray};
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  margin-top: 20px;
`;

const ContentWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: stretch;

  @media (min-width: 768px) {
    max-width: 100%;
    gap: 2rem;
  }
`;

// /otc 히어로 CTA — 메인 배너와 동일 스타일, 클릭 시 모달 오픈
const HeroBuyButton = HubS.OTCHeroBuyButton;
const HeroSellButton = HubS.OTCHeroSellButton;
const HeroMiracleButton = HubS.OTCHeroMiraclePromoLink;

// BTC/BMB 비율 차트 섹션
const ChartCard = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (min-width: 768px) {
    padding: 2rem;
    margin-bottom: 2rem;
    gap: 1.5rem;
  }
`;

const ChartHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 768px) {
    gap: 0.75rem;
  }
`;

const ChartTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;

  @media (min-width: 768px) {
    font-size: 1.5rem;
    gap: 6px;
  }
`;

const TickerWithLogo = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const InlineCoinLogo = styled.span`
  width: 1em;
  height: 1em;
  border-radius: 50%;
  flex: 0 0 1em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  overflow: hidden;

  > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
    display: block;
  }
`;

const ChartDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const ChartStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;

  @media (min-width: 768px) {
    gap: 1.5rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const StatValue = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: ${COLORS.primaryPurple};

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;

  @media (min-width: 768px) {
    height: 400px;
  }
`;

const ChartLoading = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 14px;

  @media (min-width: 768px) {
    height: 400px;
    font-size: 1rem;
  }
`;

const ChartError = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  font-size: 14px;

  @media (min-width: 768px) {
    height: 400px;
    font-size: 1rem;
  }
`;

const ChartContainerWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const ChartZoomControls = styled.div`
  position: absolute;
  top: 5px;
  right: 10px;
  display: flex;
  gap: 6px;
  align-items: center;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    top: 8px;
    right: 15px;
    gap: 8px;
    padding: 6px;
  }
`;

const ZoomButton = styled.button`
  background-color: ${COLORS.primaryPurple};
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #35357a;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
    transform: none;
    opacity: 0.5;
  }

  @media (min-width: 768px) {
    padding: 8px 14px;
    font-size: 18px;
    min-width: 36px;
    height: 36px;
  }
`;

interface RatioDataPoint {
  time: number;
  btcUsdtPrice: number;
  bmbUsdtPrice: number;
  ratio: number;
  date: string;
  source: "LBANK" | "CHUNSIM";
}

// URL query key for the 10-Mo apply modal. Direct visit `/otc?apply=1` opens it.
const APPLY_QUERY_KEY = "apply";
const APPLY_QUERY_VALUE = "1";

// BMB 매수/판매 신청 모달 — `/otc?otcreq=buy` | `sell`
const OTC_REQ_QUERY_KEY = "otcreq";

function parseOtcReqParam(value: string | null): OtcRequestSide | null {
  if (value === "buy") return "BUY";
  if (value === "sell") return "SELL";
  return null;
}

function OTCContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Apply modal — 로컬 state로 즉시 열고, URL(?apply=1)은 딥링크·공유용으로 동기화.
  const urlApplyOpen = searchParams.get(APPLY_QUERY_KEY) === APPLY_QUERY_VALUE;
  const [applyOpen, setApplyOpen] = useState(
    !MIRACLE10_APPLY_SUSPENDED && urlApplyOpen,
  );
  const [suspendedOpen, setSuspendedOpen] = useState(false);
  const pushedByOpenRef = useRef(false);

  // URL 변경(뒤로가기·직접 방문) 시 state 동기화
  useEffect(() => {
    if (MIRACLE10_APPLY_SUSPENDED) {
      if (urlApplyOpen) {
        setSuspendedOpen(true);
        setApplyOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete(APPLY_QUERY_KEY);
        const qs = params.toString();
        router.replace(qs ? `/otc?${qs}` : "/otc", { scroll: false });
      }
      return;
    }
    setApplyOpen(urlApplyOpen);
  }, [urlApplyOpen, router, searchParams]);

  const isApplyOpen = !MIRACLE10_APPLY_SUSPENDED && applyOpen;

  const urlOtcReqSide = parseOtcReqParam(searchParams.get(OTC_REQ_QUERY_KEY));
  const [otcReqSide, setOtcReqSide] = useState<OtcRequestSide | null>(
    urlOtcReqSide,
  );
  const otcReqPushedRef = useRef(false);

  useEffect(() => {
    setOtcReqSide(urlOtcReqSide);
  }, [urlOtcReqSide]);

  const openApplyModal = useCallback(() => {
    if (applyOpen) return;
    setApplyOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set(APPLY_QUERY_KEY, APPLY_QUERY_VALUE);
    pushedByOpenRef.current = true;
    router.push(`/otc?${params.toString()}`, { scroll: false });
  }, [applyOpen, router, searchParams]);

  const closeApplyModal = useCallback(() => {
    if (!applyOpen) return;
    setApplyOpen(false);
    if (pushedByOpenRef.current) {
      pushedByOpenRef.current = false;
      router.back();
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete(APPLY_QUERY_KEY);
    const qs = params.toString();
    router.replace(qs ? `/otc?${qs}` : "/otc", { scroll: false });
  }, [applyOpen, router, searchParams]);

  const handleApplyClick = useCallback(() => {
    if (MIRACLE10_APPLY_SUSPENDED) {
      setSuspendedOpen(true);
      return;
    }
    openApplyModal();
  }, [openApplyModal]);

  const closeSuspendedDialog = useCallback(() => {
    setSuspendedOpen(false);
  }, []);

  const openOtcReqModal = useCallback(
    (side: OtcRequestSide) => {
      if (otcReqSide === side) return;
      setOtcReqSide(side);
      const params = new URLSearchParams(searchParams.toString());
      params.set(OTC_REQ_QUERY_KEY, side === "BUY" ? "buy" : "sell");
      otcReqPushedRef.current = true;
      router.push(`/otc?${params.toString()}`, { scroll: false });
    },
    [otcReqSide, router, searchParams],
  );

  const closeOtcReqModal = useCallback(() => {
    if (!otcReqSide) return;
    setOtcReqSide(null);
    if (otcReqPushedRef.current) {
      otcReqPushedRef.current = false;
      router.back();
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete(OTC_REQ_QUERY_KEY);
    const qs = params.toString();
    router.replace(qs ? `/otc?${qs}` : "/otc", { scroll: false });
  }, [otcReqSide, router, searchParams]);

  // BTC/BMB 비율 차트 데이터
  const [ratioData, setRatioData] = useState<RatioDataPoint[]>([]);
  const [ratioLoading, setRatioLoading] = useState(true);
  const [ratioError, setRatioError] = useState<string | null>(null);
  const [latestRatio, setLatestRatio] = useState<number | null>(null);
  const [latestBtcPrice, setLatestBtcPrice] = useState<number | null>(null);
  const [latestBmbPrice, setLatestBmbPrice] = useState<number | null>(null);

  // 차트 확대/축소 상태 (1: 30일, 2: 90일, 3: 180일, 4: 365일, 5: 전체)
  const [zoomLevel, setZoomLevel] = useState<number>(2);

  useEffect(() => {
    const fetchRatioData = async () => {
      try {
        setRatioLoading(true);
        setRatioError(null);

        const response = await fetch(`/api/price/btc-bmb-ratio?period=1day`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.details || errorData.error || `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.details || data.error);
        }

        if (!data.data || data.data.length === 0) {
          throw new Error("차트 데이터가 없습니다.");
        }

        setRatioData(data.data || []);
        setLatestRatio(data.latestRatio);
        setLatestBtcPrice(data.latestBtcPrice);
        setLatestBmbPrice(data.latestBmbPrice);
      } catch (err) {
        console.error("Error fetching ratio data:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "BTC/BMB 비율 데이터를 불러오는데 실패했습니다.";
        setRatioError(errorMessage);
      } finally {
        setRatioLoading(false);
      }
    };

    fetchRatioData();
    const interval = setInterval(fetchRatioData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 차트 확대/축소 단계별 일수
  const getDaysForZoomLevel = (level: number): number | null => {
    switch (level) {
      case 1:
        return 30;
      case 2:
        return 90;
      case 3:
        return 180;
      case 4:
        return 365;
      case 5:
        return null;
      default:
        return 90;
    }
  };

  // 차트 데이터 포맷팅
  const formatChartData = (data: RatioDataPoint[]) => {
    const days = getDaysForZoomLevel(zoomLevel);

    let displayData = data;
    if (days !== null && days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      cutoffDate.setHours(0, 0, 0, 0);
      const cutoffTimestamp = cutoffDate.getTime();

      displayData = data.filter((item) => item.time >= cutoffTimestamp);
    }

    return displayData.map((item) => ({
      ...item,
      date: new Date(item.time).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      ratioFormatted: item.ratio.toFixed(2),
    }));
  };

  const handleZoomIn = () => {
    if (zoomLevel > 1) {
      setZoomLevel(zoomLevel - 1);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel < 5) {
      setZoomLevel(zoomLevel + 1);
    }
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ payload: RatioDataPoint }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: `1px solid ${COLORS.borderLightPurple}`,
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#1f2937" }}>
            {label}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              <span style={{ fontWeight: 600, color: "#1f2937" }}>
                BTC/BMB 비율:
              </span>{" "}
              {data.ratio.toFixed(2)} (
              {data.source === "CHUNSIM" ? "춘심 기준" : "LBANK"})
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              <span style={{ fontWeight: 600, color: "#1f2937" }}>
                모빅 가격:
              </span>{" "}
              $
              {data.bmbUsdtPrice.toLocaleString("ko-KR", {
                maximumFractionDigits: 6,
              })}
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              <span style={{ fontWeight: 600, color: "#1f2937" }}>
                BTC 가격:
              </span>{" "}
              $
              {data.btcUsdtPrice.toLocaleString("ko-KR", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <PublicShell fullWidth showTicker={false}>
    <PageContainer>
      <OTCSection
        showTradeButton={false}
        showPriceCards={false}
        compact
        title="Choonsim OTC"
        subtitle="BMB·메이저 코인 시세를 한눈에 확인하고 OTC 거래를 진행하세요."
        actionSlot={
          <HubS.OTCHeroButtonContainer>
            <HeroBuyButton
              type="button"
              onClick={() => openOtcReqModal("BUY")}
            >
              BMB 구매
            </HeroBuyButton>
            <HeroSellButton
              type="button"
              onClick={() => openOtcReqModal("SELL")}
            >
              BMB 판매
            </HeroSellButton>
            <HeroMiracleButton type="button" onClick={handleApplyClick}>
              10모의 기적 All-in-One 신청
            </HeroMiracleButton>
          </HubS.OTCHeroButtonContainer>
        }
      />

      <Apply10MoModal open={isApplyOpen} onClose={closeApplyModal} />
      <Apply10MoSuspendedDialog
        open={suspendedOpen}
        onClose={closeSuspendedDialog}
      />
      {otcReqSide ? (
        <OtcRequestModal
          open
          side={otcReqSide}
          onClose={closeOtcReqModal}
        />
      ) : null}

      <MainContent>
        <ContentWrapper>
          <MajorPriceBoard />

          {/* BTC/BMB 비율 차트 섹션 */}
          <ChartCard>
            <ChartHeader>
              <ChartTitle>
                <TickerWithLogo>
                  <InlineCoinLogo aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/coin-icons/btc.svg" alt="" />
                  </InlineCoinLogo>
                  BTC
                </TickerWithLogo>
                <span>/</span>
                <TickerWithLogo>
                  <InlineCoinLogo aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo/Logo_BMB.png" alt="" />
                  </InlineCoinLogo>
                  BMB
                </TickerWithLogo>
                <span>비율 차트</span>
              </ChartTitle>
              <ChartDescription>
                LBANK 거래소의 BTC/USDT와 BMB/USDT 가격 데이터를 기반으로 계산된
                BTC/BMB 비율 추이입니다.
              </ChartDescription>
              {latestRatio !== null && (
                <ChartStats>
                  <StatItem>
                    <StatLabel>현재 비율</StatLabel>
                    <StatValue>{latestRatio.toFixed(2)}</StatValue>
                  </StatItem>
                  {latestBtcPrice !== null && (
                    <StatItem>
                      <StatLabel>BTC/USDT</StatLabel>
                      <StatValue>
                        $
                        {latestBtcPrice.toLocaleString("ko-KR", {
                          maximumFractionDigits: 2,
                        })}
                      </StatValue>
                    </StatItem>
                  )}
                  {latestBmbPrice !== null && (
                    <StatItem>
                      <StatLabel>BMB/USDT</StatLabel>
                      <StatValue>
                        $
                        {latestBmbPrice.toLocaleString("ko-KR", {
                          maximumFractionDigits: 6,
                        })}
                      </StatValue>
                    </StatItem>
                  )}
                </ChartStats>
              )}
            </ChartHeader>

            {ratioLoading && (
              <ChartLoading>차트 데이터를 불러오는 중...</ChartLoading>
            )}

            {ratioError && <ChartError>{ratioError}</ChartError>}

            {!ratioLoading && !ratioError && ratioData.length > 0 && (
              <ChartContainerWrapper>
                <ChartContainer>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatChartData(ratioData)}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        fontSize={12}
                        tick={{ fill: "#6b7280" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        reversed
                        stroke="#6b7280"
                        fontSize={12}
                        tick={{ fill: "#6b7280" }}
                        label={{
                          value: "BTC/BMB 비율",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#6b7280" },
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: "10px" }}
                        iconType="line"
                      />
                      <Line
                        type="monotone"
                        dataKey="ratio"
                        stroke={COLORS.primaryPurple}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        name="BTC/BMB 비율"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>

                {/* 확대/축소 버튼 (우측 상단) */}
                <ChartZoomControls>
                  <ZoomButton
                    onClick={handleZoomOut}
                    disabled={zoomLevel === 5}
                    title="축소 (더 넓게 보기)"
                  >
                    −
                  </ZoomButton>
                  <ZoomButton
                    onClick={handleZoomIn}
                    disabled={zoomLevel === 1}
                    title="확대 (더 가까이 보기)"
                  >
                    +
                  </ZoomButton>
                </ChartZoomControls>
              </ChartContainerWrapper>
            )}

            {!ratioLoading && !ratioError && ratioData.length === 0 && (
              <ChartLoading>차트 데이터가 없습니다.</ChartLoading>
            )}
          </ChartCard>
        </ContentWrapper>
      </MainContent>
      </PageContainer>
    </PublicShell>
  );
}

const LoadingFallback = () => (
  <PublicShell fullWidth showTicker={false}>
  <PageContainer>
    <MainContent>
      <ContentWrapper>
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          로딩 중...
        </div>
      </ContentWrapper>
    </MainContent>
    </PageContainer>
  </PublicShell>
);

export default function OTCPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OTCContent />
    </Suspense>
  );
}
