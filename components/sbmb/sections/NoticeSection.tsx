"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { IconBell } from "@/components/sbmb/shared/SbmbIcons";
import {
  SbmbSectionAnchor,
  SbmbSectionCard,
} from "@/components/sbmb/shared/SectionCard";
import { selectNoticesForHomeSection } from "@/lib/sbmb/selectNoticesForHomeSection";
import { T } from "@/lib/sbmb/tokens";
import type { SbmbNoticeListItem } from "@/types/sbmb";

const desktop = "@media (min-width: 768px)";

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: ${T.textPrimary};
`;

const AllLink = styled(Link)`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: ${T.mint};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
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

const CardTitle = styled.h3`
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
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  text-align: center;
`;

export default function NoticeSection() {
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
        throw new Error(json.error ?? "notice_fetch_failed");
      }
      setItems(json.items ?? []);
    } catch (e) {
      console.error("[sbmb/notices] 공지 목록을 가져오지 못했습니다.", e);
      setError("load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hideSection = Boolean(error && !loading);

  return (
    <SbmbSectionAnchor
      id="notice"
      aria-labelledby="sbmb-notice-heading"
      style={{ display: hideSection ? "none" : undefined }}
    >
      <SbmbSectionCard>
        <HeaderRow>
          <Title id="sbmb-notice-heading">공지사항</Title>
          <AllLink href="/sbmb/notices">전체 보기 →</AllLink>
        </HeaderRow>

        {loading && (
          <List>
            <Skeleton />
            <Skeleton />
          </List>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState>
            <IconBell size={28} color={T.textTertiary} />
            등록된 공지가 없습니다
          </EmptyState>
        )}

        {!loading && !error && items.length > 0 && (
          <List>
            {selectNoticesForHomeSection(items).map((item) => (
              <NoticeCard key={item.slug} $important={item.important}>
                <MetaRow>
                  {item.important && (
                    <ImportantBadge>중요</ImportantBadge>
                  )}
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
    </SbmbSectionAnchor>
  );
}
