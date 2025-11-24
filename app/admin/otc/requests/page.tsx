"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/layouts/PageLayout";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { REQUEST_STATUS, STATUS_LABELS } from "@/lib/constants";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #111827;

  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
`;

const TableHeader = styled.thead`
  background-color: #f9fafb;
`;

const TableHeaderRow = styled.tr`
  border-bottom: 2px solid #e5e7eb;
`;

const TableHeaderCell = styled.th`
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;

  @media (min-width: 768px) {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #111827;

  @media (min-width: 768px) {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;

  ${(props) => {
    switch (props.$status) {
      case "PENDING":
        return `
          background-color: #fef3c7;
          color: #92400e;
        `;
      case "LISTED":
        return `
          background-color: #dbeafe;
          color: #1e40af;
        `;
      case "MATCHED":
        return `
          background-color: #d1fae5;
          color: #065f46;
        `;
      case "COMPLETED":
        return `
          background-color: #e5e7eb;
          color: #374151;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #6b7280;
        `;
    }
  }}

  @media (min-width: 768px) {
    font-size: 0.875rem;
    padding: 0.375rem 0.875rem;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
  font-size: 1rem;
`;

const ErrorText = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #dc2626;
  font-size: 1rem;
`;

const EmptyText = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
  font-size: 1rem;
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #dc2626;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 1rem;

  &:hover {
    background-color: #b91c1c;
  }
`;

// 자산 종류 필터 스타일 추가
const FilterContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;

  @media (min-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: #ffffff;
  color: #111827;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #3b82f6;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// 상태 변경 select 스타일 추가
const StatusSelect = styled.select`
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.75rem;
  background-color: #ffffff;
  color: #111827;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #3b82f6;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (min-width: 768px) {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }
`;

// 주간 재정비 버튼 스타일 추가
const WeeklyResetButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #f59e0b;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-left: 1rem;

  &:hover {
    background-color: #d97706;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 2rem;
  }
`;

// 섹션 제목 스타일 추가
const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  color: #111827;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;

  @media (min-width: 768px) {
    font-size: 1.75rem;
    margin-top: 4rem;
  }
`;

// 매칭 섹션 스타일 추가
const MatchSection = styled.div`
  background-color: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const MatchSectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #065f46;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 1.75rem;
  }
`;

// 모달 스타일 추가
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  display: ${(props) => (props.$isOpen ? "flex" : "none")};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;

  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #111827;
`;

const ModalSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
`;

const ModalSectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #374151;
`;

const ModalInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const ModalInfoLabel = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

const ModalInfoValue = styled.span`
  color: #111827;
  font-weight: 600;
`;

const ConfirmButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  margin-top: 1rem;

  &:hover {
    background-color: #059669;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

// 매칭된 판매건/구매건 섹션 스타일
const MatchedSubSection = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
`;

const MatchedSubSectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #111827;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

// 클릭 가능한 행 스타일
const ClickableTableRow = styled(TableRow)`
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f9ff;
  }
`;

interface SellerRequest {
  id: number;
  name: string;
  phone: string;
  amount: number;
  remainingAmount?: number; // remainingAmount 추가
  price: string;
  allowPartial: boolean;
  branch: string;
  assetType?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface BuyerRequest {
  id: number;
  name: string;
  phone: string;
  amount: number;
  remainingAmount?: number; // remainingAmount 추가
  price: string;
  branch: string;
  assetType?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface MatchInfo {
  id: number;
  sellerRequestId: number;
  buyerRequestId: number;
  matchedAmount: number;
  matchedPrice: string;
  status: string;
  createdAt: string;
  sellerRequest: SellerRequest | null;
  buyerRequest: BuyerRequest | null;
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const [sellerRequests, setSellerRequests] = useState<SellerRequest[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [buyerLoading, setBuyerLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set());
  const [updatingBuyerStatus, setUpdatingBuyerStatus] = useState<Set<number>>(
    new Set()
  );
  const [isResetting, setIsResetting] = useState(false);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchInfo | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<SellerRequest | null>(
    null
  );
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerRequest | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);

  // 판매건 조회
  useEffect(() => {
    const fetchSellerRequests = async () => {
      try {
        setSellerLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (assetType) {
          params.set("assetType", assetType);
        }
        if (statusFilter) {
          params.set("status", statusFilter);
        }

        const url = params.toString()
          ? `/api/seller-requests?${params.toString()}`
          : "/api/seller-requests";

        const response = await fetch(url);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "데이터를 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        setSellerRequests(data);
      } catch (err) {
        console.error("Error fetching seller requests:", err);
        setError(
          err instanceof Error
            ? err.message
            : "데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setSellerLoading(false);
      }
    };

    fetchSellerRequests();
  }, [assetType, statusFilter]);

  // 구매건 조회
  useEffect(() => {
    const fetchBuyerRequests = async () => {
      try {
        setBuyerLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (assetType) {
          params.set("assetType", assetType);
        }
        if (statusFilter) {
          params.set("status", statusFilter);
        }

        const url = params.toString()
          ? `/api/buyer-requests?${params.toString()}`
          : "/api/buyer-requests";

        const response = await fetch(url);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "데이터를 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        setBuyerRequests(data);
      } catch (err) {
        console.error("Error fetching buyer requests:", err);
        setError(
          err instanceof Error
            ? err.message
            : "데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setBuyerLoading(false);
      }
    };

    fetchBuyerRequests();
  }, [assetType, statusFilter]);

  // 매칭 정보 조회
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setMatchLoading(true);

        const params = new URLSearchParams();
        if (assetType) {
          params.set("assetType", assetType);
        }
        params.set("status", REQUEST_STATUS.MATCHED); // MATCHED 상태만 조회

        const url = `/api/matches?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("매칭 정보를 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        setMatches(data);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setMatchLoading(false);
      }
    };

    fetchMatches();
  }, [assetType]); // assetType 변경 시 재조회

  // 매칭된 판매건과 구매건 필터링
  const matchedSellers = sellerRequests.filter(
    (req) => req.status === REQUEST_STATUS.MATCHED
  );
  const matchedBuyers = buyerRequests.filter(
    (req) => req.status === REQUEST_STATUS.MATCHED
  );

  // 매칭 정보 클릭 핸들러
  const handleMatchClick = (match: MatchInfo) => {
    setSelectedMatch(match);
    setIsMatchModalOpen(true);
  };

  // 판매건 클릭 핸들러
  const handleSellerClick = (seller: SellerRequest) => {
    setSelectedSeller(seller);
    setIsSellerModalOpen(true);
  };

  // 구매건 클릭 핸들러
  const handleBuyerClick = (buyer: BuyerRequest) => {
    setSelectedBuyer(buyer);
    setIsBuyerModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModals = () => {
    setIsMatchModalOpen(false);
    setIsSellerModalOpen(false);
    setIsBuyerModalOpen(false);
    setSelectedMatch(null);
    setSelectedSeller(null);
    setSelectedBuyer(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhone = (phone: string) => {
    // 연락처 마스킹 (예: 010-1234-5678 -> 010-****-5678)
    const parts = phone.split("-");
    if (parts.length === 3) {
      return `${parts[0]}-****-${parts[2]}`;
    }
    return phone;
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("ko-KR").format(numPrice);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // 판매건 상태 변경 핸들러
  const handleSellerStatusChange = async (
    requestId: number,
    newStatus: string
  ) => {
    if (updatingStatus.has(requestId)) {
      return;
    }

    try {
      setUpdatingStatus((prev) => new Set(prev).add(requestId));

      const response = await fetch(`/api/seller-request/${requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "상태 변경에 실패했습니다.");
      }

      const updatedRequest = await response.json();
      setSellerRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, ...updatedRequest } : req
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert(
        err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다."
      );
    } finally {
      setUpdatingStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // 구매건 상태 변경 핸들러
  const handleBuyerStatusChange = async (
    requestId: number,
    newStatus: string
  ) => {
    if (updatingBuyerStatus.has(requestId)) {
      return;
    }

    try {
      setUpdatingBuyerStatus((prev) => new Set(prev).add(requestId));

      const response = await fetch(`/api/buyer-request/${requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "상태 변경에 실패했습니다.");
      }

      const updatedRequest = await response.json();
      setBuyerRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, ...updatedRequest } : req
        )
      );

      // 구매건 상태가 LISTED로 변경되면 자동으로 데이터 새로고침 (매칭 후 상태 변경 반영)
      if (newStatus === REQUEST_STATUS.LISTED) {
        // 잠시 후 데이터 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error("Error updating buyer status:", err);
      alert(
        err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다."
      );
    } finally {
      setUpdatingBuyerStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // 주간 재정비 실행 핸들러
  const handleWeeklyReset = async () => {
    // 확인 다이얼로그
    const confirmed = window.confirm(
      "현재 LISTED 상태인 모든 판매 건을 '판매의사 확인중' 상태로 변경합니다.\n" +
        "이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsResetting(true);
      setError(null);

      const response = await fetch("/api/admin/weekly-reset", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "주간 재정비 처리에 실패했습니다.");
      }

      const data = await response.json();

      // 성공 메시지 표시
      alert(data.message || `${data.updatedCount}건이 변경되었습니다.`);

      // 데이터 새로고침
      const url = assetType
        ? `/api/seller-requests?assetType=${assetType}`
        : "/api/seller-requests";
      const refreshResponse = await fetch(url);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setSellerRequests(refreshData);
      }
    } catch (err) {
      console.error("Error in weekly reset:", err);
      setError(
        err instanceof Error
          ? err.message
          : "주간 재정비 처리 중 오류가 발생했습니다."
      );
      alert(
        err instanceof Error
          ? err.message
          : "주간 재정비 처리 중 오류가 발생했습니다."
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <PageLayout>
      <Container>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Title>OTC 신청 내역 관리</Title>
            <WeeklyResetButton
              onClick={handleWeeklyReset}
              disabled={isResetting || sellerLoading}
            >
              {isResetting ? "처리 중..." : "주간 재정비 실행"}
            </WeeklyResetButton>
          </div>
          <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
        </div>

        {/* 필터 컨테이너 */}
        <FilterContainer>
          <FilterLabel>자산 종류:</FilterLabel>
          <FilterSelect
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
          >
            <option value="">전체</option>
            <option value="BMB">BMB</option>
            <option value="MOVL">MOVL</option>
            <option value="WBMB">WBMB</option>
            <option value="SBMB">SBMB</option>
          </FilterSelect>

          <FilterLabel style={{ marginLeft: "1rem" }}>상태:</FilterLabel>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">전체</option>
            <option value="PENDING">대기중</option>
            <option value="LISTED">등록됨</option>
            <option value="PENDING_CONFIRMATION">판매의사 확인중</option>
            <option value="MATCHED">매칭됨</option>
            <option value="COMPLETED">완료</option>
          </FilterSelect>
        </FilterContainer>

        {/* 매칭 섹션 (최상단) */}
        <MatchSection>
          <MatchSectionTitle>✅ 매칭된 거래</MatchSectionTitle>

          {/* 매칭된 판매건 서브섹션 */}
          <MatchedSubSection>
            <MatchedSubSectionTitle>
              매칭된 판매건 ({matchedSellers.length}건)
            </MatchedSubSectionTitle>
            {sellerLoading && (
              <LoadingText>데이터를 불러오는 중...</LoadingText>
            )}
            {!sellerLoading && matchedSellers.length === 0 && (
              <EmptyText>매칭된 판매건이 없습니다.</EmptyText>
            )}
            {!sellerLoading && matchedSellers.length > 0 && (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableHeaderRow>
                      <TableHeaderCell>ID</TableHeaderCell>
                      <TableHeaderCell>성함</TableHeaderCell>
                      <TableHeaderCell>자산 종류</TableHeaderCell>
                      <TableHeaderCell>신청 수량</TableHeaderCell>
                      <TableHeaderCell>남은 수량</TableHeaderCell>
                      <TableHeaderCell>가격</TableHeaderCell>
                      <TableHeaderCell>상태</TableHeaderCell>
                    </TableHeaderRow>
                  </TableHeader>
                  <TableBody>
                    {matchedSellers.map((request) => (
                      <ClickableTableRow
                        key={request.id}
                        onClick={() => handleSellerClick(request)}
                      >
                        <TableCell>#{request.id}</TableCell>
                        <TableCell>{request.name}</TableCell>
                        <TableCell>{request.assetType || "BMB"}</TableCell>
                        <TableCell>{request.amount}</TableCell>
                        <TableCell>
                          {request.remainingAmount !== undefined
                            ? request.remainingAmount
                            : request.amount}
                        </TableCell>
                        <TableCell>{formatPrice(request.price)}원</TableCell>
                        <TableCell>
                          <StatusBadge $status={request.status}>
                            {STATUS_LABELS[
                              request.status as keyof typeof STATUS_LABELS
                            ] || request.status}
                          </StatusBadge>
                        </TableCell>
                      </ClickableTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </MatchedSubSection>

          {/* 매칭된 구매건 서브섹션 */}
          <MatchedSubSection style={{ marginTop: "1.5rem" }}>
            <MatchedSubSectionTitle>
              매칭된 구매건 ({matchedBuyers.length}건)
            </MatchedSubSectionTitle>
            {buyerLoading && <LoadingText>데이터를 불러오는 중...</LoadingText>}
            {!buyerLoading && matchedBuyers.length === 0 && (
              <EmptyText>매칭된 구매건이 없습니다.</EmptyText>
            )}
            {!buyerLoading && matchedBuyers.length > 0 && (
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableHeaderRow>
                      <TableHeaderCell>ID</TableHeaderCell>
                      <TableHeaderCell>성함</TableHeaderCell>
                      <TableHeaderCell>자산 종류</TableHeaderCell>
                      <TableHeaderCell>신청 수량</TableHeaderCell>
                      <TableHeaderCell>남은 수량</TableHeaderCell>
                      <TableHeaderCell>가격</TableHeaderCell>
                      <TableHeaderCell>상태</TableHeaderCell>
                    </TableHeaderRow>
                  </TableHeader>
                  <TableBody>
                    {matchedBuyers.map((request) => (
                      <ClickableTableRow
                        key={request.id}
                        onClick={() => handleBuyerClick(request)}
                      >
                        <TableCell>#{request.id}</TableCell>
                        <TableCell>{request.name}</TableCell>
                        <TableCell>{request.assetType || "BMB"}</TableCell>
                        <TableCell>{request.amount}</TableCell>
                        <TableCell>
                          {request.remainingAmount !== undefined
                            ? request.remainingAmount
                            : request.amount}
                        </TableCell>
                        <TableCell>{formatPrice(request.price)}원</TableCell>
                        <TableCell>
                          <StatusBadge $status={request.status}>
                            {STATUS_LABELS[
                              request.status as keyof typeof STATUS_LABELS
                            ] || request.status}
                          </StatusBadge>
                        </TableCell>
                      </ClickableTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </MatchedSubSection>

          {/* 매칭 정보 테이블 */}
          {!matchLoading && matches.length > 0 && (
            <MatchedSubSection style={{ marginTop: "1.5rem" }}>
              <MatchedSubSectionTitle>
                매칭 상세 정보 ({matches.length}건)
              </MatchedSubSectionTitle>
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableHeaderRow>
                      <TableHeaderCell>매칭 ID</TableHeaderCell>
                      <TableHeaderCell>판매자</TableHeaderCell>
                      <TableHeaderCell>구매자</TableHeaderCell>
                      <TableHeaderCell>매칭 수량</TableHeaderCell>
                      <TableHeaderCell>매칭 가격</TableHeaderCell>
                      <TableHeaderCell>총 금액</TableHeaderCell>
                      <TableHeaderCell>매칭일시</TableHeaderCell>
                      <TableHeaderCell>상태</TableHeaderCell>
                    </TableHeaderRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <ClickableTableRow
                        key={match.id}
                        onClick={() => handleMatchClick(match)}
                      >
                        <TableCell>#{match.id}</TableCell>
                        <TableCell>
                          {match.sellerRequest ? (
                            <>
                              {match.sellerRequest.name}
                              <br />
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                }}
                              >
                                판매건 #{match.sellerRequest.id}
                              </span>
                            </>
                          ) : (
                            "정보 없음"
                          )}
                        </TableCell>
                        <TableCell>
                          {match.buyerRequest ? (
                            <>
                              {match.buyerRequest.name}
                              <br />
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                }}
                              >
                                구매건 #{match.buyerRequest.id}
                              </span>
                            </>
                          ) : (
                            "정보 없음"
                          )}
                        </TableCell>
                        <TableCell>{match.matchedAmount}</TableCell>
                        <TableCell>
                          {formatPrice(match.matchedPrice)}원
                        </TableCell>
                        <TableCell>
                          {formatPrice(
                            (
                              parseFloat(match.matchedPrice) *
                              match.matchedAmount
                            ).toString()
                          )}
                          원
                        </TableCell>
                        <TableCell>{formatDate(match.createdAt)}</TableCell>
                        <TableCell>
                          <StatusBadge $status={match.status}>
                            {STATUS_LABELS[
                              match.status as keyof typeof STATUS_LABELS
                            ] || match.status}
                          </StatusBadge>
                        </TableCell>
                      </ClickableTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MatchedSubSection>
          )}
        </MatchSection>

        {/* 판매건 섹션 */}
        <SectionTitle>판매 신청 내역</SectionTitle>
        {sellerLoading && <LoadingText>데이터를 불러오는 중...</LoadingText>}
        {error && <ErrorText>{error}</ErrorText>}
        {!sellerLoading && !error && (
          <TableContainer>
            {sellerRequests.length === 0 ? (
              <EmptyText>판매 신청 내역이 없습니다.</EmptyText>
            ) : (
              <Table>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHeaderCell>ID</TableHeaderCell>
                    <TableHeaderCell>작성일</TableHeaderCell>
                    <TableHeaderCell>성함</TableHeaderCell>
                    <TableHeaderCell>연락처</TableHeaderCell>
                    <TableHeaderCell>자산 종류</TableHeaderCell>
                    <TableHeaderCell>신청 수량</TableHeaderCell>
                    <TableHeaderCell>남은 수량</TableHeaderCell>
                    <TableHeaderCell>가격</TableHeaderCell>
                    <TableHeaderCell>소량 허용</TableHeaderCell>
                    <TableHeaderCell>회관</TableHeaderCell>
                    <TableHeaderCell>상태</TableHeaderCell>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {sellerRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>{request.name}</TableCell>
                      <TableCell>{formatPhone(request.phone)}</TableCell>
                      <TableCell>{request.assetType || "BMB"}</TableCell>
                      <TableCell>{request.amount}</TableCell>
                      <TableCell>
                        {request.remainingAmount !== undefined
                          ? request.remainingAmount
                          : request.amount}
                      </TableCell>
                      <TableCell>{formatPrice(request.price)}원</TableCell>
                      <TableCell>
                        {request.allowPartial ? "허용" : "비허용"}
                      </TableCell>
                      <TableCell>{request.branch}</TableCell>
                      <TableCell>
                        <StatusSelect
                          value={request.status}
                          onChange={(e) =>
                            handleSellerStatusChange(request.id, e.target.value)
                          }
                          disabled={updatingStatus.has(request.id)}
                        >
                          {Object.entries(REQUEST_STATUS).map(
                            ([key, value]) => (
                              <option key={value} value={value}>
                                {
                                  STATUS_LABELS[
                                    value as keyof typeof STATUS_LABELS
                                  ]
                                }
                              </option>
                            )
                          )}
                        </StatusSelect>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}

        {/* 구매건 섹션 */}
        <SectionTitle>구매 신청 내역</SectionTitle>
        {buyerLoading && <LoadingText>데이터를 불러오는 중...</LoadingText>}
        {!buyerLoading && !error && (
          <TableContainer>
            {buyerRequests.length === 0 ? (
              <EmptyText>구매 신청 내역이 없습니다.</EmptyText>
            ) : (
              <Table>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHeaderCell>ID</TableHeaderCell>
                    <TableHeaderCell>작성일</TableHeaderCell>
                    <TableHeaderCell>성함</TableHeaderCell>
                    <TableHeaderCell>연락처</TableHeaderCell>
                    <TableHeaderCell>자산 종류</TableHeaderCell>
                    <TableHeaderCell>신청 수량</TableHeaderCell>
                    <TableHeaderCell>남은 수량</TableHeaderCell>
                    <TableHeaderCell>가격</TableHeaderCell>
                    <TableHeaderCell>회관</TableHeaderCell>
                    <TableHeaderCell>상태</TableHeaderCell>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {buyerRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>{request.name}</TableCell>
                      <TableCell>{formatPhone(request.phone)}</TableCell>
                      <TableCell>{request.assetType || "BMB"}</TableCell>
                      <TableCell>{request.amount}</TableCell>
                      <TableCell>
                        {request.remainingAmount !== undefined
                          ? request.remainingAmount
                          : request.amount}
                      </TableCell>
                      <TableCell>{formatPrice(request.price)}원</TableCell>
                      <TableCell>{request.branch}</TableCell>
                      <TableCell>
                        <StatusSelect
                          value={request.status}
                          onChange={(e) =>
                            handleBuyerStatusChange(request.id, e.target.value)
                          }
                          disabled={updatingBuyerStatus.has(request.id)}
                        >
                          {Object.entries(REQUEST_STATUS).map(
                            ([key, value]) => (
                              <option key={value} value={value}>
                                {
                                  STATUS_LABELS[
                                    value as keyof typeof STATUS_LABELS
                                  ]
                                }
                              </option>
                            )
                          )}
                        </StatusSelect>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}

        {/* 매칭 정보 모달 */}
        <ModalOverlay $isOpen={isMatchModalOpen} onClick={handleCloseModals}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClick={handleCloseModals}>×</ModalCloseButton>
            {selectedMatch && (
              <>
                <ModalTitle>매칭 상세 정보</ModalTitle>
                <ModalSection>
                  <ModalSectionTitle>매칭 정보</ModalSectionTitle>
                  <ModalInfoRow>
                    <ModalInfoLabel>매칭 ID</ModalInfoLabel>
                    <ModalInfoValue>#{selectedMatch.id}</ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>매칭 수량</ModalInfoLabel>
                    <ModalInfoValue>
                      {selectedMatch.matchedAmount}
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>매칭 가격</ModalInfoLabel>
                    <ModalInfoValue>
                      {formatPrice(selectedMatch.matchedPrice)}원
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>총 금액</ModalInfoLabel>
                    <ModalInfoValue>
                      {formatPrice(
                        (
                          parseFloat(selectedMatch.matchedPrice) *
                          selectedMatch.matchedAmount
                        ).toString()
                      )}
                      원
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>매칭일시</ModalInfoLabel>
                    <ModalInfoValue>
                      {formatDate(selectedMatch.createdAt)}
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>상태</ModalInfoLabel>
                    <ModalInfoValue>
                      <StatusBadge $status={selectedMatch.status}>
                        {STATUS_LABELS[
                          selectedMatch.status as keyof typeof STATUS_LABELS
                        ] || selectedMatch.status}
                      </StatusBadge>
                    </ModalInfoValue>
                  </ModalInfoRow>
                </ModalSection>

                {selectedMatch.sellerRequest && (
                  <ModalSection>
                    <ModalSectionTitle>판매자 정보</ModalSectionTitle>
                    <ModalInfoRow>
                      <ModalInfoLabel>판매건 ID</ModalInfoLabel>
                      <ModalInfoValue>
                        #{selectedMatch.sellerRequest.id}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>성함</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.sellerRequest.name}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>연락처</ModalInfoLabel>
                      <ModalInfoValue>
                        {formatPhone(selectedMatch.sellerRequest.phone)}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>자산 종류</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.sellerRequest.assetType || "BMB"}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>신청 수량</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.sellerRequest.amount}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>남은 수량</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.sellerRequest.remainingAmount !==
                        undefined
                          ? selectedMatch.sellerRequest.remainingAmount
                          : selectedMatch.sellerRequest.amount}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>가격</ModalInfoLabel>
                      <ModalInfoValue>
                        {formatPrice(selectedMatch.sellerRequest.price)}원
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>회관</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.sellerRequest.branch}
                      </ModalInfoValue>
                    </ModalInfoRow>
                  </ModalSection>
                )}

                {selectedMatch.buyerRequest && (
                  <ModalSection>
                    <ModalSectionTitle>구매자 정보</ModalSectionTitle>
                    <ModalInfoRow>
                      <ModalInfoLabel>구매건 ID</ModalInfoLabel>
                      <ModalInfoValue>
                        #{selectedMatch.buyerRequest.id}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>성함</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.buyerRequest.name}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>연락처</ModalInfoLabel>
                      <ModalInfoValue>
                        {formatPhone(selectedMatch.buyerRequest.phone)}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>자산 종류</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.buyerRequest.assetType || "BMB"}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>신청 수량</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.buyerRequest.amount}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>남은 수량</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.buyerRequest.remainingAmount !==
                        undefined
                          ? selectedMatch.buyerRequest.remainingAmount
                          : selectedMatch.buyerRequest.amount}
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>가격</ModalInfoLabel>
                      <ModalInfoValue>
                        {formatPrice(selectedMatch.buyerRequest.price)}원
                      </ModalInfoValue>
                    </ModalInfoRow>
                    <ModalInfoRow>
                      <ModalInfoLabel>회관</ModalInfoLabel>
                      <ModalInfoValue>
                        {selectedMatch.buyerRequest.branch}
                      </ModalInfoValue>
                    </ModalInfoRow>
                  </ModalSection>
                )}

                {selectedMatch.status === REQUEST_STATUS.MATCHED && (
                  <ConfirmButton
                    onClick={async () => {
                      // TODO: COMPLETED로 변경하는 로직 추가 (12.4에서 구현)
                      alert("확인 완료 기능은 다음 단계에서 구현됩니다.");
                      handleCloseModals();
                    }}
                  >
                    확인 완료 (COMPLETED로 변경)
                  </ConfirmButton>
                )}
              </>
            )}
          </ModalContent>
        </ModalOverlay>

        {/* 판매건 모달 */}
        <ModalOverlay $isOpen={isSellerModalOpen} onClick={handleCloseModals}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClick={handleCloseModals}>×</ModalCloseButton>
            {selectedSeller && (
              <>
                <ModalTitle>판매건 상세 정보</ModalTitle>
                <ModalSection>
                  <ModalSectionTitle>기본 정보</ModalSectionTitle>
                  <ModalInfoRow>
                    <ModalInfoLabel>판매건 ID</ModalInfoLabel>
                    <ModalInfoValue>#{selectedSeller.id}</ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>성함</ModalInfoLabel>
                    <ModalInfoValue>{selectedSeller.name}</ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>연락처</ModalInfoLabel>
                    <ModalInfoValue>
                      {formatPhone(selectedSeller.phone)}
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>작성일</ModalInfoLabel>
                    <ModalInfoValue>
                      {formatDate(selectedSeller.createdAt)}
                    </ModalInfoValue>
                  </ModalInfoRow>
                </ModalSection>

                <ModalSection>
                  <ModalSectionTitle>신청 내용</ModalSectionTitle>
                  <ModalInfoRow>
                    <ModalInfoLabel>자산 종류</ModalInfoLabel>
                    <ModalInfoValue>
                      {selectedSeller.assetType || "BMB"}
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>신청 수량</ModalInfoLabel>
                    <ModalInfoValue>{selectedSeller.amount}</ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>남은 수량</ModalInfoLabel>
                    <ModalInfoValue>
                      {selectedSeller.remainingAmount !== undefined
                        ? selectedSeller.remainingAmount
                        : selectedSeller.amount}
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>가격</ModalInfoLabel>
                    <ModalInfoValue>
                      {formatPrice(selectedSeller.price)}원
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>소량 허용</ModalInfoLabel>
                    <ModalInfoValue>
                      {selectedSeller.allowPartial ? "허용" : "비허용"}
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>회관</ModalInfoLabel>
                    <ModalInfoValue>{selectedSeller.branch}</ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>상태</ModalInfoLabel>
                    <ModalInfoValue>
                      <StatusBadge $status={selectedSeller.status}>
                        {STATUS_LABELS[
                          selectedSeller.status as keyof typeof STATUS_LABELS
                        ] || selectedSeller.status}
                      </StatusBadge>
                    </ModalInfoValue>
                  </ModalInfoRow>
                </ModalSection>

                {selectedSeller.status === REQUEST_STATUS.MATCHED && (
                  <ConfirmButton
                    onClick={async () => {
                      // TODO: COMPLETED로 변경하는 로직 추가 (12.4에서 구현)
                      alert("확인 완료 기능은 다음 단계에서 구현됩니다.");
                      handleCloseModals();
                    }}
                  >
                    확인 완료 (COMPLETED로 변경)
                  </ConfirmButton>
                )}
              </>
            )}
          </ModalContent>
        </ModalOverlay>

        {/* 구매건 모달 */}
        <ModalOverlay $isOpen={isBuyerModalOpen} onClick={handleCloseModals}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalCloseButton onClick={handleCloseModals}>×</ModalCloseButton>
            {selectedBuyer && (
              <>
                <ModalTitle>구매건 상세 정보</ModalTitle>
                <ModalSection>
                  <ModalSectionTitle>기본 정보</ModalSectionTitle>
                  <ModalInfoRow>
                    <ModalInfoLabel>구매건 ID</ModalInfoLabel>
                    <ModalInfoValue>#{selectedBuyer.id}</ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>성함</ModalInfoLabel>
                    <ModalInfoValue>{selectedBuyer.name}</ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>연락처</ModalInfoLabel>
                    <ModalInfoValue>
                      {formatPhone(selectedBuyer.phone)}
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>작성일</ModalInfoLabel>
                    <ModalInfoValue>
                      {formatDate(selectedBuyer.createdAt)}
                    </ModalInfoValue>
                  </ModalInfoRow>
                </ModalSection>

                <ModalSection>
                  <ModalSectionTitle>신청 내용</ModalSectionTitle>
                  <ModalInfoRow>
                    <ModalInfoLabel>자산 종류</ModalInfoLabel>
                    <ModalInfoValue>
                      {selectedBuyer.assetType || "BMB"}
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>신청 수량</ModalInfoLabel>
                    <ModalInfoValue>{selectedBuyer.amount}</ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>남은 수량</ModalInfoLabel>
                    <ModalInfoValue>
                      {selectedBuyer.remainingAmount !== undefined
                        ? selectedBuyer.remainingAmount
                        : selectedBuyer.amount}
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>가격</ModalInfoLabel>
                    <ModalInfoValue>
                      {formatPrice(selectedBuyer.price)}원
                    </ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>회관</ModalInfoLabel>
                    <ModalInfoValue>{selectedBuyer.branch}</ModalInfoValue>
                  </ModalInfoRow>
                  <ModalInfoRow>
                    <ModalInfoLabel>상태</ModalInfoLabel>
                    <ModalInfoValue>
                      <StatusBadge $status={selectedBuyer.status}>
                        {STATUS_LABELS[
                          selectedBuyer.status as keyof typeof STATUS_LABELS
                        ] || selectedBuyer.status}
                      </StatusBadge>
                    </ModalInfoValue>
                  </ModalInfoRow>
                </ModalSection>

                {selectedBuyer.status === REQUEST_STATUS.MATCHED && (
                  <ConfirmButton
                    onClick={async () => {
                      // TODO: COMPLETED로 변경하는 로직 추가 (12.4에서 구현)
                      alert("확인 완료 기능은 다음 단계에서 구현됩니다.");
                      handleCloseModals();
                    }}
                  >
                    확인 완료 (COMPLETED로 변경)
                  </ConfirmButton>
                )}
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      </Container>
    </PageLayout>
  );
}
