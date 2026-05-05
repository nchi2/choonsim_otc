"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  IconAlertCircle,
  IconBell,
  IconRefreshCw,
} from "@/components/sbmb/shared/SbmbIcons";
import { SbmbSectionCard } from "@/components/sbmb/shared/SectionCard";
import { T } from "@/lib/sbmb/tokens";
import { sanitizeParticipantFacingError } from "@/lib/sbmb/participantFacingMessage";
import type { SbmbNoticeListItem } from "@/types/sbmb";

const desktop = "@media (min-width: 768px)";

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
  margin: 0 0 8px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 22px;
  color: ${T.textPrimary};
`;

const PageDesc = styled.p`
  margin: 0 0 20px;
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  color: ${T.textSecondary};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const NoticeCard = styled.article<{ $important?: boolean }>`
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  border: ${(p) =>
    p.$important ? `1.5px solid ${T.mint}` : `0.5px solid ${T.border}`};
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ImportantBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  background: ${T.mintLight};
  color: ${T.mintDark};
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 11px;
`;

const DateText = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-size: 13px;
  color: ${T.textTertiary};
`;

const CardTitle = styled.h2`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: ${T.textPrimary};
`;

const Excerpt = styled.p`
  margin: 0;
  width: 100%;
  min-width: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.55;
  color: ${T.textMuted};
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  ${desktop} {
    -webkit-line-clamp: 1;
  }
`;

const DetailLink = styled(Link)`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: ${T.mint};
  text-decoration: none;
  width: fit-content;

  &:hover {
    text-decoration: underline;
  }
`;

const Skeleton = styled.div`
  height: 96px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: sbmb-pulse 1.2s ease-in-out infinite;

  @keyframes sbmb-pulse {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 12px;
  color: ${T.textSecondary};
  font-size: 14px;
  text-align: center;
`;

const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid ${T.errorBorder};
  background: ${T.errorBg};
  color: ${T.errorMid};
  font-size: 13px;
`;

const RetryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid ${T.errorBorder};
  background: ${T.white};
  color: ${T.errorDark};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
`;

export default function SbmbNoticesListPage() {
  const [items, setItems] = useState<SbmbNoticeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/sbmb/notices");
      const json = (await res.json()) as {
        items?: SbmbNoticeListItem[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "공지를 불러오지 못했습니다.");
      }
      setItems(json.items ?? []);
    } catch (e) {
      const raw =
        e instanceof Error ? e.message : "오류가 발생했습니다.";
      setError(sanitizeParticipantFacingError(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Shell>
      <Header />
      <Main>
        <BackLink href="/sbmb">← SBMB 메인으로</BackLink>
        <PageTitle>공지사항</PageTitle>
        <PageDesc>전체 공지 목록입니다. 제목을 눌러 상세를 확인하세요.</PageDesc>

        <SbmbSectionCard>
          {loading && (
            <List>
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </List>
          )}

          {!loading && error && (
            <ErrorBox>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IconAlertCircle size={18} color={T.errorDark} />
                {error}
              </span>
              <RetryBtn type="button" onClick={() => void load()}>
                <IconRefreshCw size={16} color={T.errorDark} />
                다시 시도
              </RetryBtn>
            </ErrorBox>
          )}

          {!loading && !error && items.length === 0 && (
            <EmptyState>
              <IconBell size={28} color={T.textTertiary} />
              등록된 공지가 없습니다
            </EmptyState>
          )}

          {!loading && !error && items.length > 0 && (
            <List>
              {items.map((item) => (
                <NoticeCard key={item.slug} $important={item.important}>
                  <MetaRow>
                    {item.important ? (
                      <ImportantBadge>중요</ImportantBadge>
                    ) : null}
                    {item.date ? <DateText>{item.date}</DateText> : null}
                  </MetaRow>
                  <CardTitle>{item.title}</CardTitle>
                  {item.summary ? <Excerpt>{item.summary}</Excerpt> : null}
                  <DetailLink href={`/sbmb/notices/${item.slug}`}>
                    자세히 보기 ↗
                  </DetailLink>
                </NoticeCard>
              ))}
            </List>
          )}
        </SbmbSectionCard>
      </Main>
      <Footer />
    </Shell>
  );
}
