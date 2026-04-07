"use client";

import styled from "styled-components";
import { LinktreeIcon } from "@/components/LinktreeIcon";
import PageLayout from "@/components/layouts/PageLayout";
import { COMMUNITY_LINKTREE } from "@/lib/community-linktree";

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;

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
    flex-wrap: wrap;
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

const SbmbLinktreeButton = styled(SbmbButton)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background-color: transparent;
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.9);

  &:hover {
    background-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

export default function SbmbPage() {
  return (
    <PageLayout>
      <Container>
        <Title>춘심 SBMB</Title>
        <Description>
          춘심 팀의 Web3 · SBMB 프로젝트 안내 페이지입니다. 종이지갑 신청·문의·
          커뮤니티 링크를 확인할 수 있습니다.
        </Description>
        <Divider />

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
                  <SbmbLinktreeButton
                    href={COMMUNITY_LINKTREE.stablebmb.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="SBMB Linktree 열기"
                  >
                    <LinktreeIcon size={20} />
                    SBMB 링크트리
                  </SbmbLinktreeButton>
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
      </Container>
    </PageLayout>
  );
}
