import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 대상 페이지 메타데이터(apple-touch-icon / icon / og:image)에서 아이콘 URL 추출 */

type CacheEntry = { icon: string | null; at: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 1000 * 60 * 60 * 24; // 24h
const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_URLS = 40;
const CONCURRENCY = 6;

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) {
    return true;
  }
  if (h === "0.0.0.0" || h === "::1") return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

function absolutize(base: string, ref: string): string | null {
  try {
    return new URL(ref, base).toString();
  } catch {
    return null;
  }
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return m ? m[1] : null;
}

function extractIcon(html: string, baseUrl: string): string | null {
  const head = html.slice(0, MAX_HTML_BYTES);

  const linkTags = head.match(/<link\b[^>]*>/gi) ?? [];
  const iconLinks: { rel: string; href: string; size: number }[] = [];
  for (const tag of linkTags) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (!rel.includes("icon")) continue;
    const href = attr(tag, "href");
    if (!href) continue;
    const sizes = attr(tag, "sizes") ?? "";
    const size = Number.parseInt(sizes, 10);
    iconLinks.push({ rel, href, size: Number.isFinite(size) ? size : 0 });
  }

  // 1) apple-touch-icon (보통 정사각 앱 아이콘 — 로고로 가장 적합)
  const apple = iconLinks.find((l) => l.rel.includes("apple-touch-icon"));
  if (apple) return absolutize(baseUrl, apple.href);

  // 2) 가장 큰 rel="icon"
  const icons = iconLinks
    .filter((l) => l.rel.includes("icon"))
    .sort((a, b) => b.size - a.size);
  if (icons.length > 0) return absolutize(baseUrl, icons[0].href);

  // 3) og:image (배너일 수 있으나 메타데이터 폴백으로 사용)
  const metaTags = head.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const prop = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    if (prop === "og:image" || prop === "og:image:url" || prop === "twitter:image") {
      const content = attr(tag, "content");
      if (content) return absolutize(baseUrl, content);
    }
  }

  return null;
}

async function resolveIcon(rawUrl: string): Promise<string | null> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (isBlockedHost(u.hostname)) return null;

  const key = u.toString();
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.icon;

  let icon: string | null = null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(key, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ChoonsimEcosystemBot/1.0; +https://choonsim.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.includes("text/html")) {
      const html = (await res.text()).slice(0, MAX_HTML_BYTES);
      icon = extractIcon(html, res.url || key);
    }
  } catch {
    icon = null;
  } finally {
    clearTimeout(timer);
  }

  CACHE.set(key, { icon, at: Date.now() });
  return icon;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  poolSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next;
      next += 1;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  }
  const n = Math.max(1, Math.min(poolSize, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

export async function POST(request: Request) {
  let urls: string[] = [];
  try {
    const body = (await request.json()) as { urls?: unknown };
    if (Array.isArray(body.urls)) {
      urls = body.urls.filter((x): x is string => typeof x === "string");
    }
  } catch {
    return NextResponse.json({ results: {} });
  }

  const unique = Array.from(new Set(urls)).slice(0, MAX_URLS);
  const results: Record<string, string | null> = {};
  await mapWithConcurrency(unique, CONCURRENCY, async (url) => {
    results[url] = await resolveIcon(url);
  });

  return NextResponse.json({ results });
}
