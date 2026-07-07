import type { Network } from "@/app/scanner/lib/tokens";
import registryJson from "./registry.json";

// TODO: 확정 registry.json으로 교체 (현재는 app/scanner/lib/tokens.ts에서 변환한 초안)

export type ViewerTokenType = "native" | "erc20" | "erc721";

export interface ViewerRegistryToken {
  id: string;
  symbol: string;
  name: string;
  chain: Network;
  chainId: number;
  type: "native" | "erc20";
  address: string | null;
  decimals: number;
  tier?: "ours" | "otaverse";
}

export interface ViewerRegistryNft {
  id: string;
  symbol: string;
  name: string;
  chain: Network;
  chainId: number;
  type: "erc721";
  address: string;
  tier: string;
}

export type ViewerBalanceAsset = ViewerRegistryToken | ViewerRegistryNft;

export interface ViewerRegistry {
  version: number;
  generatedFrom?: string;
  tokens: ViewerRegistryToken[];
  nfts: ViewerRegistryNft[];
}

const registry = registryJson as ViewerRegistry;

const tokenById = new Map<string, ViewerRegistryToken>(
  registry.tokens.map((t) => [t.id, t]),
);

const nftById = new Map<string, ViewerRegistryNft>(
  (registry.nfts ?? []).map((n) => [n.id, n]),
);

export function getViewerRegistry(): ViewerRegistry {
  return registry;
}

export function getViewerTokenById(id: string): ViewerRegistryToken | undefined {
  return tokenById.get(id);
}

export function getViewerNftById(id: string): ViewerRegistryNft | undefined {
  return nftById.get(id);
}

/** balance API — tokens + nfts 통합 조회 */
export function getViewerBalanceAssetById(
  id: string,
): ViewerBalanceAsset | undefined {
  return tokenById.get(id) ?? nftById.get(id);
}

export function getViewerTokenMap(): ReadonlyMap<string, ViewerRegistryToken> {
  return tokenById;
}
