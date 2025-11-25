import { YOUTUBE_CHANNELS, YoutubeChannel } from "./channels";

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const MAX_RESULTS_PER_CHANNEL = 3;

export const CACHE_TTL_SECONDS = 300;

export type YoutubeVideo = {
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  channelId: string;
  displayName: string;
  handle: string;
  publishedAt: string;
};

export type YoutubeFetchResult = {
  videos: YoutubeVideo[];
  errors?: Record<string, string>;
  succeededCount: number;
  failedCount: number;
  sawRateLimit: boolean;
};

type YoutubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
    };
  };
};

export class YoutubeRateLimitError extends Error {
  public readonly code = "RATE_LIMIT";

  constructor(message: string) {
    super(message);
    this.name = "YoutubeRateLimitError";
  }
}

export async function fetchYoutubeLatest(
  apiKey: string
): Promise<YoutubeFetchResult> {
  const errors: Record<string, string> = {};
  let sawRateLimit = false;

  const fetchPromises = YOUTUBE_CHANNELS.map((channel) =>
    fetchChannelLatestVideos(channel, apiKey)
  );

  const settled = await Promise.allSettled(fetchPromises);

  const videos = settled.flatMap((result, index) => {
    const channel = YOUTUBE_CHANNELS[index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    const reason =
      result.reason instanceof Error ? result.reason.message : "Unknown error";
    errors[channel.handle] = reason;

    if (result.reason instanceof YoutubeRateLimitError) {
      sawRateLimit = true;
    }

    return [];
  });

  const succeededCount = settled.filter(
    (result) => result.status === "fulfilled"
  ).length;

  return {
    videos: deduplicateAndSort(videos),
    errors: Object.keys(errors).length ? errors : undefined,
    succeededCount,
    failedCount: YOUTUBE_CHANNELS.length - succeededCount,
    sawRateLimit,
  };
}

async function fetchChannelLatestVideos(
  channel: YoutubeChannel,
  apiKey: string
): Promise<YoutubeVideo[]> {
  const url = new URL(YOUTUBE_SEARCH_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channel.channelId);
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", String(MAX_RESULTS_PER_CHANNEL));
  url.searchParams.set("type", "video");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: CACHE_TTL_SECONDS },
  });

  if (!res.ok) {
    let reason = `YouTube API error: ${res.status}`;

    try {
      const errorBody = await res.json();
      const apiReason = errorBody?.error?.errors?.[0]?.reason;
      if (apiReason) {
        reason = apiReason;
      }
      if (res.status === 429 || apiReason === "quotaExceeded") {
        throw new YoutubeRateLimitError(reason);
      }
    } catch {
      // ignore JSON parse failure
    }

    throw new Error(reason);
  }

  const data = await res.json();
  const items: YoutubeSearchItem[] = Array.isArray(data.items)
    ? data.items
    : [];

  return items
    .filter(
      (
        item
      ): item is Required<YoutubeSearchItem> & {
        id: { videoId: string };
        snippet: { publishedAt: string; title: string };
      } => Boolean(item.id?.videoId && item.snippet?.publishedAt)
    )
    .map((item) => ({
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: item.snippet.title ?? "",
      thumbnail:
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        "",
      channelTitle: item.snippet.channelTitle ?? channel.displayName,
      channelId: channel.channelId,
      displayName: channel.displayName,
      handle: channel.handle,
      publishedAt: item.snippet.publishedAt,
    }));
}

function deduplicateAndSort(videos: YoutubeVideo[]) {
  const unique = new Map<string, YoutubeVideo>();
  videos.forEach((video) => {
    unique.set(video.videoId, video);
  });

  return Array.from(unique.values()).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}


