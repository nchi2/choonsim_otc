import { YOUTUBE_CHANNELS, YoutubeChannel } from "./channels";

/** 채널 메타 1회 + 채널당 업로드 목록 1회 — search.list(100유닛×N) 대비 할당량 대폭 절감 */
const YOUTUBE_CHANNELS_LIST_URL = "https://www.googleapis.com/youtube/v3/channels";
const YOUTUBE_PLAYLIST_ITEMS_URL =
  "https://www.googleapis.com/youtube/v3/playlistItems";
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

type PlaylistItem = {
  snippet?: {
    title?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
    };
    resourceId?: {
      kind?: string;
      videoId?: string;
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

function handleYoutubeErrorResponse(res: Response, body: unknown): never {
  const apiReason =
    body &&
    typeof body === "object" &&
    "error" in body &&
    body.error &&
    typeof body.error === "object" &&
    "errors" in body.error &&
    Array.isArray((body.error as { errors?: unknown }).errors)
      ? (body.error as { errors: { reason?: string }[] }).errors[0]?.reason
      : undefined;

  if (res.status === 429 || apiReason === "quotaExceeded") {
    throw new YoutubeRateLimitError(apiReason ?? `HTTP ${res.status}`);
  }

  throw new Error(apiReason ?? `YouTube API error: ${res.status}`);
}

export async function fetchYoutubeLatest(
  apiKey: string
): Promise<YoutubeFetchResult> {
  const errors: Record<string, string> = {};
  let sawRateLimit = false;

  let playlistIdByChannelId: Map<string, string>;
  try {
    playlistIdByChannelId = await fetchUploadsPlaylistIds(
      YOUTUBE_CHANNELS,
      apiKey
    );
  } catch (e) {
    if (e instanceof YoutubeRateLimitError) {
      sawRateLimit = true;
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    for (const ch of YOUTUBE_CHANNELS) {
      errors[ch.handle] = message;
    }
    return {
      videos: [],
      errors,
      succeededCount: 0,
      failedCount: YOUTUBE_CHANNELS.length,
      sawRateLimit,
    };
  }

  for (const ch of YOUTUBE_CHANNELS) {
    if (!playlistIdByChannelId.has(ch.channelId)) {
      errors[ch.handle] = "uploadsPlaylistMissing";
    }
  }

  const channelsWithPlaylist = YOUTUBE_CHANNELS.filter((ch) =>
    playlistIdByChannelId.has(ch.channelId)
  );

  const fetchPromises = channelsWithPlaylist.map((ch) =>
    fetchPlaylistLatestVideos(
      ch,
      playlistIdByChannelId.get(ch.channelId)!,
      apiKey
    )
  );

  const settled = await Promise.allSettled(fetchPromises);

  const videos = settled.flatMap((result, index) => {
    const channel = channelsWithPlaylist[index];

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

async function fetchUploadsPlaylistIds(
  channels: YoutubeChannel[],
  apiKey: string
): Promise<Map<string, string>> {
  const url = new URL(YOUTUBE_CHANNELS_LIST_URL);
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("id", channels.map((c) => c.channelId).join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: CACHE_TTL_SECONDS },
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    handleYoutubeErrorResponse(res, body);
  }

  const map = new Map<string, string>();
  const items = Array.isArray((body as { items?: unknown })?.items)
    ? (body as { items: { id?: string; contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] }).items
    : [];

  for (const item of items) {
    const id = item.id;
    const uploads = item.contentDetails?.relatedPlaylists?.uploads;
    if (typeof id === "string" && typeof uploads === "string") {
      map.set(id, uploads);
    }
  }

  return map;
}

async function fetchPlaylistLatestVideos(
  channel: YoutubeChannel,
  playlistId: string,
  apiKey: string
): Promise<YoutubeVideo[]> {
  const url = new URL(YOUTUBE_PLAYLIST_ITEMS_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("maxResults", String(MAX_RESULTS_PER_CHANNEL));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: CACHE_TTL_SECONDS },
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    handleYoutubeErrorResponse(res, body);
  }

  const items: PlaylistItem[] = Array.isArray((body as { items?: unknown })?.items)
    ? ((body as { items: PlaylistItem[] }).items ?? [])
    : [];

  return items
    .filter((item) => {
      const id = item.snippet?.resourceId?.videoId;
      const at = item.snippet?.publishedAt;
      return Boolean(id && at);
    })
    .map((item) => {
      const videoId = item.snippet!.resourceId!.videoId!;
      return {
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: item.snippet!.title ?? "",
        thumbnail:
          item.snippet!.thumbnails?.medium?.url ??
          item.snippet!.thumbnails?.default?.url ??
          "",
        channelTitle:
          item.snippet!.channelTitle ?? channel.displayName,
        channelId: channel.channelId,
        displayName: channel.displayName,
        handle: channel.handle,
        publishedAt: item.snippet!.publishedAt!,
      };
    });
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
