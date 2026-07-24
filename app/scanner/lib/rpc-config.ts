import type { Network } from "./tokens";

/** 대표 URL(문서·응답 헤더용) */
export const RPC_ENDPOINTS = {
  eth: "https://ethereum.publicnode.com",
  base: "https://base.publicnode.com",
  bsc: "https://bsc-dataseed1.binance.org",
} as const;

/** 체인별 RPC 후보 — 프록시(app/api/scanner/rpc)가 앞에서부터 시도, 실패 시 다음으로 폴백.
 *  ★ 순서 = 우선순위. 느린(성공하지만 3~4초 걸리는) 엔드포인트는 뒤로 미뤄야 한다
 *    — 프록시는 "실패"에만 폴백하므로, 느린-성공 응답은 폴백을 못 부르고 그대로 총 시간을 잡아먹는다.
 *  실측(2026-07): bsc-rpc.publicnode.com·bsc.publicnode.com 은 상습적으로 3.4~3.6초 + 잦은 실패,
 *    반면 Binance 공식 dataseed(bsc-dataseed*.binance.org / bnbchain.org)는 ~45ms로 빠르고 안정적. */
export const RPC_URLS: Record<Network, readonly string[]> = {
  eth: ["https://ethereum.publicnode.com"],
  base: [
    "https://base.publicnode.com",
    "https://base-rpc.publicnode.com",
    "https://mainnet.base.org",
  ],
  bsc: [
    // 빠르고 안정적인 Binance 공식 dataseed 우선
    "https://bsc-dataseed1.binance.org",
    "https://bsc-dataseed2.binance.org",
    "https://bsc-dataseed.bnbchain.org",
    // 느리고 불안정 — 최후 폴백으로만
    "https://bsc-rpc.publicnode.com",
    "https://1rpc.io/bnb",
  ],
};
