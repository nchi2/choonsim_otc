"use client";

import { useState } from "react";
import styled from "styled-components";
import PageLayout from "@/components/layouts/PageLayout";

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem; /* 헤더와의 간격 */

  @media (min-width: 768px) {
    gap: 1rem;
    padding-top: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
  }
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 0.5rem;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1rem;
  }
`;

const Divider = styled.hr`
  width: 60%;
  border: none;
  border-top: 2px solid #e5e7eb;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;

  @media (min-width: 768px) {
    gap: 1rem;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  background-color: ${(props) => (props.$active ? "#6570C5" : "#f3f4f6")};
  color: ${(props) => (props.$active ? "white" : "#6b7280")};
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.$active ? "#6570C5" : "#e5e7eb")};
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 1.5rem;
  }
`;

const Section = styled.div`
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
    margin-bottom: 3rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 1.5rem;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
`;

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const WalletCard = styled.div<{ $soldOut?: boolean }>`
  background-color: ${(props) => (props.$soldOut ? "#f3f4f6" : "#ffffff")};
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  border: 1px solid ${(props) => (props.$soldOut ? "#d1d5db" : "#e5e7eb")};
  opacity: ${(props) => (props.$soldOut ? 0.6 : 1)};
  position: relative;

  @media (max-width: 768px) {
    flex-direction: row;
    align-items: center;
    padding: 1rem;
  }

  &:hover {
    ${(props) =>
      !props.$soldOut &&
      `
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      border-color: #3b82f6;
    `}
  }

  ${(props) =>
    props.$soldOut &&
    `
    cursor: not-allowed;
    
    &::after {
      content: "소진";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 600;
      font-size: 1rem;
      z-index: 1;
    }
  `}
`;

const WalletImage = styled.img<{ $soldOut?: boolean }>`
  width: 100%;
  max-width: 200px;
  height: auto;
  display: block;
  border-radius: 0.375rem;
  filter: ${(props) => (props.$soldOut ? "grayscale(100%)" : "none")};

  @media (max-width: 768px) {
    max-width: 120px;
    flex-shrink: 0;
  }
`;

const WalletInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    align-items: flex-start;
    flex: 1;
  }
`;

const WalletType = styled.h3<{ $soldOut?: boolean }>`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props) => (props.$soldOut ? "#9ca3af" : "#111827")};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const WalletPrice = styled.p<{ $soldOut?: boolean }>`
  font-size: 1.1rem;
  color: ${(props) => (props.$soldOut ? "#9ca3af" : "#6570c5")};
  font-weight: 600;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const Button = styled.a`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #6570c5;
  border: none;
  border-radius: 0.375rem;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  margin: 1rem auto 0;
  width: fit-content;
  min-width: 200px;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 2rem;
  }
`;

const InfoBox = styled.div`
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-left: 4px solid #6570c5;

  @media (max-width: 768px) {
    padding: 1rem;
    margin: 1rem 0;
  }
`;

const InfoBoxTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #6570c5;
  margin-bottom: 0.75rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
`;

const InfoBoxContent = styled.p`
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.7;
  margin: 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 0.8125rem;
  }
`;

const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;
`;

const InfoListItem = styled.li`
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.7;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;

  &::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #6570c5;
    font-weight: bold;
  }

  @media (max-width: 768px) {
    font-size: 0.8125rem;
  }
`;

const InquirySection = styled.div`
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const InquiryTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const InquiryLink = styled.a`
  color: #6570c5;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: underline;
  transition: all 0.2s;

  &:hover {
    color: #6570c5;
  }

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const ReferenceImage = styled.img`
  width: 100%;
  max-width: 800px;
  height: auto;
  display: block;
  margin: 2rem auto;
  border-radius: 0.5rem;

  @media (max-width: 768px) {
    margin: 1.5rem auto;
  }
`;

// SBMB 관련 스타일
const SbmbContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 768px) {
    gap: 3rem;
  }
`;

const SbmbHeroSection = styled.div`
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  padding: 2rem;
  border-radius: 0.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const SbmbHeroContent = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 1.5rem;
    text-align: center;
  }
`;

const SbmbHeroLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SbmbHeroRight = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SbmbWalletImage = styled.img`
  width: 100%;
  max-width: 300px;
  height: auto;
  display: block;
  border-radius: 0.375rem;
`;

const SbmbTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: bold;
  color: #fbbf24;
  line-height: 1.2;

  @media (min-width: 768px) {
    font-size: 2.5rem;
  }
`;

const SbmbSubtitle = styled.p`
  font-size: 1rem;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const SbmbHighlight = styled.span`
  color: #fbbf24;
  font-weight: bold;
`;

const SbmbButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;

  @media (min-width: 768px) {
    flex-direction: row;
    gap: 1rem;
  }
`;

const SbmbButton = styled.a`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.375rem;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 2rem;
  }
`;

const SbmbInquiryButton = styled(SbmbButton)`
  background-color: #fbbf24;
  color: #111827;

  &:hover {
    background-color: #f59e0b;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  }
`;

const SbmbPurchaseButton = styled(SbmbButton)`
  background-color: #10b981;
  color: white;

  &:hover {
    background-color: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

const SbmbInfoSection = styled(Section)`
  background-color: #ffffff;
`;

const SbmbInfoTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #111827;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 1.875rem;
    margin-bottom: 2rem;
  }
`;

const SbmbInfoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SbmbInfoText = styled.p`
  font-size: 0.875rem;
  line-height: 1.7;
  color: #374151;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const SbmbIntroButton = styled.a`
  display: inline-block;
  background-color: #ffffff;
  color: #111827;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  text-decoration: none;
  transition: all 0.2s;
  border: 2px solid #e5e7eb;
  margin-top: 1.5rem;
  align-self: flex-end;

  &:hover {
    background-color: #f9fafb;
    border-color: #3b82f6;
    color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 2rem;
  }
`;

const SbmbBenefitsSection = styled.div`
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  padding: 2rem;
  border-radius: 0.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const SbmbBenefitsTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #fbbf24;

  @media (min-width: 768px) {
    font-size: 1.875rem;
    margin-bottom: 2rem;
  }
`;

const SbmbBenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
`;

const SbmbBenefitItem = styled.li`
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const SbmbDeadline = styled.div`
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export default function HighValuePage() {
  const [activeTab, setActiveTab] = useState<"고액권" | "SBMB">("고액권");

  const walletData = [
    {
      type: "200모",
      image: "/hwallets/img_hwallets_200mo.png",
      price: "1.6모",
      soldOut: true, // 소진됨
    },
    {
      type: "100모",
      image: "/hwallets/img_hwallets_100mo.png",
      price: "0.6모",
      soldOut: false,
    },
    {
      type: "50모",
      image: "/hwallets/img_hwallets_50mo.png",
      price: "0.4모",
      soldOut: false,
    },
  ];

  return (
    <PageLayout>
      <Container>
        <Title>춘심 고액권 | SBMB</Title>
        <Description>
          춘심 고액권 & SBMB 종이지갑 구매 페이지입니다.
        </Description>
        <Divider />

        <TabContainer>
          {["고액권", "SBMB"].map((tab) => (
            <Tab
              key={tab}
              $active={activeTab === tab}
              onClick={() => setActiveTab(tab as "고액권" | "SBMB")}
            >
              {tab}
            </Tab>
          ))}
        </TabContainer>

        {activeTab === "SBMB" ? (
          <SbmbContent>
            <SbmbHeroSection>
              <SbmbHeroContent>
                <SbmbHeroLeft>
                  <SbmbTitle>SBMB를 통해 Web3 생태계로 진입해보세요!</SbmbTitle>
                  <SbmbSubtitle>
                    EVM 지갑 신청을 통해 이더리움 기반 Web3 생태계를 경험하고,
                    추후 <SbmbHighlight>콘솔 전환</SbmbHighlight> 혜택까지
                    누려보세요.
                  </SbmbSubtitle>
                  <SbmbSubtitle>
                    신청 지갑에 각종 토큰이{" "}
                    <SbmbHighlight>에어드랍</SbmbHighlight> 됩니다.
                  </SbmbSubtitle>
                  <SbmbButtonGroup>
                    <SbmbInquiryButton
                      href="https://open.kakao.com/me/choondong"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      SBMB 문의하기
                    </SbmbInquiryButton>
                    <SbmbPurchaseButton
                      href="https://docs.google.com/forms/d/e/1FAIpQLScvdIY7t06hSQ7tqaFGoH05eC7hH-CepxwVUsdZKV6bH2HHxw/viewform"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      SBMB 구매하기
                    </SbmbPurchaseButton>
                  </SbmbButtonGroup>
                </SbmbHeroLeft>
                <SbmbHeroRight>
                  <SbmbWalletImage
                    src="/hwallets/hwallets_sbmb.png"
                    alt="SBMB 지갑 이미지"
                  />
                </SbmbHeroRight>
              </SbmbHeroContent>
            </SbmbHeroSection>

            <SbmbInfoSection>
              <SbmbInfoTitle>SBMB란?</SbmbInfoTitle>
              <SbmbInfoContent>
                <SbmbInfoText>
                  <strong>SBMB</strong>는 비트모빅 생태계를 이더리움 기반 Web3
                  생태계로 확장하기 위한 프로젝트입니다. 참여자들의 간접적인
                  락업을 통해 <SbmbHighlight>콘솔로 전환</SbmbHighlight>받을 수
                  있게 설계되었으며, 비트모빅과 1:1 가치 유지를 시도하는 ERC20
                  토큰입니다. <br />
                  EVM 종이지갑을 신청하시면 SBMB 토큰이 해당 지갑으로 에어드랍이
                  되는 방식으로 진행됩니다.
                </SbmbInfoText>
                <SbmbInfoText>
                  이 프로젝트는 오태버스가 아닌, <strong>춘심 팀</strong>이
                  진행하며,{" "}
                  <SbmbHighlight>
                    Web3 대출 플랫폼/디파이, NFT 마켓플레이스, 무브투언
                  </SbmbHighlight>{" "}
                  등의 프로젝트들이 자체적으로 만들어질 수 있는 생태계 기반을
                  만들고, 외부 유저들의 유입을 목표로합니다.
                  <br />
                  자세한 내용은 아래 SBMB 소개서를 참고해주세요.
                </SbmbInfoText>
              </SbmbInfoContent>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <SbmbIntroButton
                  href="https://choonsim.gitbook.io/sbmb_introduce"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📘 SBMB 소개서 바로가기
                </SbmbIntroButton>
              </div>
            </SbmbInfoSection>

            <SbmbBenefitsSection>
              <SbmbBenefitsTitle>신청 혜택</SbmbBenefitsTitle>
              <SbmbBenefitsList>
                <SbmbBenefitItem>
                  🎖 <strong>SBMB 수령 전용 이더리움 종이지갑 실물 1장</strong>
                </SbmbBenefitItem>
                <SbmbBenefitItem>
                  🎖 <strong>콘솔 전환 권한 NFT 에어드랍</strong>
                </SbmbBenefitItem>
                <SbmbBenefitItem>
                  🎖 <strong>SBMB 10개</strong> + 협력 프로젝트 토큰 에어드랍{" "}
                </SbmbBenefitItem>
              </SbmbBenefitsList>
              <SbmbDeadline>
                📅 판매 마감일: 2025년 12월 28일
                <br />
                (에어드랍 종이지갑 총 발행 수 : 11,000장)
              </SbmbDeadline>
            </SbmbBenefitsSection>
          </SbmbContent>
        ) : (
          <>
            <Section>
              <SectionTitle>춘심 고액권 판매</SectionTitle>
              <WalletGrid>
                {walletData.map((wallet) => (
                  <WalletCard key={wallet.type} $soldOut={wallet.soldOut}>
                    <WalletImage
                      src={wallet.image}
                      alt={`${wallet.type} 지갑`}
                      $soldOut={wallet.soldOut}
                    />
                    <WalletInfo>
                      <WalletType $soldOut={wallet.soldOut}>
                        {wallet.type}
                      </WalletType>
                      <WalletPrice $soldOut={wallet.soldOut}>
                        판매가: {wallet.price}
                      </WalletPrice>
                    </WalletInfo>
                  </WalletCard>
                ))}
              </WalletGrid>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  href="https://forms.gle/6UcxKVfc2SkdKpzr6"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  구매하기
                </Button>
              </div>

              <InfoBox>
                <InfoBoxTitle>신청 방법</InfoBoxTitle>
                <InfoList>
                  <InfoListItem>
                    상단 각 고액권 가격을 확인하고, 구매하기 버튼을 눌러
                    신청서를 작성해주세요.
                  </InfoListItem>
                  <InfoListItem>
                    신청서에 작성한 내용대로 모빅을 입금까지 완료해주세요.
                  </InfoListItem>
                  <InfoListItem>
                    입금 완료 후, 춘심팀이 입금 확인 후 고액권 수령안내 문자
                    메시지를 발송해드립니다.
                  </InfoListItem>
                </InfoList>
              </InfoBox>

              <InfoBox>
                <InfoBoxTitle>관련 안내</InfoBoxTitle>
                <InfoBoxContent>
                  - 신청 건은 익일 오전까지 확인하여 문자 안내를 드립니다.
                  <br />- 관련 안내를 못받을 경우 아래 문의처로 문의주시면
                  도움드리겠습니다.
                  <br />- 모든 고액권은 춘심팀이 초기 직접 소각하여 확보해둔
                  물량으로 전달됩니다.
                  <br />
                  <br />* 본 신청은 시장가보다 높은 가격에 판매되므로 신중히
                  고민 후 선택하시길 바랍니다.
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>
                    (수령 이후 반환 불가)
                  </span>
                  <br />* 고액권 판매 수익금은 SBMB 생태계 DEX 유동성 풀을
                  제공하는데에 사용될 예정입니다.
                  <br />* 자세한 내용은 신청서의 안내를 참고해주세요.
                </InfoBoxContent>
              </InfoBox>

              <InquirySection>
                <InquiryTitle>관련 문의 :</InquiryTitle>
                <InquiryLink
                  href="https://open.kakao.com/me/choondong"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  춘심이 동생
                </InquiryLink>
              </InquirySection>
            </Section>

            <Section>
              <SectionTitle>고액권별 참고표</SectionTitle>
              <ReferenceImage
                src="/hwallets/hwallets_info.png"
                alt="고액권 이미지"
              />
            </Section>
          </>
        )}
      </Container>
    </PageLayout>
  );
}
