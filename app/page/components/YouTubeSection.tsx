"use client";

import { useEffect, useMemo, useState } from "react";
import type { YoutubeVideo } from "@/lib/youtube/fetch-latest";
import {
  YOUTUBE_CHANNELS,
  type YoutubeChannel,
  youtubeChannelUrl,
} from "@/lib/youtube/channels";
import {
  CURATED,
  CURATED_CATEGORIES,
  type CuratedCategoryId,
  type CuratedVideo,
  curatedThumbnailUrl,
  curatedWatchUrl,
} from "@/lib/youtube/curated-videos";
import { COMMUNITY_ECOSYSTEM_LINKTREE } from "@/lib/community-linktree";
import * as S from "../styles";

const ECOSYSTEM_URL = COMMUNITY_ECOSYSTEM_LINKTREE.href;
const PAGE_SIZE = 6;

type TabId = "all" | CuratedCategoryId;
const TAB_ALL: { id: "all"; label: string } = { id: "all", label: "전체보기" };

/**
 * 표시명에서 첫 글자(또는 첫 ASCII 문자)를 이니셜로 추출. 한글은 그대로,
 * 영문은 대문자로. 비어 있으면 "?".
 */
function channelInitial(channel: YoutubeChannel): string {
  const source = channel.displayName || channel.handle.replace(/^@/, "");
  const trimmed = source.trim();
  if (!trimmed) return "?";
  const first = Array.from(trimmed)[0] ?? "?";
  return /[a-z]/.test(first) ? first.toUpperCase() : first;
}

function ChannelStripItem({ channel }: { channel: YoutubeChannel }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(channel.avatar) && !imgFailed;

  return (
    <S.ChannelStripItem
      href={youtubeChannelUrl(channel)}
      target="_blank"
      rel="noreferrer"
      aria-label={`${channel.displayName} 유튜브 채널 열기`}
      title={channel.displayName}
    >
      <S.ChannelAvatarFrame>
        {showImage ? (
          // 채널 아바타는 외부(yt3.googleusercontent.com) 정적 URL이라 next/image
          // 비용·도메인 등록 없이 native <img>로 충분.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.avatar}
            alt={channel.displayName}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <S.ChannelAvatarInitial>
            {channelInitial(channel)}
          </S.ChannelAvatarInitial>
        )}
      </S.ChannelAvatarFrame>
      <S.ChannelStripLabel>{channel.displayName}</S.ChannelStripLabel>
    </S.ChannelStripItem>
  );
}

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

/**
 * `noVideosInPage`는 "영상이 0개"라는 정상 상태(아직 업로드 전)일 뿐이라
 * 사용자에게 에러로 보이는 게 부적절하다. 표시 단계에서 필터링한다.
 */
function formatPartialErrors(errors: Record<string, string>) {
  const entries = Object.entries(errors).filter(
    ([, reason]) => reason !== "noVideosInPage",
  );
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
  const [activeTab, setActiveTab] = useState<TabId>("all");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadLatestVideos() {
      try {
        setLoading(true);
        const res = await fetch("/api/youtube/latest", {
          signal: controller.signal,
        });
        const raw = await res.text();
        let json: YoutubeLatestResponse & {
          error?: string;
          details?: Record<string, string>;
        };
        try {
          json = JSON.parse(raw) as typeof json;
        } catch {
          throw new Error(
            "콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
          );
        }

        if (!res.ok) {
          const detailParts: string[] = [];
          if (json.error) {
            detailParts.push(json.error);
          }
          if (json.details && typeof json.details === "object") {
            detailParts.push(
              Object.entries(json.details)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", "),
            );
          }
          const suffix =
            detailParts.length > 0 ? ` — ${detailParts.join(" · ")}` : "";
          throw new Error(
            `YouTube를 불러오지 못했습니다. (${res.status})${suffix}`,
          );
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

  const isAllTab = activeTab === "all";
  const curatedItems = useMemo<CuratedVideo[]>(
    () => (isAllTab ? [] : CURATED[activeTab]),
    [isAllTab, activeTab],
  );

  const visibleVideos = useMemo(
    () => videos.slice(0, visibleCount),
    [videos, visibleCount],
  );
  const visibleCurated = useMemo(
    () => curatedItems.slice(0, visibleCount),
    [curatedItems, visibleCount],
  );

  const totalForActive = isAllTab ? videos.length : curatedItems.length;
  const visibleForActive = isAllTab
    ? visibleVideos.length
    : visibleCurated.length;
  const canLoadMore = visibleForActive < totalForActive;

  /** 탭을 바꾸면 처음 6개부터 다시 보이도록 리셋. */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, totalForActive));
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

      <S.TabStrip role="tablist" aria-label="유튜브 카테고리">
        {[TAB_ALL, ...CURATED_CATEGORIES].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <S.TabButton
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              $active={active}
              onClick={() => setActiveTab(tab.id as TabId)}
            >
              {tab.label}
            </S.TabButton>
          );
        })}
      </S.TabStrip>

      {/* 채널 아바타 줄은 RSS 자동 수집 컨텍스트에서만 의미가 있어 "전체보기"에서만 노출 */}
      {isAllTab && (
        <S.ChannelStrip aria-label="생태계 유튜브 채널 바로가기">
          {YOUTUBE_CHANNELS.map((channel) => (
            <ChannelStripItem key={channel.channelId} channel={channel} />
          ))}
        </S.ChannelStrip>
      )}

      {isAllTab ? (
        <>
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
                        // 썸네일은 i.ytimg.com 정적 URL. native <img>로 통일.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        "썸네일 준비중"
                      )}
                    </S.NewsCardThumbnail>
                    <S.NewsCardTitle>
                      {truncateTitle(video.title)}
                    </S.NewsCardTitle>
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
              <S.ContentLoadMore onClick={handleLoadMore}>
                더보기
              </S.ContentLoadMore>
            </div>
          )}

          {(() => {
            if (!data?.errors || error) return null;
            const message = formatPartialErrors(data.errors);
            if (!message) return null;
            return <S.ErrorText>{message}</S.ErrorText>;
          })()}
        </>
      ) : curatedItems.length === 0 ? (
        <S.LoadingText>아직 등록된 영상이 없습니다.</S.LoadingText>
      ) : (
        <>
          <S.CardGrid>
            {visibleCurated.map((video) => (
              <S.VideoCardLink
                key={video.videoId}
                href={curatedWatchUrl(video.videoId)}
                target="_blank"
                rel="noreferrer"
              >
                <S.VideoCard>
                  <S.NewsCardThumbnail>
                    {/* 큐레이션 썸네일도 img.youtube.com 정적 URL. native <img>로 통일. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={curatedThumbnailUrl(video.videoId)}
                      alt={video.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </S.NewsCardThumbnail>
                  <S.NewsCardTitle>
                    {truncateTitle(video.title)}
                  </S.NewsCardTitle>
                  {video.channelTitle ? (
                    <S.VideoMetaRow>
                      <span>{video.channelTitle}</span>
                      {video.publishedAt ? (
                        <span>{formatRelativeTime(video.publishedAt)}</span>
                      ) : null}
                    </S.VideoMetaRow>
                  ) : null}
                </S.VideoCard>
              </S.VideoCardLink>
            ))}
          </S.CardGrid>

          {canLoadMore && (
            <div style={{ textAlign: "center" }}>
              <S.ContentLoadMore onClick={handleLoadMore}>
                더보기
              </S.ContentLoadMore>
            </div>
          )}
        </>
      )}
    </S.Section>
  );
}
