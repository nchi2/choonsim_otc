"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { YoutubeVideo } from "@/lib/youtube/fetch-latest";
import { COMMUNITY_ECOSYSTEM_LINKTREE } from "@/lib/community-linktree";
import * as S from "../styles";

const ECOSYSTEM_URL = COMMUNITY_ECOSYSTEM_LINKTREE.href;
const PAGE_SIZE = 6;

type YoutubeLatestResponse = {
  items: YoutubeVideo[];
  meta: {
    fetchedAt: string;
    cache: {
      hit: boolean;
      ageMs: number | null;
      reason?: "ttl" | "rate_limited";
    };
    channels: {
      total: number;
      succeeded: number;
      failed: number;
    };
  };
  errors?: Record<string, string>;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("ko", {
  numeric: "auto",
});

function formatAbsoluteTime(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return dateFormatter.format(date);
}

function humanizeFetchReason(reason: string): string {
  if (reason === "noVideosInPage") {
    return "목록 없음";
  }
  if (reason === "ytInitialData missing") {
    return "페이지 형식 변경/차단";
  }
  if (reason.startsWith("browse HTTP ")) {
    return reason.replace("browse HTTP ", "페이지 HTTP ");
  }
  if (reason.startsWith("feed HTTP ")) {
    return reason.replace("feed HTTP ", "피드 HTTP ");
  }
  return reason;
}

function formatPartialErrors(errors: Record<string, string>) {
  const entries = Object.entries(errors);
  if (entries.length === 0) {
    return "";
  }
  const quotaOnly = entries.every(([, reason]) => reason === "quotaExceeded");
  if (quotaOnly) {
    return "일부 채널은 YouTube API 일일 할당 한도로 이번에 가져오지 못했습니다. 다른 시간에 다시 시도해 주세요.";
  }
  return `일부 채널에서 오류가 발생했습니다: ${entries
    .map(([handle, reason]) => `${handle} (${humanizeFetchReason(reason)})`)
    .join(", ")}`;
}

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

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

export default function YouTubeSection() {
  const [data, setData] = useState<YoutubeLatestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadLatestVideos() {
      try {
        setLoading(true);
        const res = await fetch("/api/youtube/latest", {
          signal: controller.signal,
        });
        const json: YoutubeLatestResponse & {
          error?: string;
          details?: Record<string, string>;
        } = await res.json();

        if (!res.ok) {
          const detailParts: string[] = [];
          if (json.error) {
            detailParts.push(json.error);
          }
          if (json.details && typeof json.details === "object") {
            detailParts.push(
              Object.entries(json.details)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")
            );
          }
          const suffix =
            detailParts.length > 0 ? ` — ${detailParts.join(" · ")}` : "";
          throw new Error(`YouTube를 불러오지 못했습니다. (${res.status})${suffix}`);
        }
        if (!cancelled) {
          setData(json);
          setVisibleCount(PAGE_SIZE);
          setError(null);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "YouTube 데이터를 불러오지 못했습니다.";
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLatestVideos();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const videos = useMemo(() => data?.items ?? [], [data]);
  const visibleVideos = useMemo(
    () => videos.slice(0, visibleCount),
    [videos, visibleCount]
  );
  const canLoadMore = visibleVideos.length < videos.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, videos.length));
  };

  const truncateTitle = (title: string, maxLength = 30) => {
    if (!title) {
      return "";
    }
    return title.length > maxLength ? `${title.slice(0, maxLength)}…` : title;
  };

  return (
    <S.Section>
      <S.ContentSectionHeader>
        <S.ContentSectionTitle>생태계 최신 YouTube</S.ContentSectionTitle>
        <S.ContentLinkButton
          href={ECOSYSTEM_URL}
          target="_blank"
          rel="noreferrer"
        >
          생태계 링크 보기 →
        </S.ContentLinkButton>
      </S.ContentSectionHeader>

      {loading && <S.LoadingText>최신 영상을 불러오는 중...</S.LoadingText>}

      {!loading && error && (
        <S.ErrorText>
          {error}
          <br />
          잠시 후 다시 시도해주세요.
        </S.ErrorText>
      )}

      {!loading && !error && videos.length === 0 && (
        <S.LoadingText>아직 수집된 영상이 없습니다.</S.LoadingText>
      )}

      {!loading && !error && visibleVideos.length > 0 && (
        <S.CardGrid>
          {visibleVideos.map((video) => (
            <S.VideoCardLink
              key={video.videoId}
              href={video.url}
              target="_blank"
              rel="noreferrer"
            >
              <S.VideoCard>
                <S.NewsCardThumbnail>
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                    />
                  ) : (
                    "썸네일 준비중"
                  )}
                </S.NewsCardThumbnail>
                <S.NewsCardTitle>{truncateTitle(video.title)}</S.NewsCardTitle>
                <S.VideoMetaRow>
                  <span>{video.channelTitle}</span>
                  <span>{formatRelativeTime(video.publishedAt)}</span>
                </S.VideoMetaRow>
                <S.VideoMetaRow>
                  <span>{formatAbsoluteTime(video.publishedAt)}</span>
                </S.VideoMetaRow>
              </S.VideoCard>
            </S.VideoCardLink>
          ))}
        </S.CardGrid>
      )}

      {canLoadMore && !loading && !error && (
        <div style={{ textAlign: "center" }}>
          <S.ContentLoadMore onClick={handleLoadMore}>더보기</S.ContentLoadMore>
        </div>
      )}

      {data?.errors && !error && (
        <S.ErrorText>{formatPartialErrors(data.errors)}</S.ErrorText>
      )}
    </S.Section>
  );
}
