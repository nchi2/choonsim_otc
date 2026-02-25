"use client";

import { useState, useEffect, Suspense } from "react";
import styled from "styled-components";
import Link from "next/link";
import Header from "@/components/Header";
import OTCSection from "../page/components/OTCSection";
import Footer from "@/components/Footer";
import { STATUS_LABELS } from "@/lib/constants";
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

// 컬러 팔레트
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

// 자산 선택기 - 드롭다운 스타일
const AssetSelectorWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;

  @media (min-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const AssetDropdown = styled.div`
  position: relative;
  width: 100%;

  @media (min-width: 768px) {
    width: 180px;
  }
`;

const AssetDropdownButton = styled.button<{ $isOpen: boolean }>`
  width: 100%;
  height: 40px;
  padding: 0 16px;
  background-color: #ffffff;
  border: 1.5px solid ${COLORS.primaryPurple};
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${COLORS.primaryPurple};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(149, 128, 180, 0.1);

  &:hover {
    background-color: ${COLORS.borderLightPurple};
  }

  &::after {
    content: "▼";
    font-size: 16px;
    transition: transform 0.2s;
    transform: ${(props) =>
      props.$isOpen ? "rotate(180deg)" : "rotate(0deg)"};
  }

  @media (min-width: 768px) {
    height: auto;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border-width: 2px;
    box-shadow: none;

    &::after {
      font-size: 0.75rem;
    }
  }
`;

const AssetDropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background-color: #ffffff;
  border: 2px solid ${COLORS.primaryPurple};
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(149, 128, 180, 0.15);
  z-index: 10;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
  overflow: hidden;
`;

const AssetDropdownItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #ffffff;
  border: none;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${COLORS.primaryPurple};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.borderLightPurple};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${COLORS.borderLightPurple};
  }
`;

// 탭 네비게이션
const TabContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 0;
  border-bottom: none;
  margin-bottom: 0;

  @media (min-width: 768px) {
    border-bottom: 2px solid ${COLORS.borderLightPurple};
    margin-bottom: 2rem;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  height: 44px;
  padding: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => (props.$active ? COLORS.primaryPurple : "#6b7280")};
  background-color: ${(props) => (props.$active ? "#ffffff" : "#E5E7EB")};
  border: none;
  border-top-left-radius: ${(props) => (props.$active ? "8px" : "8px")};
  border-top-right-radius: ${(props) => (props.$active ? "8px" : "8px")};
  border-bottom: ${(props) =>
    props.$active ? `3px solid ${COLORS.primaryPurple}` : "none"};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${COLORS.primaryPurple};
    background-color: ${(props) => (props.$active ? "#ffffff" : "#f3f4f6")};
  }

  @media (min-width: 768px) {
    height: auto;
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    border-radius: 0;
    border-bottom: 4px solid
      ${(props) => (props.$active ? COLORS.primaryPurple : "transparent")};

    &:hover {
      background-color: ${(props) => (props.$active ? "#ffffff" : "#f3f4f6")};
    }
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1.25rem 2rem;
  }
`;

const TabContent = styled.div`
  width: 100%;
`;

// 호가 테이블 섹션
const OrderBookCard = styled.div`
  background-color: #ffffff;
  border-radius: 0;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (min-width: 768px) {
    border-radius: 0.75rem;
    padding: 2rem;
    margin-bottom: 2rem;
    gap: 0;
  }

  @media (min-width: 768px) {
    padding: 2.5rem;
  }
`;

const OrderBookHeader = styled.div`
  margin-bottom: 0;

  @media (min-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const OrderBookTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }

  @media (min-width: 768px) {
    font-size: 1.75rem;
  }
`;

const OrderBookDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

// 모바일용 호가 카드 리스트
const OrderBookList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 768px) {
    display: none;
  }
`;

const OrderBookCardItem = styled.div`
  width: 100%;
  background-color: #ffffff;
  border: 1.5px solid ${COLORS.borderLightPurple};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(149, 128, 180, 0.1);

  &:hover {
    border-color: ${COLORS.lightPurple};
    box-shadow: 0 2px 6px rgba(149, 128, 180, 0.15);
  }
`;

const OrderBookCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const OrderBookCardPrice = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${COLORS.primaryPurple};
`;

const OrderBookCardVolume = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const OrderBookCardBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 8px;
  background-color: ${COLORS.borderLightPurple};
  border-radius: 4px;
  overflow: hidden;
`;

const OrderBookCardBar = styled.div<{ $width: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${(props) => props.$width}%;
  background: linear-gradient(
    90deg,
    ${COLORS.lightPurple} 0%,
    ${COLORS.primaryPurple} 100%
  );
  transition: width 0.3s ease;
  border-radius: 4px;
`;

// 데스크톱용 테이블 (모바일에서 숨김)
const OrderBookTable = styled.div`
  display: none;

  @media (min-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
  }
`;

const OrderBookTableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 2px solid ${COLORS.borderLightPurple};
  margin-bottom: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
`;

const OrderBookTableHeaderCell = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${COLORS.primaryPurple};
  text-align: left;

  &:nth-child(3) {
    @media (max-width: 640px) {
      display: none;
    }
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const OrderBookTableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 1rem;
  padding: 1rem;
  background-color: #ffffff;
  border: 2px solid ${COLORS.borderLightPurple};
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.lightPurple};
    box-shadow: 0 4px 12px rgba(149, 128, 180, 0.15);
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
`;

const OrderBookTableCell = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #434392;

  &:nth-child(1) {
    font-weight: 700;
    color: ${COLORS.primaryPurple};
  }

  &:nth-child(3) {
    @media (max-width: 640px) {
      display: none;
    }
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const OrderBookBarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 24px;
  background-color: ${COLORS.borderLightPurple};
  border-radius: 12px;
  overflow: hidden;
`;

const OrderBookBar = styled.div<{ $width: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${(props) => props.$width}%;
  background: linear-gradient(
    90deg,
    ${COLORS.lightPurple} 0%,
    ${COLORS.primaryPurple} 100%
  );
  transition: width 0.3s ease;
  border-radius: 12px;
`;

const OrderBookPlaceholder = styled.div`
  height: 80px;
  padding: 0;
  background-color: #f3f4f6;
  border: none;
  border-radius: 8px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 768px) {
    height: auto;
    padding: 3rem 2rem;
    background-color: #ffffff;
    border: 2px solid ${COLORS.borderLightPurple};
    border-radius: 0.75rem;
    font-size: 0.875rem;
  }

  @media (min-width: 768px) {
    padding: 4rem 3rem;
    font-size: 1rem;
  }
`;

// CTA 섹션
const CTASection = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (min-width: 768px) {
    padding: 2rem;
    gap: 0;
  }

  @media (min-width: 768px) {
    padding: 2.5rem;
  }
`;

const CTATitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0;

  @media (min-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CTAButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 20px;

  @media (min-width: 768px) {
    gap: 1rem;
  }

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: center;
    gap: 1.5rem;
  }
`;

// 카드형 탭 전용 버튼 컨테이너
const CardCTAButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-bottom: 20px;
`;

const CTAButton = styled(Link)`
  width: 100%;
  height: 44px;
  padding: 0;
  font-size: 16px;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  @media (min-width: 768px) {
    height: auto;
    padding: 1rem 2rem;
    font-size: 1rem;
  }

  @media (min-width: 768px) {
    width: auto;
    min-width: 180px;
    font-size: 1.125rem;
    padding: 1.25rem 2.5rem;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CTABuyButton = styled(CTAButton)`
  background-color: ${COLORS.primaryPurple};
  color: white;
  border: 2px solid ${COLORS.primaryPurple};

  &:hover {
    background-color: ${COLORS.accentPurple};
    border-color: ${COLORS.accentPurple};
  }
`;

const CTASellButton = styled(CTAButton)`
  background-color: #ffffff;
  color: ${COLORS.primaryPurple};
  border: 2px solid ${COLORS.primaryPurple};

  &:hover {
    background-color: ${COLORS.borderLightPurple};
  }
`;

// 카드형 콘텐츠 헤더
const CardTypeHeader = styled.div`
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const CardTypeTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 24px;
  }
`;

const CardTypeDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

// 카드형 거래 카드 그리드
const CardGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 768px) {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    justify-content: flex-start;
  }
`;

// 카드형 거래 카드
const TradeCard = styled.div`
  width: 100%;
  height: auto;
  min-height: 280px;
  background-color: #ffffff;
  border: 1px solid ${COLORS.borderLightPurple};
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    box-shadow: 0 6px 24px rgba(149, 128, 180, 0.1);
    transform: translateY(-2px);
  }

  @media (min-width: 768px) {
    width: 240px;
    height: 280px;
    min-height: 280px;
  }
`;

// 카드 헤더 (신청번호 + 상태 배지)
const TradeCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
`;

const TradeCardAmount = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${COLORS.accentPurple};
  line-height: 1.2;

  @media (min-width: 768px) {
    font-size: 22px;
  }
`;

// 신청 번호 스타일 추가
const TradeCardId = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS.gray600};
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    font-size: 13px;
  }
`;

// 원화 가격 스타일
const TradeCardPriceKRW = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${COLORS.primaryPurple};
  line-height: 1.4;
  margin-bottom: 0.25rem;

  @media (min-width: 768px) {
    font-size: 20px;
    margin-bottom: 0.25rem;
  }
`;

// 판매 수량 스타일
const TradeCardAmountLabel = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${COLORS.gray700};
  line-height: 1.4;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    font-size: 18px;
    margin-bottom: 0.5rem;
  }
`;

// 가격과 수량을 감싸는 컨테이너 (모바일에서 row 형태)
const PriceAmountRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  ${TradeCardPriceKRW} {
    margin-bottom: 0;
  }

  ${TradeCardAmountLabel} {
    margin-bottom: 0;
    text-align: right;
  }

  @media (min-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;

    ${TradeCardPriceKRW} {
      margin-bottom: 0.25rem;
    }

    ${TradeCardAmountLabel} {
      margin-bottom: 0.5rem;
      text-align: left;
    }
  }
`;

// 상태 배지 스타일 추가
const StatusBadge = styled.div<{ $status: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  ${(props) => {
    switch (props.$status) {
      case "LISTED":
      case "대기중":
        return `
          background-color: ${COLORS.borderLightPurple};
          color: ${COLORS.primaryPurple};
        `;
      case "MATCHED":
      case "진행중":
        return `
          background-color: #D4E9FF;
          color: #2563EB;
        `;
      case "COMPLETED":
      case "완료":
        return `
          background-color: #F1F5F9;
          color: #64748B;
        `;
      default:
        return `
          background-color: ${COLORS.borderLightPurple};
          color: ${COLORS.primaryPurple};
        `;
    }
  }}

  @media (min-width: 768px) {
    font-size: 13px;
    padding: 5px 14px;
  }
`;

// 카드 세부 정보
const TradeCardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  margin-bottom: 1rem;
`;

const TradeCardTotal = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #6b7280;
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: 18px;
  }
`;

const TradeCardBranch = styled.div`
  font-size: 13px;
  color: ${COLORS.lightPurple};
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

// 구매 버튼
const TradeCardButton = styled.button<{ $status: string }>`
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;

  ${(props) => {
    const isCompleted =
      props.$status === "COMPLETED" || props.$status === "완료";
    if (isCompleted) {
      return `
        background-color: #E5E7EB;
        color: #9CA3AF;
        cursor: not-allowed;
      `;
    }
    return `
      background-color: ${COLORS.accentPurple};
      color: #ffffff;
      
      &:hover {
        background-color: ${COLORS.primaryPurple};
      }
      
      &:active {
        transform: scale(0.98);
      }
    `;
  }}
`;

const EmptyState = styled.div`
  padding: 3rem 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  background-color: #ffffff;
  border: 2px solid ${COLORS.borderLightPurple};
  border-radius: 0.75rem;

  @media (min-width: 768px) {
    padding: 4rem 3rem;
    font-size: 1rem;
  }
`;

// 안내 박스 스타일 추가 (OrderBookPlaceholder 아래에 추가)
const NoticeBox = styled.div`
  background-color: #fef3c7;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: center;

  @media (min-width: 768px) {
    padding: 20px;
    margin-bottom: 32px;
  }
`;

const NoticeText = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  margin: 0;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

// 차트 섹션 스타일
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

  @media (min-width: 768px) {
    font-size: 1.5rem;
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

// 인터페이스
interface OrderBookLevel {
  id: number;
  assetType: string;
  price: string;
  totalAmount: number;
  requestCount: number;
  updatedAt: string;
}

interface SellerRequest {
  id: number;
  name?: string;
  phone?: string;
  amount: number;
  price: string;
  allowPartial: boolean;
  branch: string;
  assetType?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RatioDataPoint {
  time: number;
  btcUsdtPrice: number;
  bmbUsdtPrice: number;
  ratio: number;
  date: string;
  source: "LBANK" | "CHUNSIM"; // 데이터 출처
}

function OTCContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orderbook" | "card">("orderbook");
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);

  const [assetType, setAssetType] = useState<string>(() => {
    return searchParams.get("asset") || "BMB";
  });

  const [orderBookLevels, setOrderBookLevels] = useState<OrderBookLevel[]>([]);
  const [listedLoading, setListedLoading] = useState(true);
  const [listedError, setListedError] = useState<string | null>(null);

  const [cardRequests, setCardRequests] = useState<SellerRequest[]>([]);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);

  // BTC/BMB 비율 차트 데이터
  const [ratioData, setRatioData] = useState<RatioDataPoint[]>([]);
  const [ratioLoading, setRatioLoading] = useState(true);
  const [ratioError, setRatioError] = useState<string | null>(null);
  const [latestRatio, setLatestRatio] = useState<number | null>(null);
  const [latestBtcPrice, setLatestBtcPrice] = useState<number | null>(null);
  const [latestBmbPrice, setLatestBmbPrice] = useState<number | null>(null);

  // 차트 확대/축소 상태 (1: 30일, 2: 90일, 3: 180일, 4: 365일, 5: 전체)
  const [zoomLevel, setZoomLevel] = useState<number>(2); // 기본값: 90일

  const getMaxVolume = (levels: OrderBookLevel[]) => {
    if (levels.length === 0) return 1;
    return Math.max(...levels.map((level) => level.totalAmount));
  };

  const handleAssetTypeChange = (newAssetType: string) => {
    setAssetType(newAssetType);
    setIsAssetDropdownOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("asset", newAssetType);
    router.push(`/otc?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const assetFromUrl = searchParams.get("asset") || "BMB";
    if (assetFromUrl !== assetType) {
      setAssetType(assetFromUrl);
    }
  }, [searchParams, assetType]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-asset-dropdown]")) {
        setIsAssetDropdownOpen(false);
      }
    };

    if (isAssetDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAssetDropdownOpen]);

  useEffect(() => {
    const fetchOrderBookLevels = async () => {
      if (activeTab === "orderbook") {
        try {
          setListedLoading(true);
          setListedError(null);

          const response = await fetch(
            `/api/otc/orderbook-levels?assetType=${assetType}`,
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(
              data.error || "호가 정보를 불러오는데 실패했습니다.",
            );
          }

          const data = await response.json();
          setOrderBookLevels(data);
        } catch (err) {
          console.error("Error fetching orderbook levels:", err);
          setListedError(
            err instanceof Error
              ? err.message
              : "호가 정보를 불러오는데 실패했습니다.",
          );
        } finally {
          setListedLoading(false);
        }
      }
    };

    fetchOrderBookLevels();
  }, [activeTab, assetType]);

  useEffect(() => {
    const fetchCardRequests = async () => {
      if (activeTab === "card") {
        try {
          setCardLoading(true);
          setCardError(null);

          const response = await fetch(
            `/api/otc/card-requests?assetType=${assetType}&status=LISTED`,
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(
              data.error || "카드형 정보를 불러오는데 실패했습니다.",
            );
          }

          const data = await response.json();
          setCardRequests(data);
        } catch (err) {
          console.error("Error fetching card requests:", err);
          setCardError(
            err instanceof Error
              ? err.message
              : "카드형 정보를 불러오는데 실패했습니다.",
          );
        } finally {
          setCardLoading(false);
        }
      }
    };

    fetchCardRequests();
  }, [activeTab, assetType]);

  // BTC/BMB 비율 차트 데이터 가져오기
  useEffect(() => {
    const fetchRatioData = async () => {
      try {
        setRatioLoading(true);
        setRatioError(null);

        // 기본값 사용 (500개, 1일 단위) - 너무 크면 API가 실패할 수 있음
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
    // 5분마다 데이터 갱신
    const interval = setInterval(fetchRatioData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString("ko-KR");
  };

  const formatTotalPrice = (price: string, amount: number) => {
    return (parseFloat(price) * amount).toLocaleString("ko-KR");
  };

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
        return null; // 전체
      default:
        return 90;
    }
  };

  // 차트 데이터 포맷팅
  const formatChartData = (data: RatioDataPoint[]) => {
    const days = getDaysForZoomLevel(zoomLevel);

    // 확대/축소 적용
    let displayData = data;
    if (days !== null && days > 0) {
      // 최근 N일 데이터만 표시
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

  // 확대/축소 버튼 핸들러
  const handleZoomIn = () => {
    // + 버튼: 확대 (더 가까이, 더 적은 데이터) - zoomLevel 감소
    if (zoomLevel > 1) {
      setZoomLevel(zoomLevel - 1);
    }
  };

  const handleZoomOut = () => {
    // - 버튼: 축소 (더 넓게, 더 많은 데이터) - zoomLevel 증가
    if (zoomLevel < 5) {
      setZoomLevel(zoomLevel + 1);
    }
  };

  // 커스텀 Tooltip 컴포넌트
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

  const assetTypes = ["BMB", "MOVL", "WBMB", "SBMB"];

  return (
    <PageContainer>
      <Header />
      <OTCSection showTradeButton={false} />

      <MainContent>
        <ContentWrapper>
          {/* 자산 선택기 - 드롭다운 */}
          <AssetSelectorWrapper>
            <AssetDropdown data-asset-dropdown>
              <AssetDropdownButton
                $isOpen={isAssetDropdownOpen}
                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
              >
                {assetType}
              </AssetDropdownButton>
              <AssetDropdownMenu $isOpen={isAssetDropdownOpen}>
                {assetTypes.map((type) => (
                  <AssetDropdownItem
                    key={type}
                    onClick={() => handleAssetTypeChange(type)}
                  >
                    {type}
                  </AssetDropdownItem>
                ))}
              </AssetDropdownMenu>
            </AssetDropdown>
          </AssetSelectorWrapper>

          {/* 탭 네비게이션 */}
          <TabContainer>
            <TabButton
              $active={activeTab === "orderbook"}
              onClick={() => setActiveTab("orderbook")}
            >
              호가형(소액 가능)
            </TabButton>
            <TabButton
              $active={activeTab === "card"}
              onClick={() => setActiveTab("card")}
            >
              카드형(맞춤 거래)
            </TabButton>
          </TabContainer>

          <TabContent>
            {activeTab === "orderbook" && (
              <>
                <OrderBookCard>
                  <OrderBookHeader>
                    <OrderBookTitle>호가형 거래</OrderBookTitle>
                    <OrderBookDescription>
                      소액 거래도 가능한 호가형 거래입니다. 원하는 가격과 수량을
                      선택하여 거래를 진행할 수 있습니다.
                    </OrderBookDescription>
                  </OrderBookHeader>

                  {/* 안내 박스 추가 */}
                  <NoticeBox>
                    <NoticeText>
                      ⚠️ 현재 데이터는 예시입니다.
                      <br />
                      아직 공식 오픈하지 않은 상태이므로 신청하셔도 반영되지
                      않습니다.
                    </NoticeText>
                  </NoticeBox>

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
                        <>
                          {/* 모바일용 카드 리스트 */}
                          <OrderBookList>
                            {(() => {
                              const maxVolume = getMaxVolume(orderBookLevels);

                              return orderBookLevels.map((level, index) => {
                                const barWidth =
                                  (level.totalAmount / maxVolume) * 100;

                                return (
                                  <OrderBookCardItem
                                    key={`mobile-${level.id}-${index}`}
                                    onClick={() => {
                                      router.push(
                                        `/otc/buy/apply?mode=free&assetType=${assetType}&price=${level.price}`,
                                      );
                                    }}
                                  >
                                    <OrderBookCardHeader>
                                      <OrderBookCardPrice>
                                        {formatPrice(level.price)}원
                                      </OrderBookCardPrice>
                                      <OrderBookCardVolume>
                                        {level.totalAmount} Mo
                                        {level.requestCount > 1 && (
                                          <span
                                            style={{
                                              fontSize: "12px",
                                              color: "#9ca3af",
                                              marginLeft: "4px",
                                              fontWeight: "normal",
                                            }}
                                          >
                                            ({level.requestCount}건)
                                          </span>
                                        )}
                                      </OrderBookCardVolume>
                                    </OrderBookCardHeader>
                                    <OrderBookCardBarContainer>
                                      <OrderBookCardBar $width={barWidth} />
                                    </OrderBookCardBarContainer>
                                  </OrderBookCardItem>
                                );
                              });
                            })()}
                          </OrderBookList>

                          {/* 데스크톱용 테이블 */}
                          <OrderBookTable>
                            <OrderBookTableHeader>
                              <OrderBookTableHeaderCell>
                                가격 (KRW/Mo)
                              </OrderBookTableHeaderCell>
                              <OrderBookTableHeaderCell>
                                총 수량 (Mo)
                              </OrderBookTableHeaderCell>
                              <OrderBookTableHeaderCell>
                                거래량 막대
                              </OrderBookTableHeaderCell>
                            </OrderBookTableHeader>

                            {(() => {
                              const maxVolume = getMaxVolume(orderBookLevels);

                              return orderBookLevels.map((level, index) => {
                                const barWidth =
                                  (level.totalAmount / maxVolume) * 100;

                                return (
                                  <OrderBookTableRow
                                    key={`desktop-${level.id}-${index}`}
                                    onClick={() => {
                                      router.push(
                                        `/otc/buy/apply?mode=free&assetType=${assetType}&price=${level.price}`,
                                      );
                                    }}
                                  >
                                    <OrderBookTableCell>
                                      {formatPrice(level.price)}원
                                    </OrderBookTableCell>
                                    <OrderBookTableCell>
                                      {level.totalAmount} Mo
                                      {level.requestCount > 1 && (
                                        <span
                                          style={{
                                            fontSize: "0.75rem",
                                            color: "#9ca3af",
                                            marginLeft: "0.5rem",
                                          }}
                                        >
                                          ({level.requestCount}건)
                                        </span>
                                      )}
                                    </OrderBookTableCell>
                                    <OrderBookTableCell>
                                      <OrderBookBarContainer>
                                        <OrderBookBar $width={barWidth} />
                                      </OrderBookBarContainer>
                                    </OrderBookTableCell>
                                  </OrderBookTableRow>
                                );
                              });
                            })()}
                          </OrderBookTable>
                        </>
                      ) : (
                        <OrderBookPlaceholder>
                          등록된 호가가 없습니다.
                        </OrderBookPlaceholder>
                      )}
                    </>
                  )}

                  <CTAButtonContainer>
                    <CTABuyButton
                      href={`/otc/buy/apply?mode=free&assetType=${assetType}`}
                    >
                      구매 신청하기
                    </CTABuyButton>
                    <CTASellButton
                      href={`/otc/sell/apply?assetType=${assetType}`}
                    >
                      판매 신청하기
                    </CTASellButton>
                  </CTAButtonContainer>
                </OrderBookCard>
              </>
            )}

            {activeTab === "card" && (
              <>
                <CardTypeHeader>
                  <CardTypeTitle>카드형 맞춤 거래</CardTypeTitle>
                  <CardTypeDescription>
                    맞춤형 거래 조건을 확인하고 원하는 매물을 선택하여
                    거래하세요. 각 카드의 구매하기 버튼을 클릭하여 신청할 수
                    있습니다.
                  </CardTypeDescription>
                </CardTypeHeader>

                {/* 안내 박스 추가 */}
                <NoticeBox>
                  <NoticeText>
                    ⚠️ 현재 데이터는 예시입니다.
                    <br />
                    아직 공식 오픈하지 않은 상태이므로 신청하셔도 반영되지
                    않습니다.
                  </NoticeText>
                </NoticeBox>

                <CardCTAButtonContainer>
                  <CTASellButton
                    href={`/otc/sell/apply?assetType=${assetType}`}
                  >
                    판매 신청하기
                  </CTASellButton>
                </CardCTAButtonContainer>

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
                          const totalPrice = priceNum * amountNum;
                          const statusLabel =
                            STATUS_LABELS[
                              card.status as keyof typeof STATUS_LABELS
                            ] || card.status;

                          const isCompleted =
                            card.status === "COMPLETED" ||
                            card.status === "완료";

                          return (
                            <TradeCard
                              key={card.id}
                              onClick={() => {
                                if (!isCompleted) {
                                  router.push(
                                    `/otc/buy/apply?mode=card&price=${priceNum}&amount=${amountNum}&assetType=${assetType}`,
                                  );
                                }
                              }}
                            >
                              {/* 상단: 좌측 신청번호, 우측 현재 상태 */}
                              <TradeCardHeader>
                                <TradeCardId>신청 번호 #{card.id}</TradeCardId>
                                <StatusBadge $status={card.status}>
                                  {statusLabel}
                                </StatusBadge>
                              </TradeCardHeader>

                              <TradeCardInfo>
                                {/* 가격과 수량 */}
                                <PriceAmountRow>
                                  <TradeCardPriceKRW>
                                    {formatPrice(card.price)}원
                                  </TradeCardPriceKRW>
                                  <TradeCardAmountLabel>
                                    <span
                                      style={{ display: "none" }}
                                      className="mobile-hide"
                                    >
                                      판매 수량 :{" "}
                                    </span>
                                    {card.amount} Mo
                                  </TradeCardAmountLabel>
                                </PriceAmountRow>

                                {/* 총 거래금액 */}
                                <TradeCardTotal>
                                  총 금액:{" "}
                                  {formatTotalPrice(card.price, card.amount)}원
                                </TradeCardTotal>
                              </TradeCardInfo>

                              {/* 구매하기 버튼 */}
                              {isCompleted ? (
                                <TradeCardButton
                                  $status={card.status}
                                  disabled
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  거래 완료됨
                                </TradeCardButton>
                              ) : (
                                <TradeCardButton
                                  $status={card.status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/otc/buy/apply?mode=card&price=${priceNum}&amount=${amountNum}&assetType=${assetType}`,
                                    );
                                  }}
                                >
                                  구매하기
                                </TradeCardButton>
                              )}
                            </TradeCard>
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

          {/* BTC/BMB 비율 차트 섹션 */}
          <ChartCard>
            <ChartHeader>
              <ChartTitle>BTC/BMB 비율 차트</ChartTitle>
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
      <Footer />
    </PageContainer>
  );
}

const LoadingFallback = () => (
  <PageContainer>
    <Header />
    <MainContent>
      <ContentWrapper>
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
