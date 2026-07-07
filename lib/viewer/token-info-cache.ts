import type { ViewerTokenInfo } from "@/lib/viewer/fetch-token-info";

const CACHE_TTL_MS = 5 * 60_000;

interface CacheEntry {
  expiresAt: number;
  info: ViewerTokenInfo;
}

const store = new Map<string, CacheEntry>();

function cacheKey(chain: string, address: string): string {
  return `${chain}|${address.toLowerCase()}`;
}

export function getCachedTokenInfo(
  chain: string,
  address: string,
): ViewerTokenInfo | null {
  const key = cacheKey(chain, address);
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.info;
}

export function setCachedTokenInfo(
  chain: string,
  address: string,
  info: ViewerTokenInfo,
): void {
  store.set(cacheKey(chain, address), {
    expiresAt: Date.now() + CACHE_TTL_MS,
    info,
  });
}
