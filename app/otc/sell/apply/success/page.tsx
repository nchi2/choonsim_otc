"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import styled from "styled-components";
import PageLayout from "@/components/layouts/PageLayout";
import { getBranchInfo, getBranchAddressText } from "@/lib/branch-info";

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SuccessTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: bold;
  color: #10b981;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const SuccessMessage = styled.p`
  font-size: 1rem;
  text-align: center;
  color: #6b7280;
`;

const Section = styled.div`
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  color: #111827;
`;

const BranchSection = styled(Section)`
  background-color: #eff6ff;
  border-color: #3b82f6;
`;

const AddressText = styled.p`
  font-size: 1rem;
  color: #1e40af;
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #3b82f6;
  color: white;

  &:hover {
    background-color: #2563eb;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #6b7280;
  color: white;

  &:hover {
    background-color: #4b5563;
  }
`;

const CopyButton = styled(Button)`
  background-color: #10b981;
  color: white;
  flex: none;
  width: 100%;

  @media (min-width: 768px) {
    width: auto;
  }

  &:hover {
    background-color: #059669;
  }
`;

const MapButton = styled(Button)`
  background-color: #f59e0b;
  color: white;
  flex: none;
  width: 100%;

  @media (min-width: 768px) {
    width: auto;
  }

  &:hover {
    background-color: #d97706;
  }
`;

const ProcessList = styled.ol`
  list-style: decimal;
  padding-left: 1.5rem;
  margin: 1rem 0;
  color: #374151;
  line-height: 1.8;
`;

const ProcessItem = styled.li`
  margin-bottom: 0.75rem;
`;

const WarningBox = styled.div`
  background-color: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-top: 1rem;
  color: #92400e;
`;

const WarningTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const DetailButton = styled(Button)`
  background-color: #8b5cf6;
  color: white;
  width: 100%;

  &:hover {
    background-color: #7c3aed;
  }
`;

// 모달 관련 스타일 추가
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

function SellApplySuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [requestData, setRequestData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 쿼리 파라미터에서 신청 정보 가져오기
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");
    const amount = searchParams.get("amount");
    const price = searchParams.get("price");
    const branch = searchParams.get("branch");
    const assetType = searchParams.get("assetType");

    if (id && name && phone && amount && price && branch) {
      setRequestData({
        id: parseInt(id),
        name,
        phone,
        amount: parseFloat(amount),
        price: parseFloat(price),
        branch,
        assetType: assetType || "BMB",
      });
    } else {
      // 정보가 없으면 판매 신청 페이지로 리다이렉트
      router.push("/otc/sell/apply");
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
        <Container>
          <SuccessMessage>정보를 불러오는 중...</SuccessMessage>
        </Container>
      </PageLayout>
    );
  }

  const branchInfo = getBranchInfo(requestData?.branch || "");
  const totalAmount = requestData ? requestData.amount * requestData.price : 0;

  return (
    <PageLayout>
      <Container>
        <SuccessTitle>✅ 판매 신청이 완료되었습니다</SuccessTitle>
        <SuccessMessage>관리자의 연락을 기다려주세요.</SuccessMessage>
        <DetailButton onClick={() => setIsModalOpen(true)}>
          📍 회관 정보 및 절차 안내 보기
        </DetailButton>

        <Section>
          <InfoRow>
            <InfoLabel>신청 번호</InfoLabel>
            <InfoValue>#{requestData?.id}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>성함</InfoLabel>
            <InfoValue>{requestData?.name}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>연락처</InfoLabel>
            <InfoValue>{requestData?.phone}</InfoValue>
          </InfoRow>
        </Section>

        <Section>
          <SectionTitle>신청 내용</SectionTitle>
          <InfoRow>
            <InfoLabel>수량</InfoLabel>
            <InfoValue>{requestData?.amount.toLocaleString()} BMB</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>단가</InfoLabel>
            <InfoValue>
              {Math.floor(requestData?.price || 0).toLocaleString()}원
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>총 금액</InfoLabel>
            <InfoValue style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
              {Math.floor(totalAmount).toLocaleString()}원
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>회관</InfoLabel>
            <InfoValue>{requestData?.branch}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>소량 판매</InfoLabel>
            <InfoValue>
              {requestData?.allowPartial ? "허용" : "비허용"}
            </InfoValue>
          </InfoRow>
        </Section>
        <WarningBox>
          <WarningTitle>⚠️ 주의사항</WarningTitle>
          <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
            <li>
              매주 일요일 오전 9시에 매칭이 중지되고 판매의사를 다시 확인합니다.
            </li>
            <li>관리자의 연락을 받지 않으면 호가에 반영되지 않습니다.</li>
            <li>관리자 미팅 시 위 내용을 입증해야 합니다.</li>
          </ul>
        </WarningBox>
        <ButtonGroup>
          <SecondaryButton onClick={() => router.push("/otc")}>
            돌아가기
          </SecondaryButton>
        </ButtonGroup>
      </Container>

      {/* 모달 */}
      <ModalOverlay $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalCloseButton onClick={() => setIsModalOpen(false)}>
            ×
          </ModalCloseButton>

          {branchInfo && (
            <BranchSection style={{ marginBottom: "2rem" }}>
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

          <Section>
            <SectionTitle>이후 절차</SectionTitle>
            <ProcessList>
              <ProcessItem>
                <strong>관리자 연락 대기</strong>
                <br />
                신청 후 관리자가 개별 연락을 드립니다.
              </ProcessItem>
              <ProcessItem>
                <strong>회관 방문 일시 결정</strong>
                <br />
                관리자와 방문 일시를 정합니다.
              </ProcessItem>
              <ProcessItem>
                <strong>회관 방문 및 관리자 미팅</strong>
                <br />
                회관에서 관리자를 만납니다. 주의사항 및 동의 절차를 진행합니다.
              </ProcessItem>
              <ProcessItem>
                <strong>모빅코인 전송</strong>
                <br />
                관리자에게 안내받은 주소로 모빅코인을 전송합니다.
              </ProcessItem>
              <ProcessItem>
                <strong>관리자 확인 및 호가 반영</strong>
                <br />
                관리자가 전송을 확인한 후 상태를 호가에 반영합니다.
                <br />
                상태: PENDING → LISTED
              </ProcessItem>
            </ProcessList>
          </Section>
        </ModalContent>
      </ModalOverlay>
    </PageLayout>
  );
}

export default function SellApplySuccessPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <Container>
            <SuccessMessage>로딩 중...</SuccessMessage>
          </Container>
        </PageLayout>
      }
    >
      <SellApplySuccessContent />
    </Suspense>
  );
}
