"use client";

// 메인 하단용 경량 유튜브 — "하단에 얇게" 의도에 맞춘 최근 영상 N개 한 줄.
// 기존 YouTubeSection(채널 스트립·탭·페이지네이션)은 파괴하지 않고 보존 — 여기는 별도 경량 버전.
// 데이터 소스는 기존 /api/youtube/latest 그대로. 로딩·실패 시 섹션을 조용히 숨긴다(메인 하단이라).

import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  YOUTUBE_CHANNELS,
  youtubeChannelUrl,
} from "@/lib/youtube/channels";
import type { YoutubeVideo } from "@/lib/youtube/fetch-latest";
import { eduColors, media } from "./tokens";

const MAX_VIDEOS = 4;

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

export function YoutubeLite() {
  const [videos, setVideos] = useState<YoutubeVideo[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/youtube/latest");
        if (!res.ok) return; // 실패 시 섹션 숨김 유지
        const json = (await res.json()) as { items?: YoutubeVideo[] };
        if (!cancelled && Array.isArray(json.items) && json.items.length > 0) {
          setVideos(json.items.slice(0, MAX_VIDEOS));
        }
      } catch {
        /* 조용히 숨김 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      <Grid>
        {videos.map((v) => (
          <Card key={v.videoId} href={v.url} target="_blank" rel="noreferrer">
            <Thumb>
              {v.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail} alt="" loading="lazy" />
              ) : null}
            </Thumb>
            <CardBody>
              <div className="t">{v.title}</div>
              <div className="ch">{v.displayName || v.channelTitle}</div>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </section>
  );
}
