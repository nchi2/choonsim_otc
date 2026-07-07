import type { Network } from "@/app/scanner/lib/tokens";
import { viewerRpcCall } from "./rpc";

export const MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as const;

const BALANCE_OF_SELECTOR = "0x70a08231";
const GET_ETH_BALANCE_SELECTOR = "0x4d2301cc";
const TRY_AGGREGATE_SELECTOR = "0xbce38bd7";

export interface MulticallItem {
  tokenId: string;
  target: string;
  callData: string;
}

function pad32(hex: string): string {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  return h.toLowerCase().padStart(64, "0");
}

function padAddressParam(addr: string): string {
  return pad32(addr.startsWith("0x") ? addr.slice(2) : addr);
}

export function encodeBalanceOfCall(wallet: string): string {
  return `${BALANCE_OF_SELECTOR}${padAddressParam(wallet)}`;
}

export function encodeGetEthBalanceCall(wallet: string): string {
  return `${GET_ETH_BALANCE_SELECTOR}${padAddressParam(wallet)}`;
}

function encodeBytesDynamic(hexData: string): string {
  const h = hexData.startsWith("0x") ? hexData.slice(2) : hexData;
  const byteLen = h.length / 2;
  const paddedLen = Math.ceil(byteLen / 32) * 32;
  const padded = h.padEnd(paddedLen * 2, "0");
  return pad32(byteLen.toString(16)) + padded;
}

/** (address target, bytes callData) 튜플 ABI 인코딩 */
function encodeCallTuple(target: string, callData: string): string {
  const addr = target.startsWith("0x") ? target : `0x${target}`;
  const head =
    pad32(addr.slice(2)) +
    pad32("40") + // offset to bytes within tuple
    encodeBytesDynamic(callData);
  return head;
}

/** Multicall3.tryAggregate(false, calls) */
function encodeTryAggregate(calls: { target: string; callData: string }[]): string {
  const n = calls.length;
  const encodedTuples = calls.map((c) => encodeCallTuple(c.target, c.callData));
  const tupleHeadSize = 32;
  const tupleOffsets: number[] = [];
  let cursor = 32 * (1 + n);
  for (const tuple of encodedTuples) {
    tupleOffsets.push(cursor / 32);
    cursor += tuple.length / 2;
  }

  let body = pad32(n.toString(16));
  for (const off of tupleOffsets) {
    body += pad32((off * 32).toString(16));
  }
  for (const tuple of encodedTuples) {
    body += tuple;
  }

  return (
    TRY_AGGREGATE_SELECTOR +
    pad32("0") + // requireSuccess = false
    pad32("40") + // offset to calls array
    body
  );
}

function hexToBigInt(hex: string): bigint {
  const t = hex.trim();
  if (t === "0x" || t === "") return BigInt(0);
  return BigInt(t);
}

/** tryAggregate Result[] 디코딩 → raw wei 문자열 또는 null */
function decodeTryAggregateResults(
  resultHex: string,
  count: number,
): (bigint | null)[] {
  const raw = resultHex.startsWith("0x") ? resultHex.slice(2) : resultHex;
  if (raw.length < 64) return Array.from({ length: count }, () => null);

  const arrayOffset = Number(hexToBigInt("0x" + raw.slice(0, 64))) * 2;
  const lenPos = arrayOffset;
  const n = Number(hexToBigInt("0x" + raw.slice(lenPos, lenPos + 64)));
  const out: (bigint | null)[] = [];

  for (let i = 0; i < n && i < count; i++) {
    const offWord = lenPos + 64 + i * 64;
    const elemOffset = Number(hexToBigInt("0x" + raw.slice(offWord, offWord + 64))) * 2;
    const abs = lenPos + elemOffset;
    const success = hexToBigInt("0x" + raw.slice(abs, abs + 64)) !== BigInt(0);
    const dataRel = Number(hexToBigInt("0x" + raw.slice(abs + 64, abs + 128))) * 2;
    const dataAbs = abs + dataRel;
    const dataLen = Number(hexToBigInt("0x" + raw.slice(dataAbs, dataAbs + 64)));
    if (!success || dataLen === 0) {
      out.push(null);
      continue;
    }
    const dataStart = dataAbs + 64;
    const word = raw.slice(dataStart, dataStart + 64);
    out.push(hexToBigInt("0x" + word));
  }

  while (out.length < count) out.push(null);
  return out;
}

export async function fetchBalancesViaMulticall(
  network: Network,
  wallet: string,
  items: MulticallItem[],
): Promise<Map<string, string | "error">> {
  const out = new Map<string, string | "error">();
  if (items.length === 0) return out;

  const calls = items.map((item) => ({
    target: item.target,
    callData: item.callData,
  }));

  const data = encodeTryAggregate(calls);
  let values: (bigint | null)[] | null = null;

  try {
    const result = await viewerRpcCall(network, "eth_call", [
      { to: MULTICALL3_ADDRESS, data },
      "latest",
    ]);
    if (typeof result === "string" && result.startsWith("0x")) {
      values = decodeTryAggregateResults(result, items.length);
    }
  } catch {
    values = null;
  }

  await Promise.all(
    items.map(async (item, i) => {
      const v = values?.[i] ?? null;
      if (v != null) {
        out.set(item.tokenId, v.toString());
        return;
      }
      out.set(item.tokenId, await fetchErc20BalanceDirect(
        network,
        item.target,
        item.callData,
      ));
    }),
  );

  return out;
}

async function fetchErc20BalanceDirect(
  network: Network,
  contract: string,
  callData: string,
): Promise<string | "error"> {
  try {
    const result = await viewerRpcCall(network, "eth_call", [
      { to: contract, data: callData },
      "latest",
    ]);
    if (typeof result !== "string" || !result.startsWith("0x")) return "error";
    return hexToBigInt(result).toString();
  } catch {
    return "error";
  }
}

export async function fetchNativeBalance(
  network: Network,
  wallet: string,
): Promise<string | "error"> {
  try {
    const result = await viewerRpcCall(network, "eth_getBalance", [
      wallet,
      "latest",
    ]);
    if (typeof result !== "string") return "error";
    return hexToBigInt(result).toString();
  } catch {
    return "error";
  }
}
