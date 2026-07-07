const CACHE_TTL_MS = 15_000;

interface CacheEntry {
  expiresAt: number;
  balances: Record<string, string | "error">;
}

const store = new Map<string, CacheEntry>();

function cacheKey(address: string, tokenIds: string[]): string {
  const sorted = [...tokenIds].sort().join(",");
  return `${address.toLowerCase()}|${sorted}`;
}

export function getCachedBalances(
  address: string,
  tokenIds: string[],
): Record<string, string | "error"> | null {
  const key = cacheKey(address, tokenIds);
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.balances;
}

export function setCachedBalances(
  address: string,
  tokenIds: string[],
  balances: Record<string, string | "error">,
): void {
  const key = cacheKey(address, tokenIds);
  store.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    balances,
  });
}
