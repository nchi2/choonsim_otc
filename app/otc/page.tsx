"use client";

import { useState, useEffect, Suspense } from "react";
import styled from "styled-components";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { STATUS_LABELS } from "@/lib/constants";
import { useSearchParams, useRouter } from "next/navigation";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem 1rem;
  background-color: #ffffff;
  margin: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    padding: 4rem 2rem;
    margin: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 3rem;
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  background-color: #f9fafb;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const TabContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    gap: 1rem;
    margin-bottom: 3rem;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => (props.$active ? "#3b82f6" : "#6b7280")};
  background-color: transparent;
  border: none;
  border-bottom: 3px solid
    ${(props) => (props.$active ? "#3b82f6" : "transparent")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #3b82f6;
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1rem 2rem;
  }
`;

const TabContent = styled.div`
  width: 100%;
`;

const OrderBookSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    margin-bottom: 3rem;
  }
`;

const OrderBookTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const OrderBookPlaceholder = styled.div`
  padding: 3rem 2rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
    font-size: 1rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    max-width: 100%;
    padding: 2rem;
  }
`;

const Button = styled.button`
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1.25rem 2.5rem;
    width: auto;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const BuyButton = styled(Button)`
  background-color: #3b82f6;
  color: white;

  &:hover {
    background-color: #2563eb;
  }
`;

const SellButton = styled(Button)`
  background-color: #10b981;
  color: white;

  &:hover {
    background-color: #059669;
  }
`;

const BuyButtonLink = styled(Link)`
  width: 100%;
  text-decoration: none;
  display: block;

  @media (min-width: 768px) {
    width: auto;
  }
`;

const SellButtonLink = styled(Link)`
  width: 100%;
  text-decoration: none;
  display: block;

  @media (min-width: 768px) {
    width: auto;
  }
`;

const CardGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const CardPrice = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;

  @media (min-width: 768px) {
    font-size: 1.75rem;
  }
`;

const CardAmount = styled.div`
  font-size: 0.875rem;
  color: #6b7280;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const CardInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #374151;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const CardLabel = styled.span`
  color: #6b7280;
`;

const CardValue = styled.span`
  font-weight: 600;
  color: #111827;
`;

const EmptyState = styled.div`
  padding: 3rem 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
    font-size: 1rem;
  }
`;

// 호가 아이템 스타일 추가
const OrderBookList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// 기존 OrderBookItem 스타일 수정
const OrderBookItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
  overflow: hidden;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }

  @media (min-width: 768px) {
    padding: 1.25rem 1.5rem;
  }
`;

// 가격 영역 (막대 그래프 밖에 배치)
const OrderBookItemPrice = styled.div`
  font-size: 1rem;
  font-weight: bold;
  color: #3b82f6;
  min-width: 100px;
  flex-shrink: 0;
  position: relative;
  z-index: 2; /* 막대 그래프 위에 표시 */

  @media (min-width: 768px) {
    font-size: 1.25rem;
    min-width: 150px;
  }
`;

// 막대 그래프와 물량이 들어갈 영역
const OrderBookItemBarContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 100%;
  padding: 0.5rem 0;

  @media (min-width: 768px) {
    padding: 0.75rem 0;
  }
`;

// 배경 막대 그래프 (물량 영역에만 표시)
const OrderBookBar = styled.div<{ $width: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${(props) => props.$width}%;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(59, 130, 246, 0.15) 100%
  );
  transition: width 0.3s ease;
  z-index: 0;
`;

// 물량 영역 (막대 그래프 위에 표시)
const OrderBookItemRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  z-index: 1; /* 막대 그래프 위에 표시 */
`;

const OrderBookItemVolume = styled.div`
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const OrderBookItemCount = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-left: 0.5rem;
  font-weight: normal;
`;

// 자산 종류 선택 컴포넌트 스타일 추가
const AssetSelectorContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;

  @media (min-width: 768px) {
    gap: 1rem;
    margin-bottom: 3rem;
  }
`;

const AssetButton = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.375rem;
  border: 2px solid ${(props) => (props.$active ? "#3b82f6" : "#e5e7eb")};
  background-color: ${(props) => (props.$active ? "#eff6ff" : "#ffffff")};
  color: ${(props) => (props.$active ? "#3b82f6" : "#6b7280")};
  cursor: pointer;
  transition: all 0.2s;
  max-width: 120px;
  flex: 1;
  min-width: 80px;

  &:hover {
    border-color: #3b82f6;
    background-color: #eff6ff;
    color: #3b82f6;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 1.5rem;
    max-width: 150px;
  }
`;

// 가격 정보 스타일 추가
const PriceInfoSection = styled.div`
  width: 100%;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-around;
    padding: 1.5rem;
  }
`;

const PriceInfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const PriceLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

const PriceValue = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const PriceUnit = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

// OrderBookLevel 인터페이스 추가
interface OrderBookLevel {
  id: number;
  assetType: string;
  price: string; // Decimal은 string으로 반환됨
  totalAmount: number;
  requestCount: number;
  updatedAt: string;
}

interface SellerRequest {
  id: number;
  name?: string; // optional로 변경 (카드형에서는 제외)
  phone?: string; // optional로 변경 (카드형에서는 제외)
  amount: number;
  price: string; // Decimal은 string으로 반환됨
  allowPartial: boolean;
  branch: string;
  assetType?: string; // assetType 필드 추가
  status: string;
  createdAt: string;
  updatedAt: string;
}

function OTCContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orderbook" | "card">("orderbook");

  // URL 쿼리 파라미터에서 assetType 가져오기 (기본값: "BMB")
  const [assetType, setAssetType] = useState<string>(() => {
    return searchParams.get("asset") || "BMB";
  });

  // 호가창 데이터 (OrderBookLevel 사용)
  const [orderBookLevels, setOrderBookLevels] = useState<OrderBookLevel[]>([]);
  const [listedLoading, setListedLoading] = useState(true);
  const [listedError, setListedError] = useState<string | null>(null);

  // 카드형 데이터
  const [cardRequests, setCardRequests] = useState<SellerRequest[]>([]);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);

  // BMB 가격 정보 state 추가
  const [bmbPrice, setBmbPrice] = useState<{
    price: number | null;
    usdtPrice: number | null;
    usdtKrwPrice: number | null;
  }>({
    price: null,
    usdtPrice: null,
    usdtKrwPrice: null,
  });
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  // 동일 가격대 물량 합산 함수 (간소화 - 회관 정보 제거)
  const aggregateRequestsByPrice = (requests: SellerRequest[]) => {
    const priceMap = new Map<
      number,
      {
        price: string;
        totalAmount: number;
        ids: number[];
      }
    >();

    requests.forEach((request) => {
      const priceNum = parseFloat(request.price);

      if (priceMap.has(priceNum)) {
        const existing = priceMap.get(priceNum)!;
        existing.totalAmount += request.amount;
        existing.ids.push(request.id);
      } else {
        priceMap.set(priceNum, {
          price: request.price,
          totalAmount: request.amount,
          ids: [request.id],
        });
      }
    });

    // Map을 배열로 변환하고 가격순 정렬
    return Array.from(priceMap.entries())
      .map(([price, data]) => ({
        price: data.price,
        priceNum: price,
        totalAmount: data.totalAmount,
        ids: data.ids,
        count: data.ids.length, // 해당 가격대의 신청 건수
      }))
      .sort((a, b) => a.priceNum - b.priceNum);
  };

  // 최대 물량 계산 함수 (OrderBookLevel용)
  const getMaxVolume = (levels: OrderBookLevel[]) => {
    if (levels.length === 0) return 1;
    return Math.max(...levels.map((level) => level.totalAmount));
  };

  // assetType 변경 시 URL 업데이트 및 데이터 재로딩
  const handleAssetTypeChange = (newAssetType: string) => {
    setAssetType(newAssetType);
    const params = new URLSearchParams(searchParams.toString());
    params.set("asset", newAssetType);
    router.push(`/otc?${params.toString()}`, { scroll: false });
  };

  // URL 쿼리 파라미터 변경 감지
  useEffect(() => {
    const assetFromUrl = searchParams.get("asset") || "BMB";
    if (assetFromUrl !== assetType) {
      setAssetType(assetFromUrl);
    }
  }, [searchParams, assetType]);

  // 호가창 데이터 불러오기 (OrderBookLevel API 사용)
  useEffect(() => {
    const fetchOrderBookLevels = async () => {
      if (activeTab === "orderbook") {
        try {
          setListedLoading(true);
          setListedError(null);

          const response = await fetch(
            `/api/otc/orderbook-levels?assetType=${assetType}`
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(
              data.error || "호가 정보를 불러오는데 실패했습니다."
            );
          }

          const data = await response.json();
          setOrderBookLevels(data);
        } catch (err) {
          console.error("Error fetching orderbook levels:", err);
          setListedError(
            err instanceof Error
              ? err.message
              : "호가 정보를 불러오는데 실패했습니다."
          );
        } finally {
          setListedLoading(false);
        }
      }
    };

    fetchOrderBookLevels();
  }, [activeTab, assetType]);

  // 카드형 데이터 불러오기 (assetType 파라미터 추가)
  useEffect(() => {
    const fetchCardRequests = async () => {
      if (activeTab === "card") {
        try {
          setCardLoading(true);
          setCardError(null);

          const response = await fetch(
            `/api/otc/card-requests?assetType=${assetType}&status=LISTED`
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(
              data.error || "카드형 정보를 불러오는데 실패했습니다."
            );
          }

          const data = await response.json();
          setCardRequests(data);
        } catch (err) {
          console.error("Error fetching card requests:", err);
          setCardError(
            err instanceof Error
              ? err.message
              : "카드형 정보를 불러오는데 실패했습니다."
          );
        } finally {
          setCardLoading(false);
        }
      }
    };

    fetchCardRequests();
  }, [activeTab, assetType]); // assetType 의존성 추가

  // BMB 가격 정보 불러오기
  useEffect(() => {
    const fetchBmbPrice = async () => {
      try {
        setPriceLoading(true);
        setPriceError(null);

        const response = await fetch("/api/price/bmb", {
          next: { revalidate: 30 }, // 30초 캐시
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "가격 정보를 불러오는데 실패했습니다.");
        }

        const data = await response.json();

        if (data.error) {
          setPriceError("가격 정보를 불러올 수 없습니다.");
          return;
        }

        setBmbPrice({
          price: data.price,
          usdtPrice: data.usdtPrice,
          usdtKrwPrice: data.usdtKrwPrice,
        });
      } catch (err) {
        console.error("Error fetching BMB price:", err);
        setPriceError("가격 정보를 불러올 수 없습니다.");
      } finally {
        setPriceLoading(false);
      }
    };

    fetchBmbPrice();
    // 30초마다 업데이트
    const interval = setInterval(fetchBmbPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString("ko-KR");
  };

  const formatTotalPrice = (price: string, amount: number) => {
    return (parseFloat(price) * amount).toLocaleString("ko-KR");
  };

  return (
    <PageContainer>
      <Header />
      <MainContent>
        <ContentWrapper>
          <Title>OTC 거래</Title>

          {/* BMB 가격 정보 섹션 추가 */}
          {!priceLoading && !priceError && bmbPrice.price !== null && (
            <PriceInfoSection>
              <PriceInfoItem>
                <PriceLabel>BMB/USDT</PriceLabel>
                <PriceValue>
                  {bmbPrice.usdtPrice ? bmbPrice.usdtPrice.toFixed(4) : "N/A"}
                </PriceValue>
                <PriceUnit>USDT</PriceUnit>
              </PriceInfoItem>
              <PriceInfoItem>
                <PriceLabel>BMB/KRW (LBANK)</PriceLabel>
                <PriceValue>
                  {bmbPrice.price
                    ? Math.round(bmbPrice.price).toLocaleString("ko-KR")
                    : "N/A"}
                </PriceValue>
                <PriceUnit>원</PriceUnit>
              </PriceInfoItem>
              <PriceInfoItem>
                <PriceLabel>USDT/KRW</PriceLabel>
                <PriceValue>
                  {bmbPrice.usdtKrwPrice
                    ? Math.round(bmbPrice.usdtKrwPrice).toLocaleString("ko-KR")
                    : "N/A"}
                </PriceValue>
                <PriceUnit>원</PriceUnit>
              </PriceInfoItem>
            </PriceInfoSection>
          )}

          {/* 자산 종류 선택 컴포넌트 */}
          <AssetSelectorContainer>
            <AssetButton
              $active={assetType === "BMB"}
              onClick={() => handleAssetTypeChange("BMB")}
            >
              BMB
            </AssetButton>
            <AssetButton
              $active={assetType === "MOVL"}
              onClick={() => handleAssetTypeChange("MOVL")}
            >
              MOVL
            </AssetButton>
            <AssetButton
              $active={assetType === "WBMB"}
              onClick={() => handleAssetTypeChange("WBMB")}
            >
              WBMB
            </AssetButton>
            <AssetButton
              $active={assetType === "SBMB"}
              onClick={() => handleAssetTypeChange("SBMB")}
            >
              SBMB
            </AssetButton>
          </AssetSelectorContainer>

          {/* 기존 TabContainer */}
          <TabContainer>
            <TabButton
              $active={activeTab === "orderbook"}
              onClick={() => setActiveTab("orderbook")}
            >
              호가형(소액)
            </TabButton>
            <TabButton
              $active={activeTab === "card"}
              onClick={() => setActiveTab("card")}
            >
              카드형(일괄)
            </TabButton>
          </TabContainer>

          <TabContent>
            {activeTab === "orderbook" && (
              <>
                <OrderBookSection>
                  <OrderBookTitle>호가</OrderBookTitle>
                  {listedLoading && (
                    <OrderBookPlaceholder>
                      호가 정보를 불러오는 중...
                    </OrderBookPlaceholder>
                  )}
                  {listedError && (
                    <OrderBookPlaceholder style={{ color: "#dc2626" }}>
                      {listedError}
                    </OrderBookPlaceholder>
                  )}
                  {!listedLoading && !listedError && (
                    <>
                      {orderBookLevels.length > 0 ? (
                        <OrderBookList>
                          {(() => {
                            const maxVolume = getMaxVolume(orderBookLevels);

                            return orderBookLevels.map((level, index) => {
                              const barWidth =
                                (level.totalAmount / maxVolume) * 100;
                              const priceNum = parseFloat(level.price);

                              return (
                                <OrderBookItem
                                  key={`${level.id}-${index}`}
                                  onClick={() => {
                                    router.push(
                                      `/otc/buy/apply?mode=free&assetType=${assetType}&price=${level.price}`
                                    );
                                  }}
                                  style={{ cursor: "pointer" }}
                                >
                                  {/* 가격 (막대 그래프 밖, 왼쪽 고정) */}
                                  <OrderBookItemPrice>
                                    {formatPrice(level.price)}
                                  </OrderBookItemPrice>

                                  {/* 막대 그래프와 물량 영역 */}
                                  <OrderBookItemBarContainer>
                                    {/* 배경 막대 그래프 */}
                                    <OrderBookBar $width={barWidth} />

                                    {/* 물량 (막대 그래프 위에 표시) */}
                                    <OrderBookItemRight>
                                      <OrderBookItemVolume>
                                        {level.totalAmount} Mo
                                        {level.requestCount > 1 && (
                                          <OrderBookItemCount>
                                            ({level.requestCount}건)
                                          </OrderBookItemCount>
                                        )}
                                      </OrderBookItemVolume>
                                    </OrderBookItemRight>
                                  </OrderBookItemBarContainer>
                                </OrderBookItem>
                              );
                            });
                          })()}
                        </OrderBookList>
                      ) : (
                        <OrderBookPlaceholder>
                          등록된 호가가 없습니다.
                        </OrderBookPlaceholder>
                      )}
                    </>
                  )}
                </OrderBookSection>
                <ButtonContainer>
                  <BuyButtonLink
                    href={`/otc/buy/apply?mode=free&assetType=${assetType}`}
                  >
                    <BuyButton>구매하기</BuyButton>
                  </BuyButtonLink>
                  <SellButtonLink
                    href={`/otc/sell/apply?assetType=${assetType}`}
                  >
                    <SellButton>판매하기</SellButton>
                  </SellButtonLink>
                </ButtonContainer>
              </>
            )}

            {activeTab === "card" && (
              <>
                {cardLoading && (
                  <EmptyState>카드형 정보를 불러오는 중...</EmptyState>
                )}
                {cardError && (
                  <EmptyState style={{ color: "#dc2626" }}>
                    {cardError}
                  </EmptyState>
                )}
                {!cardLoading && !cardError && (
                  <>
                    {cardRequests.length > 0 ? (
                      <CardGrid>
                        {cardRequests.map((card) => {
                          const priceNum = parseFloat(card.price);
                          const amountNum = card.amount;

                          return (
                            <Card
                              key={card.id}
                              href={`/otc/buy/apply?mode=card&price=${priceNum}&amount=${amountNum}&assetType=${assetType}`}
                            >
                              <CardHeader>
                                <CardPrice>
                                  {formatPrice(card.price)}원
                                </CardPrice>
                                <CardAmount>{card.amount} Mo</CardAmount>
                              </CardHeader>
                              <CardInfo>
                                <CardInfoRow>
                                  <CardLabel>총 금액</CardLabel>
                                  <CardValue>
                                    {formatTotalPrice(card.price, card.amount)}
                                    원
                                  </CardValue>
                                </CardInfoRow>
                                <CardInfoRow>
                                  <CardLabel>회관</CardLabel>
                                  <CardValue>{card.branch}</CardValue>
                                </CardInfoRow>
                                <CardInfoRow>
                                  <CardLabel>상태</CardLabel>
                                  <CardValue>
                                    {STATUS_LABELS[
                                      card.status as keyof typeof STATUS_LABELS
                                    ] || card.status}
                                  </CardValue>
                                </CardInfoRow>
                              </CardInfo>
                            </Card>
                          );
                        })}
                      </CardGrid>
                    ) : (
                      <EmptyState>등록된 판매 정보가 없습니다.</EmptyState>
                    )}
                  </>
                )}
              </>
            )}
          </TabContent>
        </ContentWrapper>
      </MainContent>
      <Footer />
    </PageContainer>
  );
}

// 로딩 컴포넌트
const LoadingFallback = () => (
  <PageContainer>
    <Header />
    <MainContent>
      <ContentWrapper>
        <Title>OTC 거래</Title>
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          로딩 중...
        </div>
      </ContentWrapper>
    </MainContent>
    <Footer />
  </PageContainer>
);

export default function OTCPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OTCContent />
    </Suspense>
  );
}
