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
  type: ViewerTokenType;
  address: string | null;
  decimals: number;
  tier?: "ours" | "otaverse";
  nftTier?: string;
}

export interface ViewerRegistry {
  version: number;
  generatedFrom?: string;
  tokens: ViewerRegistryToken[];
}

const registry = registryJson as ViewerRegistry;

const byId = new Map<string, ViewerRegistryToken>(
  registry.tokens.map((t) => [t.id, t]),
);

export function getViewerRegistry(): ViewerRegistry {
  return registry;
}

export function getViewerTokenById(id: string): ViewerRegistryToken | undefined {
  return byId.get(id);
}

export function getViewerTokenMap(): ReadonlyMap<string, ViewerRegistryToken> {
  return byId;
}
