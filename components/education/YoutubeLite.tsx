"use client";

// 메인 하단용 경량 유튜브 — "하단에 얇게" 의도. 얇은 카테고리 탭 한 줄 + 최근 영상 4개.
// 채널 아이콘 스트립은 복원 안 함(자리 많이 먹음). 전체보기=최신 피드, 카테고리=CURATED 큐레이션 재사용.
// 기존 YouTubeSection(풀버전)은 파괴하지 않고 보존. 데이터 소스는 /api/youtube/latest 그대로.

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  YOUTUBE_CHANNELS,
  youtubeChannelUrl,
} from "@/lib/youtube/channels";
import type { YoutubeVideo } from "@/lib/youtube/fetch-latest";
import {
  CURATED,
  CURATED_CATEGORIES,
  curatedThumbnailUrl,
  curatedWatchUrl,
  type CuratedCategoryId,
} from "@/lib/youtube/curated-videos";
import { eduColors, media } from "./tokens";

const MAX_VIDEOS = 4;

type TabId = "all" | CuratedCategoryId;

/** 최신 피드·큐레이션을 카드 렌더용 공통 형태로 정규화 */
interface LiteCard {
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  channel: string;
}

const Head = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 2rem 0 0.9rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: ${eduColors.text};

  ${media.sm} {
    font-size: 1.05rem;
  }
`;

const MoreLink = styled.a`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${eduColors.primary};
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`;

/* 얇은 카테고리 탭 한 줄 — 텍스트 칩만. 모바일은 가로 스크롤. */
const TabStrip = styled.div`
  display: flex;
  gap: 0.35rem;
  margin: 0 0 0.9rem;
  flex-wrap: wrap;

  ${media.sm} {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.15rem;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const TabChip = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid
    ${(p) => (p.$active ? eduColors.primary : eduColors.border)};
  background: ${(p) => (p.$active ? eduColors.primary : eduColors.surface)};
  color: ${(p) => (p.$active ? eduColors.white : eduColors.textMuted)};
  transition: border-color 0.12s ease, background 0.12s ease;

  &:hover {
    border-color: ${eduColors.primary};
  }
`;

const EmptyRow = styled.p`
  margin: 0;
  padding: 1.5rem 1rem;
  text-align: center;
  border: 1px dashed ${eduColors.border};
  border-radius: 10px;
  color: ${eduColors.textFaint};
  font-size: 0.8rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;

  ${media.md} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Card = styled.a`
  display: block;
  text-decoration: none;
  color: inherit;
  border: 1px solid ${eduColors.border};
  border-radius: 10px;
  overflow: hidden;
  background: ${eduColors.surface};
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${eduColors.primaryBorder};
  }
`;

const Thumb = styled.div`
  aspect-ratio: 16 / 9;
  background: ${eduColors.bg};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const CardBody = styled.div`
  padding: 0.55rem 0.65rem 0.65rem;

  .t {
    font-size: 0.78rem;
    font-weight: 700;
    color: ${eduColors.text};
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .ch {
    margin-top: 0.2rem;
    font-size: 0.68rem;
    color: ${eduColors.textFaint};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const TAB_ALL = { id: "all" as const, label: "전체보기" };

export function YoutubeLite() {
  const [videos, setVideos] = useState<YoutubeVideo[] | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/youtube/latest");
        if (!res.ok) return; // 실패 시 섹션 숨김 유지
        const json = (await res.json()) as { items?: YoutubeVideo[] };
        if (!cancelled && Array.isArray(json.items) && json.items.length > 0) {
          setVideos(json.items);
        }
      } catch {
        /* 조용히 숨김 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 활성 탭 → 카드 4개(공통 형태). 전체보기=최신 피드, 카테고리=CURATED 큐레이션.
  const cards: LiteCard[] = useMemo(() => {
    if (activeTab === "all") {
      return (videos ?? []).slice(0, MAX_VIDEOS).map((v) => ({
        videoId: v.videoId,
        url: v.url,
        title: v.title,
        thumbnail: v.thumbnail,
        channel: v.displayName || v.channelTitle,
      }));
    }
    return CURATED[activeTab].slice(0, MAX_VIDEOS).map((v) => ({
      videoId: v.videoId,
      url: curatedWatchUrl(v.videoId),
      title: v.title,
      thumbnail: curatedThumbnailUrl(v.videoId),
      channel: v.channelTitle ?? "",
    }));
  }, [activeTab, videos]);

  // 섹션 노출 게이트 = 최신 피드 로드 성공(기존 동작 유지) — 실패 시 탭 포함 전체 숨김.
  if (!videos || videos.length === 0) return null;

  const mainChannel = YOUTUBE_CHANNELS[0];

  return (
    <section>
      <Head>
        <Title>최근 영상</Title>
        {mainChannel ? (
          <MoreLink
            href={youtubeChannelUrl(mainChannel)}
            target="_blank"
            rel="noreferrer"
          >
            유튜브 채널 →
          </MoreLink>
        ) : null}
      </Head>

      <TabStrip role="tablist" aria-label="유튜브 카테고리">
        {[TAB_ALL, ...CURATED_CATEGORIES].map((tab) => (
          <TabChip
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
          >
            {tab.label}
          </TabChip>
        ))}
      </TabStrip>

      {cards.length === 0 ? (
        <EmptyRow>이 카테고리의 영상이 아직 없습니다.</EmptyRow>
      ) : (
        <Grid>
          {cards.map((v) => (
            <Card key={v.videoId} href={v.url} target="_blank" rel="noreferrer">
              <Thumb>
                {v.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail} alt="" loading="lazy" />
                ) : null}
              </Thumb>
              <CardBody>
                <div className="t">{v.title}</div>
                <div className="ch">{v.channel}</div>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}
    </section>
  );
}
