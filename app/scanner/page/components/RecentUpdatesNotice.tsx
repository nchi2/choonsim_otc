"use client";

import { useState } from "react";
import styled from "styled-components";

interface ScannerUpdateItem {
  date: string;
  title: string;
  desc: string;
}

const SCANNER_UPDATES: ScannerUpdateItem[] = [
  {
    date: "2026-06-27",
    title: "연속 스캔 모드",
    desc: "QR 코드를 연달아 스캔해 여러 지갑 주소를 한 번에 모으고 복사할 수 있게 기능을 추가했습니다.",
  },
  {
    date: "2026-06-06",
    title: "USDT(테더) 잔고 조회 추가",
    desc: "ETH 메인넷·BNB Chain에서 USDT 잔고를 조회할 수 있어요.",
  },
  {
    date: "2026-06-06",
    title: "카메라 인식 개선",
    desc: "일부 기기에서 광각 카메라로 잡혀 QR 인식이 안 되던 문제를 수정했습니다. 인식이 안 되면 프리뷰의 카메라 전환 버튼을 눌러보세요.",
  },
];

/** 접힌 헤더 한 줄 요약 — 최신 릴리스 기준 수동 갱신 */
const HEADER_SUMMARY = {
  date: "2026-06-27",
  subtitle: "연속 스캔, 주소 복사",
};

const PREVIEW_COUNT = 2;

function formatShortDate(iso: string): string {
  const parts = iso.split("-");
  const m = parts[1];
  const d = parts[2];
  if (!m || !d) return iso;
  return `${Number(m)}/${Number(d)}`;
}

export function RecentUpdatesNotice() {
  const [expanded, setExpanded] = useState(false);

  if (SCANNER_UPDATES.length === 0) return null;

  const summaryDate = formatShortDate(HEADER_SUMMARY.date);
  const previewItems = SCANNER_UPDATES.slice(0, PREVIEW_COUNT);
  const olderItems = SCANNER_UPDATES.slice(PREVIEW_COUNT);

  return (
    <Root>
      <HeaderRow>
        <RefreshIcon aria-hidden>↻</RefreshIcon>
        <HeaderText>
          <strong>최근 업데이트 ({summaryDate})</strong>
          <span> — {HEADER_SUMMARY.subtitle}</span>
        </HeaderText>
      </HeaderRow>

      <PreviewList>
        {previewItems.map((u, i) => (
          <PreviewItem key={`${u.date}-${u.title}-${i}`}>
            <PreviewTitle>
              {formatShortDate(u.date)} · {u.title}
            </PreviewTitle>
            <PreviewDesc>{u.desc}</PreviewDesc>
          </PreviewItem>
        ))}
      </PreviewList>

      {olderItems.length > 0 ? (
        <>
          <ExpandButton
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "접기" : "이전 업데이트 보기"}
            <Chevron aria-hidden $open={expanded}>
              ▾
            </Chevron>
          </ExpandButton>

          {expanded ? (
            <OlderList>
              {olderItems.map((u, i) => (
                <Item key={`${u.date}-${u.title}-${i}`}>
                  <ItemHead>
                    <ItemDate>{formatShortDate(u.date)}</ItemDate>
                    <ItemTitle>{u.title}</ItemTitle>
                  </ItemHead>
                  <ItemDesc>{u.desc}</ItemDesc>
                </Item>
              ))}
            </OlderList>
          ) : null}
        </>
      ) : null}
    </Root>
  );
}

const Root = styled.div`
  width: 100%;
  margin: 0 0 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fafafa;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.625rem 0.75rem 0.375rem;
  color: #6b7280;
  font-size: 0.8125rem;
  line-height: 1.4;
`;

const RefreshIcon = styled.span`
  flex-shrink: 0;
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 0.05rem;
`;

const HeaderText = styled.span`
  min-width: 0;

  strong {
    color: #4b5563;
    font-weight: 700;
  }
`;

const PreviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.75rem 0.625rem;
`;

const PreviewItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const PreviewTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: #374151;
`;

const PreviewDesc = styled.p`
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #6b7280;
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  padding: 0.375rem 0.75rem 0.625rem;
  background: transparent;
  border: none;
  border-top: 1px solid #eef0f2;
  cursor: pointer;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;

  &:hover {
    color: #374151;
  }
`;

const Chevron = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  font-size: 0.6875rem;
  transition: transform 0.15s ease;
  transform: rotate(${(p) => (p.$open ? "180deg" : "0deg")});
`;

const OlderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0 0.75rem 0.75rem;
  border-top: 1px solid #eef0f2;
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const ItemHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
`;

const ItemDate = styled.span`
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #9ca3af;
`;

const ItemTitle = styled.span`
  font-size: 0.8125rem;
  font-weight: 700;
  color: #374151;
`;

const ItemDesc = styled.p`
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #6b7280;
`;
