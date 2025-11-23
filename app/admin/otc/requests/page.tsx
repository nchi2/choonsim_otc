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

interface SellerRequest {
  id: number;
  name: string;
  phone: string;
  amount: number;
  price: string;
  allowPartial: boolean;
  branch: string;
  assetType?: string; // assetType 필드 추가
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<string>(""); // 자산 종류 필터 state
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set()); // 상태 변경 중인 ID 추적

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // assetType이 있으면 쿼리 파라미터에 추가
        const url = assetType
          ? `/api/seller-requests?assetType=${assetType}`
          : "/api/seller-requests";

        const response = await fetch(url);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "데이터를 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError(
          err instanceof Error
            ? err.message
            : "데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [assetType]); // assetType 의존성 추가

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

  // 상태 변경 핸들러 추가
  const handleStatusChange = async (requestId: number, newStatus: string) => {
    // 이미 업데이트 중이면 무시
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

      // 성공 시 로컬 state 업데이트
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: newStatus } : req
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
          <Title>OTC 판매 신청 내역</Title>
          <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
        </div>

        {/* 자산 종류 필터 추가 */}
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
        </FilterContainer>

        {loading && <LoadingText>데이터를 불러오는 중...</LoadingText>}

        {error && <ErrorText>{error}</ErrorText>}

        {!loading && !error && (
          <TableContainer>
            {requests.length === 0 ? (
              <EmptyText>신청 내역이 없습니다.</EmptyText>
            ) : (
              <Table>
                <TableHeader>
                  <TableHeaderRow>
                    <TableHeaderCell>ID</TableHeaderCell>
                    <TableHeaderCell>작성일</TableHeaderCell>
                    <TableHeaderCell>성함</TableHeaderCell>
                    <TableHeaderCell>연락처</TableHeaderCell>
                    <TableHeaderCell>자산 종류</TableHeaderCell>
                    <TableHeaderCell>수량</TableHeaderCell>
                    <TableHeaderCell>가격</TableHeaderCell>
                    <TableHeaderCell>소량 허용</TableHeaderCell>
                    <TableHeaderCell>회관</TableHeaderCell>
                    <TableHeaderCell>상태</TableHeaderCell>
                  </TableHeaderRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>{request.name}</TableCell>
                      <TableCell>{formatPhone(request.phone)}</TableCell>
                      <TableCell>{request.assetType || "BMB"}</TableCell>
                      <TableCell>{request.amount}</TableCell>
                      <TableCell>{formatPrice(request.price)}원</TableCell>
                      <TableCell>
                        {request.allowPartial ? "허용" : "비허용"}
                      </TableCell>
                      <TableCell>{request.branch}</TableCell>
                      <TableCell>
                        <StatusSelect
                          value={request.status}
                          onChange={(e) =>
                            handleStatusChange(request.id, e.target.value)
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
      </Container>
    </PageLayout>
  );
}
