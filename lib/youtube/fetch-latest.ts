import { YOUTUBE_CHANNELS, YoutubeChannel } from "./channels";

/**
 * 1차: 채널 RSS (channelId) — 봇 차단에 강하고 파싱이 단순함.
 * 2차: /videos HTML의 ytInitialData (richItemRenderer / legacy videoRenderer).
 */
const MAX_RESULTS_PER_CHANNEL = 3;
const CHANNEL_FETCH_TIMEOUT_MS = 4000;

/** 스크래핑 빈도 완화 — 15분마다 갱신(서버리스 타임아웃·YouTube 부하 감소) */
export const CACHE_TTL_SECONDS = 900;

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

type LockupViewModelJson = {
  contentId?: string;
  contentImage?: {
    thumbnailViewModel?: {
      image?: { sources?: { url?: string }[] };
    };
  };
  metadata?: {
    lockupMetadataViewModel?: {
      title?: { content?: string };
    };
  };
  rendererContext?: {
    commandContext?: {
      onTap?: {
        innertubeCommand?: {
          watchEndpoint?: { videoId?: string };
        };
      };
    };
  };
};

const RENDERER_KEYS = [
  "videoRenderer",
  "compactVideoRenderer",
  "gridVideoRenderer",
] as const;

const SHARED_FETCH_HEADERS = {
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Cookie: "CONSENT=YES+1",
} as const;

const rssFetchInit: RequestInit = {
  cache: "no-store",
  headers: {
    ...SHARED_FETCH_HEADERS,
    Accept: "application/atom+xml, application/xml, text/xml, */*;q=0.8",
  },
};

const browseFetchInit: RequestInit = {
  cache: "no-store",
  headers: {
    ...SHARED_FETCH_HEADERS,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8",
  },
};

export async function fetchYoutubeLatest(): Promise<YoutubeFetchResult> {
  if (process.env.YOUTUBE_SCRAPE_DEBUG === "1") {
    const otaverse = YOUTUBE_CHANNELS.find((c) => c.handle === "@otaverse");
    if (otaverse) {
      await logYoutubeScrapeDiagnostics(otaverse);
    }
  }

  const errors: Record<string, string> = {};
  const settled = await Promise.allSettled(
    YOUTUBE_CHANNELS.map((ch) => fetchChannelLatest(ch)),
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
    (result) => result.status === "fulfilled",
  ).length;

  return {
    videos: deduplicateAndSort(videos),
    errors: Object.keys(errors).length ? errors : undefined,
    succeededCount,
    failedCount: YOUTUBE_CHANNELS.length - succeededCount,
    sawRateLimit: false,
  };
}

/** YOUTUBE_SCRAPE_DEBUG=1 일 때만 — consent / ytInitialData / 파서 경로 점검 */
async function logYoutubeScrapeDiagnostics(channel: YoutubeChannel): Promise<void> {
  const handleSlug = channel.handle.replace(/^@/, "");
  const browseUrl = `https://www.youtube.com/channel/${encodeURIComponent(channel.channelId)}/videos`;
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channel.channelId)}`;

  console.info("[youtube:debug] request headers", {
    handle: channel.handle,
    browse: browseFetchInit.headers,
    rss: rssFetchInit.headers,
  });

  for (const [label, url, init] of [
    ["rss", rssUrl, rssFetchInit],
    ["browse", browseUrl, browseFetchInit],
  ] as const) {
    try {
      const res = await fetchWithTimeout(url, init, CHANNEL_FETCH_TIMEOUT_MS);
      const body = await res.text();
      const snippet = body.slice(0, 400).replace(/\s+/g, " ");
      const consent =
        /consent\.youtube/i.test(res.url) ||
        /Before you continue|동의하고 계속|consent\.youtube/i.test(body.slice(0, 80_000));
      const hasYtInitial = body.includes("var ytInitialData = ");
      const legacyCount = (body.match(/"videoRenderer"/g) ?? []).length;
      const richCount = (body.match(/"richItemRenderer"/g) ?? []).length;
      const atomEntries = label === "rss" ? (body.match(/<entry>/g) ?? []).length : null;

      console.info(`[youtube:debug] ${label}`, {
        status: res.status,
        finalUrl: res.url,
        length: body.length,
        consentPage: consent,
        ytInitialData: hasYtInitial,
        videoRendererRefs: legacyCount,
        richItemRendererRefs: richCount,
        atomEntries,
        snippet,
      });

      if (label === "browse" && hasYtInitial) {
        const data = extractYtInitialData(body);
        const legacy: VideoRendererJson[] = [];
        const rich: LockupViewModelJson[] = [];
        if (data) {
          collectVideoRenderers(data, legacy);
          collectLockupViewModels(data, rich);
        }
        console.info("[youtube:debug] browse parse", {
          legacyRendererNodes: legacy.length,
          lockupViewModelNodes: rich.length,
          parsedLegacyVideos: legacy.length
            ? videosFromLegacyRenderers(legacy, channel).length
            : 0,
          parsedRichVideos: rich.length
            ? videosFromLockupViewModels(rich, channel).length
            : 0,
        });
      }
    } catch (e) {
      console.info(`[youtube:debug] ${label} failed`, {
        error: errorMessageFromUnknown(e),
      });
    }
  }
}

async function fetchChannelLatest(
  channel: YoutubeChannel,
): Promise<YoutubeVideo[]> {
  try {
    const fromRss = await fetchChannelLatestFromRss(channel);
    if (fromRss.length > 0) {
      return fromRss;
    }
  } catch {
    // RSS 실패 시 HTML 스크래핑으로 폴백
  }

  return fetchChannelLatestFromBrowse(channel);
}

async function fetchChannelLatestFromRss(
  channel: YoutubeChannel,
): Promise<YoutubeVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channel.channelId)}`;
  const res = await fetchWithTimeout(url, rssFetchInit, CHANNEL_FETCH_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`feed HTTP ${res.status}`);
  }
  const xml = await res.text();
  return videosFromRssXml(xml, channel);
}

function videosFromRssXml(xml: string, channel: YoutubeChannel): YoutubeVideo[] {
  const videos: YoutubeVideo[] = [];
  const blocks = xml.split("<entry>").slice(1);

  for (const block of blocks) {
    if (videos.length >= MAX_RESULTS_PER_CHANNEL) {
      break;
    }
    const entry = block.split("</entry>")[0] ?? block;
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      continue;
    }

    const title = decodeXmlEntities(
      entry.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? "",
    );
    const publishedRaw = entry.match(/<published>([^<]+)<\/published>/)?.[1]?.trim();
    const publishedAt = publishedRaw
      ? new Date(publishedRaw).toISOString()
      : fallbackPublishedAt(videos.length);
    const thumb =
      entry.match(/<media:thumbnail[^>]*\surl="([^"]+)"/)?.[1] ??
      `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    videos.push(buildVideo(channel, videoId, title, thumb, publishedAt));
  }

  return videos;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function errorMessageFromUnknown(e: unknown): string {
  if (e instanceof Error) {
    if (e.name === "AbortError") {
      return "timeout";
    }
    return e.message;
  }
  return String(e);
}

async function fetchChannelLatestFromBrowse(
  channel: YoutubeChannel,
): Promise<YoutubeVideo[]> {
  const handleSlug = channel.handle.replace(/^@/, "");
  const urls = [
    `https://www.youtube.com/channel/${encodeURIComponent(channel.channelId)}/videos`,
    `https://www.youtube.com/@${encodeURIComponent(handleSlug)}/videos`,
  ];

  let lastErr: Error | null = null;

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(
        url,
        browseFetchInit,
        CHANNEL_FETCH_TIMEOUT_MS,
      );
      if (!res.ok) {
        throw new Error(`browse HTTP ${res.status}`);
      }
      const html = await res.text();
      const videos = videosFromBrowseHtml(html, channel);
      if (videos.length > 0) {
        return videos;
      }
      lastErr = new Error("noVideosInPage");
    } catch (e) {
      lastErr = new Error(errorMessageFromUnknown(e));
    }
  }

  throw lastErr ?? new Error("noVideosInPage");
}

function videosFromBrowseHtml(
  html: string,
  channel: YoutubeChannel,
): YoutubeVideo[] {
  const data = extractYtInitialData(html);
  if (!data) {
    throw new Error("ytInitialData missing");
  }

  const legacyRenderers: VideoRendererJson[] = [];
  const lockups: LockupViewModelJson[] = [];
  collectVideoRenderers(data, legacyRenderers);
  collectLockupViewModels(data, lockups);

  const seen = new Set<string>();
  const videos: YoutubeVideo[] = [];

  for (const v of videosFromLegacyRenderers(legacyRenderers, channel)) {
    if (videos.length >= MAX_RESULTS_PER_CHANNEL) {
      break;
    }
    if (seen.has(v.videoId)) {
      continue;
    }
    seen.add(v.videoId);
    videos.push(v);
  }

  for (const v of videosFromLockupViewModels(lockups, channel)) {
    if (videos.length >= MAX_RESULTS_PER_CHANNEL) {
      break;
    }
    if (seen.has(v.videoId)) {
      continue;
    }
    seen.add(v.videoId);
    videos.push(v);
  }

  return videos;
}

function videosFromLegacyRenderers(
  renderers: VideoRendererJson[],
  channel: YoutubeChannel,
): YoutubeVideo[] {
  const videos: YoutubeVideo[] = [];

  for (const vr of renderers) {
    const id = videoIdFromRenderer(vr);
    if (!id) {
      continue;
    }

    const title =
      vr.title?.runs?.map((r) => r.text ?? "").join("")?.trim() ?? "";
    const publishedLabel = vr.publishedTimeText?.simpleText?.trim() ?? "";
    const publishedAt =
      parseRelativeTimeLabel(publishedLabel) ??
      fallbackPublishedAt(videos.length);

    const thumbs = vr.thumbnail?.thumbnails;
    const thumbnail =
      thumbs && thumbs.length > 0
        ? (thumbs[thumbs.length - 1]?.url ?? "")
        : `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

    videos.push(buildVideo(channel, id, title, thumbnail, publishedAt));
  }

  return videos;
}

function videosFromLockupViewModels(
  lockups: LockupViewModelJson[],
  channel: YoutubeChannel,
): YoutubeVideo[] {
  const videos: YoutubeVideo[] = [];

  for (const lockup of lockups) {
    const id = videoIdFromLockup(lockup);
    if (!id) {
      continue;
    }

    const title =
      lockup.metadata?.lockupMetadataViewModel?.title?.content?.trim() ?? "";
    const sources =
      lockup.contentImage?.thumbnailViewModel?.image?.sources ?? [];
    const thumbnail =
      sources.length > 0
        ? (sources[sources.length - 1]?.url ?? "")
        : `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

    videos.push(
      buildVideo(channel, id, title, thumbnail, fallbackPublishedAt(videos.length)),
    );
  }

  return videos;
}

function buildVideo(
  channel: YoutubeChannel,
  videoId: string,
  title: string,
  thumbnail: string,
  publishedAt: string,
): YoutubeVideo {
  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title,
    thumbnail,
    channelTitle: channel.displayName,
    channelId: channel.channelId,
    displayName: channel.displayName,
    handle: channel.handle,
    publishedAt,
  };
}

function videoIdFromLockup(lockup: LockupViewModelJson): string | undefined {
  const raw =
    lockup.contentId?.trim() ??
    lockup.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId?.trim();
  if (raw && /^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return raw;
  }
  return undefined;
}

function collectLockupViewModels(node: unknown, out: LockupViewModelJson[]): void {
  if (node === null || typeof node !== "object") {
    return;
  }
  if (Array.isArray(node)) {
    for (const x of node) {
      collectLockupViewModels(x, out);
    }
    return;
  }
  const rec = node as Record<string, unknown>;
  const content = rec.content as Record<string, unknown> | undefined;
  const lockup = content?.lockupViewModel;
  if (lockup && typeof lockup === "object") {
    out.push(lockup as LockupViewModelJson);
  }
  if (rec.richItemRenderer && typeof rec.richItemRenderer === "object") {
    const ri = rec.richItemRenderer as Record<string, unknown>;
    const riContent = ri.content as Record<string, unknown> | undefined;
    const riLockup = riContent?.lockupViewModel;
    if (riLockup && typeof riLockup === "object") {
      out.push(riLockup as LockupViewModelJson);
    }
  }
  for (const [k, v] of Object.entries(rec)) {
    if (k === "richItemRenderer" || k === "content") {
      continue;
    }
    collectLockupViewModels(v, out);
  }
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

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** 전각 숫자(０–９) → ASCII 숫자 (YouTube UI·지역별 문자 대응) */
function normalizeDisplayDigits(s: string): string {
  return s.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30),
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
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
