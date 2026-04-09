/** RPC 호출 전용 — 브라우저에서는 동일 출처 `/api/scanner/rpc`로 우회(확장·CORS 이슈 완화) */

import { RPC_ENDPOINTS, RPC_URLS } from "./rpc-config";
import {
  SCANNER_TOKENS,
  type Network,
  type TokenResult,
} from "./tokens";

export { RPC_ENDPOINTS, RPC_URLS };

const BALANCE_OF_SELECTOR = "0x70a08231";

/** 검증만 수행; QR·입력의 EIP-55 대소문자 유지(노드는 일반적으로 동일 바이트로 처리) */
function normalizeWalletForRpc(walletAddress: string): string | null {
  const addr = walletAddress.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return null;
  return addr;
}

/** `eth_getBalance` hex → ETH/BNB 단위 */
function weiHexToEthNumber(hex: string): number {
  try {
    const h = hex.trim().toLowerCase();
    if (h === "0x" || h === "") return 0;
    const wei = BigInt(h);
    const scale = BigInt(10) ** BigInt(18);
    const whole = wei / scale;
    const frac = wei % scale;
    return Number(whole) + Number(frac) / 1e18;
  } catch {
    return 0;
  }
}

function padAddressParam(addr: string): string {
  const hex = addr.startsWith("0x") ? addr.slice(2) : addr;
  return hex.toLowerCase().padStart(64, "0");
}

function parseHexBalanceResult(result: unknown): number | null {
  if (typeof result !== "string") return null;
  const t = result.trim();
  if (!/^0x[0-9a-fA-F]*$/i.test(t)) return null;
  return weiHexToEthNumber(t);
}

export async function rpcCall(
  network: Network,
  method: string,
  params: unknown[],
): Promise<unknown | null> {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const res = await fetch("/api/scanner/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network, method, params }),
    });
    if (!res.ok) return null;
    const json: { result?: unknown; error?: string | null } = await res.json();
    if (json.error != null) return null;
    return json.result ?? null;
  } catch {
    return null;
  }
}

export async function getNativeBalance(
  network: Network,
  walletAddress: string,
): Promise<number> {
  const addr = normalizeWalletForRpc(walletAddress);
  if (!addr) return 0;
  const result = await rpcCall(network, "eth_getBalance", [addr, "latest"]);
  const n = parseHexBalanceResult(result);
  return n ?? 0;
}

export async function getTokenBalance(
  network: Network,
  contractAddress: string,
  walletAddress: string,
  decimals: number,
): Promise<number> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) return 0;
  const w = normalizeWalletForRpc(walletAddress);
  if (!w) return 0;
  const data = `${BALANCE_OF_SELECTOR}${padAddressParam(w)}`;
  const result = await rpcCall(network, "eth_call", [
    { to: contractAddress, data },
    "latest",
  ]);
  if (
    result === null ||
    result === undefined ||
    result === "0x" ||
    result === ""
  ) {
    return 0;
  }
  if (typeof result !== "string" || !/^0x[0-9a-fA-F]*$/i.test(result.trim())) {
    return 0;
  }
  try {
    const raw = BigInt(result.trim());
    return Number(raw) / 10 ** decimals;
  } catch {
    return 0;
  }
}

/** 네이티브 잔고(eth_getBalance)가 동시 다발 eth_call과 같은 출구 RPC에 몰릴 때 실패·0으로 떨어지는 것을 줄이기 위해 네이티브를 먼저 조회 */
async function mapWithPool<T, R>(
  items: readonly T[],
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

export async function scanWallet(walletAddress: string): Promise<TokenResult[]> {
  const natives = SCANNER_TOKENS.filter((t) => t.type === "native");
  const erc20s = SCANNER_TOKENS.filter((t) => t.type === "erc20");

  const nativeResults = await Promise.all(
    natives.map(async (token): Promise<TokenResult> => {
      try {
        const balance = await getNativeBalance(token.network, walletAddress);
        return { ...token, balance };
      } catch {
        return { ...token, balance: 0 };
      }
    }),
  );

  const erc20Results = await mapWithPool(erc20s, 6, async (token): Promise<TokenResult> => {
    try {
      const balance = await getTokenBalance(
        token.network,
        token.address,
        walletAddress,
        token.decimals,
      );
      return { ...token, balance };
    } catch {
      return { ...token, balance: 0 };
    }
  });

  const merged = new Map<string, TokenResult>();
  for (const r of nativeResults) {
    merged.set(`${r.symbol}-${r.network}-${r.address}`, r);
  }
  for (const r of erc20Results) {
    merged.set(`${r.symbol}-${r.network}-${r.address}`, r);
  }
  return SCANNER_TOKENS.map((t) => merged.get(`${t.symbol}-${t.network}-${t.address}`)!);
}
