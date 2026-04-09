import type { Network } from "./tokens";

/** 대표 URL(문서·응답 헤더용) */
export const RPC_ENDPOINTS = {
  eth: "https://ethereum.publicnode.com",
  base: "https://base.publicnode.com",
  bsc: "https://bsc-rpc.publicnode.com",
} as const;

export const RPC_URLS: Record<Network, readonly string[]> = {
  eth: [RPC_ENDPOINTS.eth],
  base: [RPC_ENDPOINTS.base],
  bsc: [
    "https://bsc-rpc.publicnode.com",
    "https://bsc.publicnode.com",
    "https://bsc-dataseed1.binance.org",
    "https://1rpc.io/bnb",
  ],
};
