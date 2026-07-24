/** RPC 저수준 호출 — 브라우저에서 동일 출처 `/api/scanner/rpc` 프록시 경유(확장·CORS 완화).
 *  멀티콜(multicall.ts)과 개별 폴백(rpc.ts)이 공유하는 코어. */

import type { Network } from "./tokens";

const BALANCE_OF_SELECTOR = "0x70a08231";

/** 검증만 수행; QR·입력의 EIP-55 대소문자 유지(노드는 일반적으로 동일 바이트로 처리) */
export function normalizeWalletForRpc(walletAddress: string): string | null {
  const addr = walletAddress.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return null;
  return addr;
}

/** `eth_getBalance`/토큰 hex → 사람이 읽는 소수 단위 수치 */
export function rawHexToNumber(hex: string, decimals: number): number {
  try {
    const h = hex.trim().toLowerCase();
    if (h === "0x" || h === "") return 0;
    const raw = BigInt(h);
    const scale = BigInt(10) ** BigInt(decimals);
    const whole = raw / scale;
    const frac = raw % scale;
    return Number(whole) + Number(frac) / Number(scale);
  } catch {
    return 0;
  }
}

/** bigint raw → 소수 단위 (멀티콜 결과 변환용) */
export function rawBigIntToNumber(raw: bigint, decimals: number): number {
  const scale = BigInt(10) ** BigInt(decimals);
  const whole = raw / scale;
  const frac = raw % scale;
  return Number(whole) + Number(frac) / Number(scale);
}

export function padAddressParam(addr: string): string {
  const hex = addr.startsWith("0x") ? addr.slice(2) : addr;
  return hex.toLowerCase().padStart(64, "0");
}

export function encodeBalanceOfData(wallet: string): string {
  return `${BALANCE_OF_SELECTOR}${padAddressParam(wallet)}`;
}

function parseHexBalanceResult(result: unknown, decimals: number): number | null {
  if (typeof result !== "string") return null;
  const t = result.trim();
  if (!/^0x[0-9a-fA-F]*$/i.test(t)) return null;
  return rawHexToNumber(t, decimals);
}

/** 프록시 1회 호출. signal 로 클라이언트측 취소/타임아웃 지원. */
export async function rpcCall(
  network: Network,
  method: string,
  params: unknown[],
  signal?: AbortSignal,
): Promise<unknown | null> {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const res = await fetch("/api/scanner/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network, method, params }),
      signal,
    });
    if (!res.ok) return null;
    const json: { result?: unknown; error?: string | null } = await res.json();
    if (json.error != null) return null;
    return json.result ?? null;
  } catch {
    return null;
  }
}

export interface RpcBatchCall {
  method: "eth_getBalance" | "eth_call";
  params: unknown[];
}

/**
 * 체인당 왕복 1회 — 여러 call을 JSON-RPC 배치로 묶어 프록시에 한 번에 보낸다.
 * 반환은 요청 순서대로 정렬된 hex 결과 배열(실패 항목은 null). 배치 자체 실패면 null.
 */
export async function rpcBatch(
  network: Network,
  calls: RpcBatchCall[],
  signal?: AbortSignal,
): Promise<(unknown | null)[] | null> {
  if (typeof window === "undefined") return null;
  if (calls.length === 0) return [];
  try {
    const res = await fetch("/api/scanner/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network, calls }),
      signal,
    });
    if (!res.ok) return null;
    const json: { results?: unknown; error?: unknown } = await res.json();
    if (json.error != null || !Array.isArray(json.results)) return null;
    return json.results;
  } catch {
    return null;
  }
}

/** hex 결과(문자열) → 소수 단위. 유효하지 않으면 null. */
export function hexResultToNumber(result: unknown, decimals: number): number | null {
  if (typeof result !== "string") return null;
  const t = result.trim();
  if (t === "0x" || t === "") return 0;
  if (!/^0x[0-9a-fA-F]*$/i.test(t)) return null;
  return rawHexToNumber(t, decimals);
}

/** 개별 네이티브 잔고 조회(배치 실패 시 폴백) */
export async function getNativeBalance(
  network: Network,
  walletAddress: string,
  signal?: AbortSignal,
): Promise<number> {
  const addr = normalizeWalletForRpc(walletAddress);
  if (!addr) return 0;
  const result = await rpcCall(network, "eth_getBalance", [addr, "latest"], signal);
  const n = parseHexBalanceResult(result, 18);
  return n ?? 0;
}

/** 개별 ERC-20 잔고 조회(멀티콜 실패 시 폴백) */
export async function getTokenBalance(
  network: Network,
  contractAddress: string,
  walletAddress: string,
  decimals: number,
  signal?: AbortSignal,
): Promise<number> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) return 0;
  const w = normalizeWalletForRpc(walletAddress);
  if (!w) return 0;
  const data = encodeBalanceOfData(w);
  const result = await rpcCall(
    network,
    "eth_call",
    [{ to: contractAddress, data }, "latest"],
    signal,
  );
  if (result == null || result === "0x" || result === "") return 0;
  if (typeof result !== "string" || !/^0x[0-9a-fA-F]*$/i.test(result.trim())) {
    return 0;
  }
  return rawHexToNumber(result.trim(), decimals);
}
