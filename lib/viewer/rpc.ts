import { RPC_URLS } from "@/app/scanner/lib/rpc-config";
import type { Network } from "@/app/scanner/lib/tokens";

/** Viewer 전용 RPC 폴백 — 기본(스캐너와 동일 publicnode) 실패 시 공개 엔드포인트 재시도 */
export const VIEWER_RPC_FALLBACK: Record<Network, readonly string[]> = {
  eth: [
    "https://ethereum.publicnode.com",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com",
  ],
  base: [
    "https://base.publicnode.com",
    "https://mainnet.base.org",
    "https://1rpc.io/base",
  ],
  bsc: [
    "https://bsc-rpc.publicnode.com",
    "https://bsc-dataseed.bnbchain.org",
    "https://bsc-dataseed1.binance.org",
    "https://1rpc.io/bnb",
  ],
};

function uniqueUrls(network: Network): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [...RPC_URLS[network], ...VIEWER_RPC_FALLBACK[network]]) {
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

let rpcId = 0;

export async function viewerRpcCall(
  network: Network,
  method: string,
  params: unknown[],
): Promise<unknown> {
  const urls = uniqueUrls(network);
  let lastError: unknown = null;

  for (const url of urls) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25_000);
    try {
      rpcId += 1;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: rpcId,
          method,
          params,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) continue;
      const json: { result?: unknown; error?: unknown } = await res.json();
      if (json.error != null) {
        lastError = json.error;
        continue;
      }
      return json.result ?? null;
    } catch (e) {
      lastError = e;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error("RPC_UNAVAILABLE");
}
