import type { Network } from "@/app/scanner/lib/tokens";
import { normalizeAddress } from "@/lib/viewer/address";
import { viewerError, viewerJson, viewerOptions } from "@/lib/viewer/cors";
import { fetchViewerTokenInfo } from "@/lib/viewer/fetch-token-info";

export const runtime = "nodejs";

const VALID_CHAINS = new Set<Network>(["eth", "base", "bsc"]);

function parseChain(value: string | null): Network | null {
  if (!value || !VALID_CHAINS.has(value as Network)) return null;
  return value as Network;
}

export function OPTIONS() {
  return viewerOptions();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const chain = parseChain(url.searchParams.get("chain"));
  const addressParam = url.searchParams.get("address");

  if (!chain) {
    return viewerError("INVALID_CHAIN", 400, "chain must be eth, base, or bsc");
  }

  if (!addressParam) {
    return viewerError("INVALID_ADDRESS", 400, "address is required");
  }

  const address = normalizeAddress(addressParam);
  if (!address) {
    return viewerError("INVALID_ADDRESS", 400);
  }

  const info = await fetchViewerTokenInfo(chain, address);
  if (!info) {
    return viewerError("INVALID_TOKEN_CONTRACT", 400);
  }

  return viewerJson(info, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
