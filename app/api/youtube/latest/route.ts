// app/api/youtube/latest/route.ts
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { YOUTUBE_CHANNELS } from "@/lib/youtube/channels";
import {
  CACHE_TTL_SECONDS,
  YoutubeVideo,
  fetchYoutubeLatest,
} from "@/lib/youtube/fetch-latest";

const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

// Next.js 16 requires literal values for route segment config
export const revalidate = 300;

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

type CachedResponse = {
  fetchedAt: number;
  payload: YoutubeLatestResponse;
};

let lastSuccessfulResponse: CachedResponse | null = null;

export async function GET() {
  const youtubeApiKey = env.youtubeApiKey;

  if (!youtubeApiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY missing" },
      { status: 500 }
    );
  }

  const cached = getFreshCache();
  if (cached) {
    return NextResponse.json(
      withCacheMeta(cached.payload, {
        hit: true,
        ageMs: Date.now() - cached.fetchedAt,
        reason: "ttl",
      }),
      buildCacheHeaders()
    );
  }

  try {
    const { videos, errors, succeededCount, failedCount, sawRateLimit } =
      await fetchYoutubeLatest(youtubeApiKey);

    if (!videos.length && lastSuccessfulResponse && sawRateLimit) {
      const cachedPayload = withCacheMeta(lastSuccessfulResponse.payload, {
        hit: true,
        ageMs: Date.now() - lastSuccessfulResponse.fetchedAt,
        reason: "rate_limited",
      });

      return NextResponse.json(cachedPayload, buildCacheHeaders());
    }

    if (!videos.length) {
      return NextResponse.json(
        {
          error: "Failed to fetch YouTube videos",
          details: errors,
        },
        { status: 502 }
      );
    }

    const payload = buildPayload(videos, succeededCount, failedCount, errors);
    lastSuccessfulResponse = { fetchedAt: Date.now(), payload };

    return NextResponse.json(payload, buildCacheHeaders());
  } catch (error) {
    console.error("YouTube fetch failed:", error);

    if (lastSuccessfulResponse) {
      return NextResponse.json(
        withCacheMeta(lastSuccessfulResponse.payload, {
          hit: true,
          ageMs: Date.now() - lastSuccessfulResponse.fetchedAt,
          reason: "rate_limited",
        }),
        buildCacheHeaders()
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch YouTube videos" },
      { status: 500 }
    );
  }
}

function getFreshCache() {
  if (!lastSuccessfulResponse) {
    return null;
  }

  const ageMs = Date.now() - lastSuccessfulResponse.fetchedAt;
  if (ageMs > CACHE_TTL_MS) {
    return null;
  }

  return lastSuccessfulResponse;
}

function withCacheMeta(
  payload: YoutubeLatestResponse,
  cacheMeta: YoutubeLatestResponse["meta"]["cache"]
): YoutubeLatestResponse {
  return {
    ...payload,
    meta: {
      ...payload.meta,
      cache: cacheMeta,
    },
  };
}

function buildPayload(
  videos: YoutubeVideo[],
  succeededCount: number,
  failedCount: number,
  errors?: Record<string, string>
): YoutubeLatestResponse {
  return {
    items: videos,
    meta: {
      fetchedAt: new Date().toISOString(),
      cache: { hit: false, ageMs: 0 },
      channels: {
        total: YOUTUBE_CHANNELS.length,
        succeeded: succeededCount,
        failed: failedCount,
      },
    },
    errors,
  };
}

function buildCacheHeaders() {
  return {
    headers: {
      "Cache-Control": `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${CACHE_TTL_SECONDS}`,
    },
  };
}
