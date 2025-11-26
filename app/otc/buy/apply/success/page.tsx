"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import styled from "styled-components";
import PageLayout from "@/components/layouts/PageLayout";
import { getBranchInfo, getBranchAddressText } from "@/lib/branch-info";

// 컬러 팔레트
const COLORS = {
  successGreen: "#10b981",
  purple: "#a8639f",
  warningYellow: "#fbbf24",
  warningBg: "#fef3c7",
  warningText: "#92400e",
  warningRed: "#dc2626",
  background: "#f4f1fa",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  white: "#ffffff",
  gray300: "#d1d5db",
  gray600: "#6b7280",
};

// 메인 컨테이너
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${COLORS.background};
  padding: 16px;
  margin-top: 60px;

  @media (min-width: 768px) {
    padding: 40px;
    margin-top: 60px;
  }
`;

const MainContent = styled.main`
  max-width: 343px;
  margin: 0 auto;
  width: 100%;

  @media (min-width: 768px) {
    max-width: 800px;
  }
`;

// 성공 헤더
const SuccessHeaderCard = styled.div`
  background-color: ${COLORS.white};
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
  padding: 24px;
  text-align: center;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    padding: 48px;
    margin-bottom: 32px;
  }
`;

const SuccessIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.successGreen};
  border-radius: 50%;

  @media (min-width: 768px) {
    width: 64px;
    height: 64px;
    margin-bottom: 24px;
  }

  svg {
    width: 28px;
    height: 28px;
    color: white;

    @media (min-width: 768px) {
      width: 36px;
      height: 36px;
    }
  }
`;

const SuccessTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin-bottom: 8px;

  @media (min-width: 768px) {
    font-size: 28px;
    margin-bottom: 12px;
  }
`;

const SuccessMessage = styled.p`
  font-size: 14px;
  color: ${COLORS.textSecondary};
  margin-bottom: 16px;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 18px;
    margin-bottom: 24px;
  }
`;

const BranchInfoButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.white};
  background-color: ${COLORS.purple};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #8b5a8f;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(168, 99, 159, 0.3);
  }

  @media (min-width: 768px) {
    padding: 14px 20px;
    font-size: 16px;
    border-radius: 12px;
  }
`;

// 신청 정보 요약 카드
const SummaryCard = styled.div`
  background-color: ${COLORS.white};
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
  padding: 24px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    padding: 48px;
    margin-bottom: 32px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${COLORS.gray300};

  @media (min-width: 768px) {
    font-size: 24px;
    margin-bottom: 24px;
    padding-bottom: 16px;
  }
`;

const InfoField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  @media (min-width: 768px) {
    margin-bottom: 24px;
  }
`;

const InfoLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.textSecondary};
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

const InfoValue = styled.span<{ $isTotal?: boolean }>`
  font-size: ${(props) => (props.$isTotal ? "20px" : "16px")};
  font-weight: ${(props) => (props.$isTotal ? "700" : "500")};
  color: ${COLORS.textPrimary};
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: ${(props) => (props.$isTotal ? "28px" : "18px")};
  }
`;

// 구매자 주의사항 박스
const WarningNoticeCard = styled.div`
  background-color: ${COLORS.warningBg};
  border: 1px solid ${COLORS.warningYellow};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    padding: 24px;
    margin-bottom: 32px;
  }
`;

const NoticeTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${COLORS.warningText};
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (min-width: 768px) {
    font-size: 18px;
    margin-bottom: 16px;
  }
`;

const NoticeList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NoticeItem = styled.li`
  font-size: 14px;
  color: ${COLORS.warningRed};
  line-height: 1.6;
  padding-left: 20px;
  position: relative;
  font-weight: 500;

  &::before {
    content: "•";
    position: absolute;
    left: 0;
    color: ${COLORS.warningText};
    font-weight: bold;
    font-size: 18px;
  }

  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

// 액션 버튼
const ActionButtonsCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BackButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.white};
  background-color: ${COLORS.gray600};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;

  &:hover {
    background-color: #4b5563;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    padding: 14px 20px;
    font-size: 18px;
    min-height: 48px;
    border-radius: 12px;
  }
`;

// 모달 관련 스타일
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
  padding: 16px;

  @media (min-width: 768px) {
    padding: 40px;
  }
`;

const ModalContent = styled.div`
  background-color: ${COLORS.white};
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;

  @media (min-width: 768px) {
    padding: 32px;
  }
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${COLORS.gray600};
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background-color: ${COLORS.gray300};
    color: ${COLORS.textPrimary};
  }
`;

const BranchSection = styled.div`
  background-color: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    padding: 24px;
    margin-bottom: 32px;
  }
`;

const AddressText = styled.p`
  font-size: 14px;
  color: #1e40af;
  margin-bottom: 16px;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 16px;
    margin-bottom: 20px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const CopyButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.white};
  background-color: ${COLORS.successGreen};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;

  &:hover {
    background-color: #059669;
  }

  @media (min-width: 768px) {
    padding: 14px 20px;
    font-size: 16px;
    min-height: 48px;
  }
`;

const MapButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: ${COLORS.white};
  background-color: #f59e0b;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;

  &:hover {
    background-color: #d97706;
  }

  @media (min-width: 768px) {
    padding: 14px 20px;
    font-size: 16px;
    min-height: 48px;
  }
`;

const ProcessList = styled.ol`
  list-style: decimal;
  padding-left: 24px;
  margin: 16px 0;
  color: ${COLORS.textPrimary};
  line-height: 1.8;
`;

const ProcessItem = styled.li`
  margin-bottom: 16px;
  font-size: 14px;

  @media (min-width: 768px) {
    font-size: 16px;
    margin-bottom: 20px;
  }

  strong {
    font-weight: 600;
    color: ${COLORS.textPrimary};
  }
`;

// Check 아이콘 SVG 컴포넌트
const CheckIconSVG = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

function BuyApplySuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [requestData, setRequestData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");
    const amount = searchParams.get("amount");
    const price = searchParams.get("price");
    const branch = searchParams.get("branch");
    const assetType = searchParams.get("assetType");
    const mode = searchParams.get("mode");

    if (name && phone && amount && price && branch) {
      setRequestData({
        id: id ? parseInt(id) : null,
        name,
        phone,
        amount: parseFloat(amount),
        price: parseFloat(price),
        branch,
        assetType: assetType || "BMB",
        mode: mode || "free",
      });
    } else {
      router.push("/otc/buy/apply");
    }
  }, [searchParams, router]);

  const handleCopyAddress = async () => {
    if (!requestData) return;

    const branchInfo = getBranchInfo(requestData.branch);
    if (branchInfo) {
      const addressText = getBranchAddressText(requestData.branch);
      try {
        await navigator.clipboard.writeText(addressText);
        alert("주소가 복사되었습니다.");
      } catch (error) {
        console.error("주소 복사 실패:", error);
        alert("주소 복사에 실패했습니다.");
      }
    }
  };

  const handleOpenMap = () => {
    if (!requestData) return;

    const branchInfo = getBranchInfo(requestData.branch);
    if (branchInfo) {
      window.open(branchInfo.naverMapUrl, "_blank");
    }
  };

  if (!requestData) {
    return (
      <PageLayout>
        <PageContainer>
          <MainContent>
            <SuccessHeaderCard>
              <SuccessMessage>정보를 불러오는 중...</SuccessMessage>
            </SuccessHeaderCard>
          </MainContent>
        </PageContainer>
      </PageLayout>
    );
  }

  const branchInfo = getBranchInfo(requestData.branch);
  const totalAmount = requestData.amount * requestData.price;

  return (
    <PageLayout>
      <PageContainer>
        <MainContent>
          {/* 성공 헤더 */}
          <SuccessHeaderCard>
            <SuccessIconWrapper>
              <CheckIconSVG />
            </SuccessIconWrapper>
            <SuccessTitle>구매 신청이 완료되었습니다</SuccessTitle>
            <SuccessMessage>
              신청이 정상적으로 접수되었습니다.
              <br />
              관리자의 연락을 기다려주세요.
            </SuccessMessage>
            <BranchInfoButton onClick={() => setIsModalOpen(true)}>
              📍 회관 정보 및 절차 안내 보기
            </BranchInfoButton>
          </SuccessHeaderCard>

          {/* 신청 정보 요약 */}
          <SummaryCard>
            <SectionTitle>신청자 정보</SectionTitle>
            {requestData.id && (
              <InfoField>
                <InfoLabel>신청 번호</InfoLabel>
                <InfoValue>#{requestData.id}</InfoValue>
              </InfoField>
            )}
            <InfoField>
              <InfoLabel>성함</InfoLabel>
              <InfoValue>{requestData.name}</InfoValue>
            </InfoField>
            <InfoField>
              <InfoLabel>연락처</InfoLabel>
              <InfoValue>{requestData.phone}</InfoValue>
            </InfoField>
          </SummaryCard>

          <SummaryCard>
            <SectionTitle>신청 내용</SectionTitle>
            <InfoField>
              <InfoLabel>자산 종류</InfoLabel>
              <InfoValue>{requestData.assetType || "BMB"}</InfoValue>
            </InfoField>
            <InfoField>
              <InfoLabel>구매 수량</InfoLabel>
              <InfoValue>
                {requestData.amount.toLocaleString()}{" "}
                {requestData.assetType || "BMB"}
              </InfoValue>
            </InfoField>
            <InfoField>
              <InfoLabel>단가</InfoLabel>
              <InfoValue>
                {Math.floor(requestData.price).toLocaleString()}원
              </InfoValue>
            </InfoField>
            <InfoField>
              <InfoLabel>총 금액</InfoLabel>
              <InfoValue $isTotal>
                {Math.floor(totalAmount).toLocaleString()}원
              </InfoValue>
            </InfoField>
            <InfoField>
              <InfoLabel>방문 회관</InfoLabel>
              <InfoValue>{requestData.branch}</InfoValue>
            </InfoField>
            <InfoField>
              <InfoLabel>구매 모드</InfoLabel>
              <InfoValue>
                {requestData.mode === "card" ? "카드형 매물" : "호가형(소액)"}
              </InfoValue>
            </InfoField>
          </SummaryCard>

          {/* 구매자 주의사항 */}
          <WarningNoticeCard>
            <NoticeTitle>⚠️ 구매자 주의사항</NoticeTitle>
            <NoticeList>
              <NoticeItem>
                처음 연락 시 확실한 구매의사가 필요합니다.
              </NoticeItem>
              <NoticeItem>
                직접 방문이 어려울 경우 먼저 입금한 구매자에게 우선 매칭됩니다.
              </NoticeItem>
              <NoticeItem>
                기존 P2P 판매 이력이 있는 경우 관리자 검증 후 일정 기간 이용
                제한이 있을 수 있습니다.
              </NoticeItem>
              <NoticeItem>
                회관 방문 시 위 내용을 입증할 수 있어야 합니다.
              </NoticeItem>
            </NoticeList>
          </WarningNoticeCard>

          {/* 액션 버튼 */}
          <ActionButtonsCard>
            <BackButton onClick={() => router.push("/otc")}>
              돌아가기
            </BackButton>
          </ActionButtonsCard>
        </MainContent>
      </PageContainer>

      {/* 회관 정보 모달 */}
      <ModalOverlay $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalCloseButton onClick={() => setIsModalOpen(false)}>
            ×
          </ModalCloseButton>

          {branchInfo && (
            <BranchSection>
              <SectionTitle>📍 방문 회관 정보</SectionTitle>
              <AddressText>
                <strong>{branchInfo.name}</strong>
                <br />
                {branchInfo.address}
              </AddressText>
              <ButtonGroup>
                <CopyButton onClick={handleCopyAddress}>주소 복사</CopyButton>
                <MapButton onClick={handleOpenMap}>네이버 지도</MapButton>
              </ButtonGroup>
            </BranchSection>
          )}

          <SummaryCard style={{ marginBottom: 0 }}>
            <SectionTitle>이후 절차</SectionTitle>
            <ProcessList>
              <ProcessItem>
                <strong>관리자 연락 대기</strong>
                <br />
                신청 후 관리자가 개별 연락을 드립니다.
                <br />
                <strong style={{ color: COLORS.warningRed }}>
                  확실한 구매의사를 밝혀야 합니다.
                </strong>
              </ProcessItem>
              <ProcessItem>
                <strong>회관 방문 일시 결정</strong>
                <br />
                관리자와 방문 일시를 정합니다.
                <br />
                <strong style={{ color: COLORS.warningRed }}>
                  직접 방문이 근시일내 불가능할 경우, 먼저 입금한 구매자가
                  매칭됩니다.
                </strong>
              </ProcessItem>
              <ProcessItem>
                <strong>회관 방문 및 관리자 미팅</strong>
                <br />
                회관에서 관리자를 만납니다. 주의사항 및 동의 절차를 진행합니다.
                <br />
                <strong style={{ color: COLORS.warningRed }}>
                  기존 P2P 거래에서 판매한 이력이 있는 사용자는 일정기간 이용
                  불가능합니다.
                </strong>
              </ProcessItem>
              <ProcessItem>
                <strong>원화 입금</strong>
                <br />
                관리자에게 안내받은 계좌로 원화를 입금합니다.
              </ProcessItem>
              <ProcessItem>
                <strong>관리자 확인 및 즉시 매칭</strong>
                <br />
                관리자가 입금을 확인한 후 즉시 매칭을 완료합니다.
                <br />
                관리자가 구매자에게 모빅코인을 전송합니다.
              </ProcessItem>
            </ProcessList>
          </SummaryCard>
        </ModalContent>
      </ModalOverlay>
    </PageLayout>
  );
}

export default function BuyApplySuccessPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <PageContainer>
            <MainContent>
              <SuccessHeaderCard>
                <SuccessMessage>로딩 중...</SuccessMessage>
              </SuccessHeaderCard>
            </MainContent>
          </PageContainer>
        </PageLayout>
      }
    >
      <BuyApplySuccessContent />
    </Suspense>
  );
}
