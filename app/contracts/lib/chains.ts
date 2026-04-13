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

/** `wallet_switchEthereumChain` / `wallet_addEthereumChain`용 (EIP-3085) */
export const ADD_ETHEREUM_CHAIN_PARAMS: Record<
  Network,
  {
    chainId: string;
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  }
> = {
  eth: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://ethereum.publicnode.com"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  base: {
    chainId: "0x2105",
    chainName: "Base",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
  },
  bsc: {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"],
  },
};

export function chainIdHex(network: Network): string {
  return `0x${CHAIN_IDS[network].toString(16)}`;
}

export function explorerAddressUrl(network: Network, address: string): string {
  return `${CHAIN_EXPLORER_ORIGIN[network]}/address/${address}`;
}
