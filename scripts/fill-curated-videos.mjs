#!/usr/bin/env node
/**
 * 큐레이션 영상 메타 추출용 1회용 스크립트.
 *
 * 사용:
 *   node scripts/fill-curated-videos.mjs <category> <url1> [<url2> ...]
 *   예) node scripts/fill-curated-videos.mjs sbmb \
 *       https://www.youtube.com/watch?v=abcd1234567 \
 *       https://youtu.be/efgh1234567
 *
 * 결과: stdout에 `CURATED.<category>`에 그대로 붙여넣을 수 있는 JSON5-ish
 * 객체 배열을 출력. oEmbed로 title/channelTitle을 받아오며,
 * 런타임 코드에서는 호출하지 않는다(이 결과를 lib/youtube/curated-videos.ts에 정적 저장).
 *
 * 의존성 없음(node 18+ 글로벌 fetch 사용).
 */

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function parseVideoId(input) {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return null;
  if (VIDEO_ID_RE.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return VIDEO_ID_RE.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && VIDEO_ID_RE.test(v)) return v;
      const m = u.pathname.match(
        /^\/(?:shorts|live|embed)\/([a-zA-Z0-9_-]{11})/,
      );
      if (m) return m[1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

async function fetchOEmbed(videoId) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`,
  )}&format=json`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.7",
    },
  });
  if (!res.ok) {
    throw new Error(`oembed HTTP ${res.status}`);
  }
  return res.json();
}

async function main() {
  const [, , category, ...urls] = process.argv;
  if (!category || urls.length === 0) {
    console.error(
      "Usage: node scripts/fill-curated-videos.mjs <category> <url> [<url> ...]",
    );
    process.exit(1);
  }

  const results = [];
  for (const raw of urls) {
    const videoId = parseVideoId(raw);
    if (!videoId) {
      console.error(`[skip] Could not parse videoId from: ${raw}`);
      continue;
    }
    try {
      const meta = await fetchOEmbed(videoId);
      results.push({
        videoId,
        title: typeof meta.title === "string" ? meta.title : "",
        channelTitle:
          typeof meta.author_name === "string" ? meta.author_name : undefined,
      });
    } catch (e) {
      console.error(
        `[error] ${videoId} failed: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  console.log(`// paste into CURATED.${category} in lib/youtube/curated-videos.ts`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
