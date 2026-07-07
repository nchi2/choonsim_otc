import { normalizeAddress } from "@/lib/viewer/address";
import { viewerError, viewerJson, viewerOptions } from "@/lib/viewer/cors";
import { fetchViewerBalances } from "@/lib/viewer/fetch-balances";

export const runtime = "nodejs";

export function OPTIONS() {
  return viewerOptions();
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return viewerError("INVALID_JSON", 400, "Request body must be JSON");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return viewerError("INVALID_BODY", 400);
  }

  const { address, tokenIds } = body as {
    address?: unknown;
    tokenIds?: unknown;
  };

  if (typeof address !== "string") {
    return viewerError("INVALID_ADDRESS", 400, "address is required");
  }

  const normalized = normalizeAddress(address);
  if (!normalized) {
    return viewerError("INVALID_ADDRESS", 400);
  }

  if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
    return viewerError("INVALID_TOKEN_IDS", 400, "tokenIds must be a non-empty array");
  }

  if (!tokenIds.every((id) => typeof id === "string" && id.length > 0)) {
    return viewerError("INVALID_TOKEN_IDS", 400);
  }

  const uniqueIds = [...new Set(tokenIds as string[])];
  const balances = await fetchViewerBalances(normalized, uniqueIds);

  return viewerJson({
    address: normalized,
    balances,
    updatedAt: new Date().toISOString(),
  });
}
