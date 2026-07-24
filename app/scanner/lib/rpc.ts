/** 스캐너 잔고 조회 — 체인당 JSON-RPC 배치 1회(왕복 최소화) + 배치 실패 시 개별 폴백.
 *  ★ 구조: scanChain(체인 1개, 진행표시·타임아웃 단위) → scanWallet(3체인 병렬 합본, 하위호환). */

import { RPC_ENDPOINTS, RPC_URLS } from "./rpc-config";
import {
  SCANNER_TOKENS,
  SCANNER_NETWORK_ORDER,
  type Network,
  type Token,
  type TokenResult,
} from "./tokens";
import {
  getNativeBalance,
  getTokenBalance,
  encodeBalanceOfData,
  hexResultToNumber,
  rpcBatch,
  type RpcBatchCall,
} from "./rpc-core";

export { RPC_ENDPOINTS, RPC_URLS };
export {
  getNativeBalance,
  getTokenBalance,
  normalizeWalletForRpc,
  rpcCall,
} from "./rpc-core";

function tokenKey(t: Token): string {
  return `${t.symbol}-${t.network}-${t.address}`;
}

/** 토큰 → 배치 call. 네이티브는 eth_getBalance, ERC20은 balanceOf eth_call. */
function toBatchCall(token: Token, wallet: string): RpcBatchCall {
  if (token.type === "native") {
    return { method: "eth_getBalance", params: [wallet, "latest"] };
  }
  return {
    method: "eth_call",
    params: [{ to: token.address, data: encodeBalanceOfData(wallet) }, "latest"],
  };
}

/** 개별 폴백(배치 실패·항목 누락 시) — 네이티브/ERC20 각각 직접 호출. */
async function fallbackOne(
  token: Token,
  wallet: string,
  signal?: AbortSignal,
): Promise<number> {
  try {
    if (token.type === "native") {
      return await getNativeBalance(token.network, wallet, signal);
    }
    return await getTokenBalance(
      token.network,
      token.address,
      wallet,
      token.decimals,
      signal,
    );
  } catch {
    return 0;
  }
}

/**
 * 한 체인의 모든 토큰 잔고 — JSON-RPC 배치 1회. 배치 자체 실패면 개별 폴백.
 * signal 로 취소/타임아웃 가능. 결과는 SCANNER_TOKENS 등록 순서(그 체인 부분).
 */
export async function scanChain(
  network: Network,
  wallet: string,
  signal?: AbortSignal,
): Promise<TokenResult[]> {
  const tokens = SCANNER_TOKENS.filter((t) => t.network === network);
  if (tokens.length === 0) return [];

  const calls = tokens.map((t) => toBatchCall(t, wallet));
  const results = await rpcBatch(network, calls, signal);

  // 배치 전체 실패(프록시/엔드포인트 다운·타임아웃 abort) → 예외로 신호.
  // 호출부(useScanner)가 abort 여부로 "timeout" vs "error"를 구분해 재시도 UI를 띄운다.
  // (개별 폴백은 같은 프록시·엔드포인트를 쓰므로 배치가 전부 실패하면 개별도 실패 → 폴백 무의미)
  if (results == null) {
    throw new Error("chain_scan_failed");
  }

  return Promise.all(
    tokens.map(async (token, i): Promise<TokenResult> => {
      const n = hexResultToNumber(results[i], token.decimals);
      if (n != null) return { ...token, balance: n };
      // 배치는 성공했으나 이 항목만 누락/이상 → 개별 재조회
      return { ...token, balance: await fallbackOne(token, wallet, signal) };
    }),
  );
}

/**
 * 전 체인 잔고(하위호환) — 3체인을 병렬 스캔해 SCANNER_TOKENS 순서로 합본.
 * ※ 이 함수는 "전부 완료"를 기다린다. 점진 표시가 필요한 화면은 scanChain을 체인별로 직접 쓴다.
 */
export async function scanWallet(walletAddress: string): Promise<TokenResult[]> {
  const perChain = await Promise.all(
    SCANNER_NETWORK_ORDER.map((net) =>
      scanChain(net, walletAddress).catch(() => [] as TokenResult[]),
    ),
  );
  const merged = new Map<string, TokenResult>();
  for (const list of perChain) {
    for (const r of list) merged.set(tokenKey(r), r);
  }
  return SCANNER_TOKENS.map(
    (t) => merged.get(tokenKey(t)) ?? ({ ...t, balance: 0 } as TokenResult),
  );
}
