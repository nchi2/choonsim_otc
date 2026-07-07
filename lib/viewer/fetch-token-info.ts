import type { Network } from "@/app/scanner/lib/tokens";
import {
  getCachedTokenInfo,
  setCachedTokenInfo,
} from "@/lib/viewer/token-info-cache";
import { viewerRpcCall } from "@/lib/viewer/rpc";

const NAME_SELECTOR = "0x06fdde03";
const SYMBOL_SELECTOR = "0x95d89b41";
const DECIMALS_SELECTOR = "0x313ce567";

export interface ViewerTokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

function hexToBigInt(hex: string): bigint {
  const t = hex.trim();
  if (t === "0x" || t === "") return BigInt(0);
  return BigInt(t);
}

function decodeUtf8Hex(hex: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  if (end === 0) return "";
  return new TextDecoder("utf-8", { fatal: false }).decode(
    new Uint8Array(bytes.slice(0, end)),
  );
}

/** ABI string 또는 bytes32 고정 문자열 디코딩 */
function decodeAbiString(resultHex: string): string | null {
  const raw = resultHex.startsWith("0x") ? resultHex.slice(2) : resultHex;
  if (raw.length < 64) return null;

  const offset = Number(hexToBigInt("0x" + raw.slice(0, 64)));
  if (offset === 32 && raw.length >= 128) {
    const len = Number(hexToBigInt("0x" + raw.slice(64, 128)));
    const dataStart = 128;
    const dataEnd = dataStart + len * 2;
    if (dataEnd > raw.length) return null;
    return decodeUtf8Hex(raw.slice(dataStart, dataEnd));
  }

  const bytes: number[] = [];
  for (let i = 0; i < 64; i += 2) {
    bytes.push(parseInt(raw.slice(i, i + 2), 16));
  }
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  if (end === 0) return "";
  return new TextDecoder("utf-8", { fatal: false }).decode(
    new Uint8Array(bytes.slice(0, end)),
  );
}

function decodeDecimals(resultHex: string): number | null {
  const raw = resultHex.startsWith("0x") ? resultHex.slice(2) : resultHex;
  if (raw.length < 64) return null;
  const v = Number(hexToBigInt("0x" + raw.slice(0, 64)));
  if (!Number.isFinite(v) || v < 0 || v > 255) return null;
  return v;
}

async function erc20Call(
  network: Network,
  contract: string,
  selector: string,
): Promise<string | null> {
  try {
    const result = await viewerRpcCall(network, "eth_call", [
      { to: contract, data: selector },
      "latest",
    ]);
    if (typeof result !== "string" || !result.startsWith("0x") || result === "0x") {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

async function fetchTokenInfoUncached(
  network: Network,
  contract: string,
): Promise<ViewerTokenInfo | null> {
  const [nameHex, symbolHex, decimalsHex] = await Promise.all([
    erc20Call(network, contract, NAME_SELECTOR),
    erc20Call(network, contract, SYMBOL_SELECTOR),
    erc20Call(network, contract, DECIMALS_SELECTOR),
  ]);

  if (!nameHex || !symbolHex || !decimalsHex) return null;

  const name = decodeAbiString(nameHex);
  const symbol = decodeAbiString(symbolHex);
  const decimals = decodeDecimals(decimalsHex);

  if (name == null || symbol == null || decimals == null) return null;

  return { name, symbol, decimals };
}

export async function fetchViewerTokenInfo(
  network: Network,
  contract: string,
): Promise<ViewerTokenInfo | null> {
  const cached = getCachedTokenInfo(network, contract);
  if (cached) return cached;

  const info = await fetchTokenInfoUncached(network, contract);
  if (info) setCachedTokenInfo(network, contract, info);
  return info;
}
