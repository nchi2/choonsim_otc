import { YOUTUBE_CHANNELS, YoutubeChannel } from "./channels";

/**
 * YouTube는 channel_id 기반 Atom 피드(/feeds/videos.xml)를 404로 막는 경우가 많음(2025~).
 * 채널 /videos 탭 HTML 안의 ytInitialData(JSON)에서 videoRenderer를 수집한다.
 */
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

type VideoRendererJson = {
  videoId?: string;
  title?: { runs?: { text?: string }[] };
  thumbnail?: { thumbnails?: { url?: string }[] };
  publishedTimeText?: { simpleText?: string };
  navigationEndpoint?: {
    watchEndpoint?: { videoId?: string };
    reelWatchEndpoint?: { videoId?: string };
  };
};

const RENDERER_KEYS = [
  "videoRenderer",
  "compactVideoRenderer",
  "gridVideoRenderer",
] as const;

const browseFetchInit: RequestInit = {
  cache: "no-store",
  headers: {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
};

export async function fetchYoutubeLatest(): Promise<YoutubeFetchResult> {
  const errors: Record<string, string> = {};
  const settled = await Promise.allSettled(
    YOUTUBE_CHANNELS.map((ch) => fetchChannelLatestFromBrowse(ch))
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

async function fetchChannelLatestFromBrowse(
  channel: YoutubeChannel
): Promise<YoutubeVideo[]> {
  const handleSlug = channel.handle.replace(/^@/, "");
  const urls = [
    `https://www.youtube.com/channel/${encodeURIComponent(channel.channelId)}/videos`,
    `https://www.youtube.com/@${encodeURIComponent(handleSlug)}/videos`,
  ];

  let lastErr: Error | null = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, browseFetchInit);
      if (!res.ok) {
        throw new Error(`browse HTTP ${res.status}`);
      }
      const html = await res.text();
      const videos = videosFromBrowseHtml(html, channel);
      if (videos.length > 0) {
        return videos;
      }
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastErr ?? new Error("noVideosInPage");
}

function videosFromBrowseHtml(
  html: string,
  channel: YoutubeChannel
): YoutubeVideo[] {
  const data = extractYtInitialData(html);
  if (!data) {
    throw new Error("ytInitialData missing");
  }

  const renderers: VideoRendererJson[] = [];
  collectVideoRenderers(data, renderers);

  const seen = new Set<string>();
  const videos: YoutubeVideo[] = [];

  for (const vr of renderers) {
    if (videos.length >= MAX_RESULTS_PER_CHANNEL) {
      break;
    }
    const id = videoIdFromRenderer(vr);
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);

    const title =
      vr.title?.runs?.map((r) => r.text ?? "").join("")?.trim() ?? "";
    const publishedLabel = vr.publishedTimeText?.simpleText?.trim() ?? "";
    const publishedAt =
      parseRelativeTimeLabel(publishedLabel) ?? fallbackPublishedAt(videos.length);

    const thumbs = vr.thumbnail?.thumbnails;
    const thumbnail =
      thumbs && thumbs.length > 0
        ? thumbs[thumbs.length - 1]?.url ?? ""
        : `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

    videos.push({
      videoId: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      title,
      thumbnail,
      channelTitle: channel.displayName,
      channelId: channel.channelId,
      displayName: channel.displayName,
      handle: channel.handle,
      publishedAt,
    });
  }

  return videos;
}

function videoIdFromRenderer(vr: VideoRendererJson): string | undefined {
  const raw = vr.videoId?.trim();
  if (raw && /^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return raw;
  }
  const nav = vr.navigationEndpoint;
  const fromWatch = nav?.watchEndpoint?.videoId?.trim();
  if (fromWatch && /^[a-zA-Z0-9_-]{11}$/.test(fromWatch)) {
    return fromWatch;
  }
  const fromReel = nav?.reelWatchEndpoint?.videoId?.trim();
  if (fromReel && /^[a-zA-Z0-9_-]{11}$/.test(fromReel)) {
    return fromReel;
  }
  return undefined;
}

function extractYtInitialData(html: string): unknown | null {
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) {
    return null;
  }
  let i = start + marker.length;
  while (i < html.length && (html[i] === " " || html[i] === "\n")) {
    i++;
  }
  if (html[i] !== "{") {
    return null;
  }
  let depth = 0;
  const jsonStart = i;
  let inStr = false;
  let esc = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === '"') {
        inStr = false;
      }
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(jsonStart, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function collectVideoRenderers(node: unknown, out: VideoRendererJson[]): void {
  if (node === null || typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const x of node) {
      collectVideoRenderers(x, out);
    }
    return;
  }
  const rec = node as Record<string, unknown>;
  for (const key of RENDERER_KEYS) {
    const r = rec[key];
    if (r && typeof r === "object") {
      out.push(r as VideoRendererJson);
    }
  }
  for (const [k, v] of Object.entries(rec)) {
    if ((RENDERER_KEYS as readonly string[]).includes(k)) {
      continue;
    }
    collectVideoRenderers(v, out);
  }
}

/** 전각 숫자(０–９) → ASCII 숫자 (YouTube UI·지역별 문자 대응) */
function normalizeDisplayDigits(s: string): string {
  return s.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30)
  );
}

/** 상대 시각 문구(한/영) → 대략적인 ISO 시각 (정렬·노출용) */
function parseRelativeTimeLabel(label: string): string | null {
  const s = normalizeDisplayDigits(label.trim());
  if (!s) {
    return null;
  }
  const now = Date.now();
  const ko = [
    /^(\d+)\s*초\s*전$/,
    /^(\d+)\s*분\s*전$/,
    /^(\d+)\s*시간\s*전$/,
    /^(\d+)\s*일\s*전$/,
    /^(\d+)\s*주\s*전$/,
    /^(\d+)\s*개월\s*전$/,
  ];
  const en = [
    /^(\d+)\s*seconds?\s*ago$/i,
    /^(\d+)\s*minutes?\s*ago$/i,
    /^(\d+)\s*hours?\s*ago$/i,
    /^(\d+)\s*days?\s*ago$/i,
    /^(\d+)\s*weeks?\s*ago$/i,
    /^(\d+)\s*months?\s*ago$/i,
  ];
  const mults = [1000, 60_000, 3_600_000, 86_400_000, 604_800_000, 2_592_000_000];

  for (let j = 0; j < mults.length; j++) {
    const km = s.match(ko[j]);
    const em = s.match(en[j]);
    const m = km ?? em;
    if (m) {
      return new Date(now - Number(m[1]) * mults[j]).toISOString();
    }
  }
  if (/^(방금|지금|Just now|just now)/i.test(s)) {
    return new Date(now).toISOString();
  }
  if (/^(어제|Yesterday)/i.test(s)) {
    return new Date(now - 86_400_000).toISOString();
  }
  if (/streamed|live|라이브|스트리밍/i.test(s)) {
    return new Date(now).toISOString();
  }
  return null;
}

function fallbackPublishedAt(index: number): string {
  return new Date(Date.now() - index * 3600_000).toISOString();
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
