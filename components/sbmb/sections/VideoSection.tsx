"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { IconPlayCircle } from "@/components/sbmb/shared/SbmbIcons";
import { SbmbSectionAnchor } from "@/components/sbmb/shared/SectionCard";
import { COMMUNITY_ECOSYSTEM_LINKTREE } from "@/lib/community-linktree";
import type { YoutubeVideo } from "@/lib/youtube/fetch-latest";
import { T } from "@/lib/sbmb/tokens";

const mobile = "@media (max-width: 767px)";

const MAX_VIDEOS = 3;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: ${T.textPrimary};
`;

const PillLink = styled.a`
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 9999px;
  background: #f3f4f6;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: ${T.primary};
  text-decoration: none;

  &:hover {
    background: #e5e7eb;
  }
`;

const Grid = styled.div`
  display: flex;
  gap: 16px;

  ${mobile} {
    flex-direction: column;
  }
`;

const CardLink = styled.a`
  flex: 1;
  min-width: 0;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  background: ${T.white};
  display: flex;
  flex-direction: column;
`;

const ThumbWrap = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  background: #111827;
`;

const PlayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const Info = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const VidTitle = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.35;
  color: ${T.textPrimary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Meta = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-size: 12px;
  color: ${T.textSecondary};
`;

const Muted = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${T.textSecondary};
`;

const relativeFormatter = new Intl.RelativeTimeFormat("ko", {
  numeric: "auto",
});

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }
  return relativeFormatter.format(diffDays, "day");
}

type YoutubeLatestResponse = {
  items: YoutubeVideo[];
  error?: string;
};

export default function VideoSection() {
  const [data, setData] = useState<YoutubeLatestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    async function run() {
      try {
        setLoading(true);
        const res = await fetch("/api/youtube/latest", { signal: ac.signal });
        const json = (await res.json()) as YoutubeLatestResponse & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? "영상을 불러오지 못했습니다.");
        }
        if (!cancelled) {
          setData({ items: json.items ?? [] });
          setError(null);
        }
      } catch (e) {
        if (ac.signal.aborted) return;
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "영상을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const videos = useMemo(
    () => (data?.items ?? []).slice(0, MAX_VIDEOS),
    [data],
  );

  return (
    <SbmbSectionAnchor id="video" aria-labelledby="sbmb-video-heading">
      <HeaderRow>
        <Title id="sbmb-video-heading">최신 영상</Title>
        <PillLink
          href={COMMUNITY_ECOSYSTEM_LINKTREE.href}
          target="_blank"
          rel="noreferrer"
        >
          전체 보기 →
        </PillLink>
      </HeaderRow>
      {loading && <Muted>불러오는 중…</Muted>}
      {!loading && error && <Muted>{error}</Muted>}
      {!loading && !error && videos.length === 0 && (
        <Muted>아직 수집된 영상이 없습니다.</Muted>
      )}
      {!loading && !error && videos.length > 0 && (
        <Grid>
          {videos.map((video) => (
            <CardLink
              key={video.videoId}
              href={video.url}
              target="_blank"
              rel="noreferrer"
            >
              <ThumbWrap>
                {video.thumbnail ? (
                  <Image
                    src={video.thumbnail}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                ) : null}
                <PlayOverlay>
                  <IconPlayCircle size={32} color="rgba(255,255,255,0.92)" />
                </PlayOverlay>
              </ThumbWrap>
              <Info>
                <VidTitle>{video.title}</VidTitle>
                <Meta>{video.channelTitle}</Meta>
                <Meta>{formatRelativeTime(video.publishedAt)}</Meta>
              </Info>
            </CardLink>
          ))}
        </Grid>
      )}
    </SbmbSectionAnchor>
  );
}
