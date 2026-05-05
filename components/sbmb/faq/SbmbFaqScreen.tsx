"use client";

import Link from "next/link";
import { useState } from "react";
import styled from "styled-components";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SbmbInquiryFlowModal from "@/components/sbmb/lookup/SbmbInquiryFlowModal";
import {
  IconChevronDown,
  IconChevronUp,
  IconMessageCircle,
} from "@/components/sbmb/shared/SbmbIcons";
import { SbmbSectionCard } from "@/components/sbmb/shared/SectionCard";
import {
  SBMB_FORM_QUEUE_WAIT,
  SBMB_KAKAO_INQUIRY_URL,
} from "@/lib/sbmb/constants";
import { T } from "@/lib/sbmb/tokens";

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${T.pageBg};
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${T.maxWidth};
  margin: 0 auto;
  padding: 88px 20px 48px;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 16px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: ${T.mint};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const PageTitle = styled.h1`
  margin: 0 0 20px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: ${T.textPrimary};
`;

const AccordionRoot = styled.div`
  display: flex;
  flex-direction: column;
`;

const AccordionItem = styled.div`
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

const AccordionTrigger = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
`;

const QuestionText = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: ${T.textPrimary};
  line-height: 1.45;
`;

const AnswerWrap = styled.div`
  padding: 0 0 18px;
`;

const AnswerBody = styled.div`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.65;
  color: ${T.textSecondary};
`;

const AnswerP = styled.p`
  margin: 0 0 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InlineActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-top: 14px;
`;

const TextActionBtn = styled.button`
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: ${T.mint};
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${T.mintDark};
  }
`;

const TextActionLink = styled.a`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: ${T.mint};
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${T.mintDark};
  }
`;

const ScannerInlineLink = styled(Link)`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: ${T.mint};
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${T.mintDark};
  }
`;

const KakaoOutlineLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: ${T.kakaoText};
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    opacity: 0.9;
  }
`;

const FAQ_ITEMS = [
  {
    id: "lookup",
    question: "지갑 조회가 안돼요.",
  },
  {
    id: "queue",
    question: "추가접수 대기 신청을 해두었는데 어떻게 확인하나요?",
  },
  {
    id: "ldt",
    question: "EVM 종이지갑에 연습 토큰(LDT)이 안 들어있어요.",
  },
] as const;

export default function SbmbFaqScreen() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const toggle = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
  };

  return (
    <Shell>
      <Header />
      <Main>
        <BackLink href="/sbmb">← SBMB 신청 현황</BackLink>
        <SbmbSectionCard aria-labelledby="sbmb-faq-heading">
          <PageTitle id="sbmb-faq-heading">자주 묻는 질문</PageTitle>
          <AccordionRoot role="list">
            {FAQ_ITEMS.map((item) => {
              const expanded = openId === item.id;
              return (
                <AccordionItem key={item.id} role="listitem">
                  <AccordionTrigger
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => toggle(item.id)}
                  >
                    <QuestionText>{item.question}</QuestionText>
                    {expanded ? (
                      <IconChevronUp size={20} color="#9CA3AF" />
                    ) : (
                      <IconChevronDown size={20} color="#9CA3AF" />
                    )}
                  </AccordionTrigger>
                  {expanded ? (
                    <AnswerWrap>
                      {item.id === "lookup" ? (
                        <AnswerBody>
                          <AnswerP>
                            참여 유형별로 다른 이유가 있을 수 있습니다.
                          </AnswerP>
                          <AnswerP>
                            아래 버튼에서 상황에 맞는 안내를 확인해주세요.
                          </AnswerP>
                          <InlineActions>
                            <TextActionBtn
                              type="button"
                              onClick={() => setInquiryOpen(true)}
                            >
                              문의 플로우 열기 →
                            </TextActionBtn>
                          </InlineActions>
                        </AnswerBody>
                      ) : null}
                      {item.id === "queue" ? (
                        <AnswerBody>
                          <AnswerP>
                            해당 신청 폼은 성함과 연락처 입력만으로 이루어져
                            개인정보 보호를 위해 조회 서비스가 제공되지
                            않습니다.
                          </AnswerP>
                          <AnswerP>
                            추가접수 진행 시 신청하신 연락처로 신청 링크가
                            안내될 예정이며, 신청 여부가 헷갈리실 경우 신청 폼을
                            통해 재접수해주시면 됩니다.
                          </AnswerP>
                          <InlineActions>
                            <TextActionLink
                              href={SBMB_FORM_QUEUE_WAIT}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              대기 신청 폼 바로가기 →
                            </TextActionLink>
                          </InlineActions>
                        </AnswerBody>
                      ) : null}
                      {item.id === "ldt" ? (
                        <AnswerBody>
                          <AnswerP>
                            최근 신청 건의 경우 격주 단위로 확인하여 에어드랍을
                            진행하고 있습니다.
                          </AnswerP>
                          <AnswerP>
                            수령한 지 오래됐음에도 확인이 안되신다면
                            /scanner에서 직접 조회해보시고, 그래도 확인이
                            안되신다면 카카오톡으로 문의해주세요.
                          </AnswerP>
                          <InlineActions>
                            <ScannerInlineLink href="/scanner">
                              EVM Wallet Scanner →
                            </ScannerInlineLink>
                            <KakaoOutlineLink
                              href={SBMB_KAKAO_INQUIRY_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <IconMessageCircle
                                size={15}
                                color={T.kakaoText}
                              />
                              카카오톡 문의 →
                            </KakaoOutlineLink>
                          </InlineActions>
                        </AnswerBody>
                      ) : null}
                    </AnswerWrap>
                  ) : null}
                </AccordionItem>
              );
            })}
          </AccordionRoot>
        </SbmbSectionCard>
      </Main>
      <Footer />
      <SbmbInquiryFlowModal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
      />
    </Shell>
  );
}
