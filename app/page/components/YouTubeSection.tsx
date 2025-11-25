"use client";

import { useEffect, useMemo, useState } from "react";
import type { YoutubeVideo } from "@/lib/youtube/fetch-latest";
import * as S from "../styles";

const YOUTUBE_HUB_URL = "https://www.youtube.com/@otaverse/videos";
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
        if (!res.ok) {
          throw new Error(`API 응답이 올바르지 않습니다. (${res.status})`);
        }
        const json: YoutubeLatestResponse = await res.json();
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
      <S.SectionTitle>유튜브 최신 영상</S.SectionTitle>
      <S.SectionDescription>
        요청 채널의 최신 영상을 5분마다 자동으로 수집합니다. 새로 올라온
        콘텐츠를 바로 확인해보세요.
      </S.SectionDescription>

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
                    <img src={video.thumbnail} alt={video.title} />
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
          <S.ActionButton type="button" onClick={handleLoadMore}>
            더 보기
          </S.ActionButton>
        </div>
      )}

      {data?.meta && videos.length > 0 && (
        <S.SectionDescription>
          마지막 동기화: {formatAbsoluteTime(data.meta.fetchedAt)} · 성공{" "}
          {data.meta.channels.succeeded}개 / 실패 {data.meta.channels.failed}개{" "}
          {data.meta.cache.hit ? "(캐시 응답)" : ""}
        </S.SectionDescription>
      )}

      {data?.errors && !error && (
        <S.ErrorText>
          일부 채널에서 오류가 발생했습니다:{" "}
          {Object.entries(data.errors)
            .map(([handle, reason]) => `${handle} (${reason})`)
            .join(", ")}
        </S.ErrorText>
      )}

      <div style={{ textAlign: "center" }}>
        <S.SectionButton
          href={YOUTUBE_HUB_URL}
          target="_blank"
          rel="noreferrer"
        >
          더 많은 영상 보기
        </S.SectionButton>
      </div>
    </S.Section>
  );
}
