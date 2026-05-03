/** 같은 키당 1분 윈도우 내 최대 허용 요청 수 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const buckets = new Map<string, number[]>();

export function rateLimitAllow(key: string): boolean {
  const now = Date.now();
  const prev = buckets.get(key) ?? [];
  const recent = prev.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    buckets.set(key, recent);
    return false;
  }

  recent.push(now);
  buckets.set(key, recent);
  return true;
}
