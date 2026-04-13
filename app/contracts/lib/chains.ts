import type { Network } from "@/app/scanner/lib/tokens";

export const CHAIN_IDS: Record<Network, number> = {
  eth: 1,
  base: 8453,
  bsc: 56,
};

export const CHAIN_EXPLORER_ORIGIN: Record<Network, string> = {
  eth: "https://etherscan.io",
  base: "https://basescan.org",
  bsc: "https://bscscan.com",
};

export function explorerAddressUrl(network: Network, address: string): string {
  return `${CHAIN_EXPLORER_ORIGIN[network]}/address/${address}`;
}
