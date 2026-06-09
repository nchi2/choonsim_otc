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

const MAX_VISIBLE = 5;

function formatShortDate(iso: string): string {
  const parts = iso.split("-");
  const m = parts[1];
  const d = parts[2];
  if (!m || !d) return iso;
  return `${Number(m)}/${Number(d)}`;
}

export function RecentUpdatesNotice() {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (SCANNER_UPDATES.length === 0) return null;

  const latest = SCANNER_UPDATES[0];
  const summaryDate = formatShortDate(latest.date);
  const summaryTitles = SCANNER_UPDATES.slice(0, 2)
    .map((u) => u.title)
    .join(", ");

  const visible = showAll
    ? SCANNER_UPDATES
    : SCANNER_UPDATES.slice(0, MAX_VISIBLE);
  const hasMore = SCANNER_UPDATES.length > MAX_VISIBLE;

  return (
    <Root>
      <SummaryButton
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <SummaryLeft>
          <RefreshIcon aria-hidden>↻</RefreshIcon>
          <SummaryText>
            <strong>최근 업데이트 ({summaryDate})</strong>
            <span> — {summaryTitles}</span>
          </SummaryText>
        </SummaryLeft>
        <Chevron aria-hidden $open={open}>
          ▾
        </Chevron>
      </SummaryButton>

      {open && (
        <List>
          {visible.map((u, i) => (
            <Item key={`${u.date}-${u.title}-${i}`}>
              <ItemHead>
                <ItemDate>{formatShortDate(u.date)}</ItemDate>
                <ItemTitle>{u.title}</ItemTitle>
              </ItemHead>
              <ItemDesc>{u.desc}</ItemDesc>
            </Item>
          ))}

          {hasMore && !showAll && (
            <MoreButton type="button" onClick={() => setShowAll(true)}>
              이전 업데이트 더보기
            </MoreButton>
          )}
        </List>
      )}
    </Root>
  );
}

const Root = styled.div`
  width: 100%;
  margin: 0.5rem 0 0.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #fafafa;
`;

const SummaryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: #6b7280;
  font-size: 0.8125rem;
  line-height: 1.4;
`;

const SummaryLeft = styled.span`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
`;

const RefreshIcon = styled.span`
  flex-shrink: 0;
  font-size: 0.875rem;
  color: #9ca3af;
`;

const SummaryText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  strong {
    color: #4b5563;
    font-weight: 700;
  }
`;

const Chevron = styled.span<{ $open: boolean }>`
  flex-shrink: 0;
  font-size: 0.75rem;
  color: #9ca3af;
  transition: transform 0.15s ease;
  transform: rotate(${(p) => (p.$open ? "180deg" : "0deg")});
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0.25rem 0.75rem 0.75rem;
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

const MoreButton = styled.button`
  align-self: flex-start;
  margin-top: 0.125rem;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-decoration: underline;
`;
