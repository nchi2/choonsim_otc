import { YOUTUBE_CHANNELS, YoutubeChannel } from "./channels";

/**
 * 공개 채널 최신 영상은 Atom 피드로 가져옴 (Data API 키·일일 할당 불필요).
 * https://www.youtube.com/feeds/videos.xml?channel_id=…
 */
const MAX_RESULTS_PER_CHANNEL = 3;

function channelFeedUrl(channelId: string) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

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
  /** Data API 미사용 — 항상 false (라우트 캐시 fallback 호환용) */
  sawRateLimit: boolean;
};

const rssFetchInit: RequestInit = {
  cache: "no-store",
  headers: {
    Accept: "application/atom+xml,application/xml;q=0.9,*/*;q=0.8",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
};

export async function fetchYoutubeLatest(): Promise<YoutubeFetchResult> {
  const errors: Record<string, string> = {};
  const settled = await Promise.allSettled(
    YOUTUBE_CHANNELS.map((ch) => fetchChannelLatestFromRss(ch))
  );

  const videos = settled.flatMap((result, index) => {
    const channel = YOUTUBE_CHANNELS[index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    const reason =
      result.reason instanceof Error ? result.reason.message : "Unknown error";
    errors[channel.handle] = reason;

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
    sawRateLimit: false,
  };
}

async function fetchChannelLatestFromRss(
  channel: YoutubeChannel
): Promise<YoutubeVideo[]> {
  const res = await fetch(channelFeedUrl(channel.channelId), rssFetchInit);

  if (!res.ok) {
    throw new Error(`feed HTTP ${res.status}`);
  }

  const xml = await res.text();
  return parseAtomFeed(xml, channel);
}

function parseAtomFeed(xml: string, channel: YoutubeChannel): YoutubeVideo[] {
  const chunks = xml.split("<entry>").slice(1);
  const videos: YoutubeVideo[] = [];

  for (const chunk of chunks) {
    if (videos.length >= MAX_RESULTS_PER_CHANNEL) {
      break;
    }

    const block = (chunk.split("</entry>")[0] ?? chunk).trim();

    const videoId =
      block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim() ??
      block.match(/<id>yt:video:([^<]+)<\/id>/)?.[1]?.trim();

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      continue;
    }

    const published =
      block.match(/<published>([^<]+)<\/published>/)?.[1]?.trim() ??
      block.match(/<updated>([^<]+)<\/updated>/)?.[1]?.trim();

    if (!published) {
      continue;
    }

    const title = extractEntryTitle(block);
    const thumbMatch = block.match(/<media:thumbnail[^>]*\burl="([^"]+)"/);
    const thumbnail =
      thumbMatch?.[1] ?? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    videos.push({
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      thumbnail,
      channelTitle: channel.displayName,
      channelId: channel.channelId,
      displayName: channel.displayName,
      handle: channel.handle,
      publishedAt: published,
    });
  }

  return videos;
}

function extractEntryTitle(block: string): string {
  const cdata = block.match(
    /<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/
  );
  if (cdata) {
    return decodeXmlEntities(cdata[1].trim());
  }
  const plain = block.match(/<title>([^<]*)<\/title>/)?.[1];
  return decodeXmlEntities((plain ?? "").trim());
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
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
