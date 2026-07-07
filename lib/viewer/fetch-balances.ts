import type { Network } from "@/app/scanner/lib/tokens";
import { getCachedBalances, setCachedBalances } from "@/lib/viewer/balance-cache";
import {
  encodeBalanceOfCall,
  fetchBalancesViaMulticall,
  fetchNativeBalance,
  type MulticallItem,
} from "@/lib/viewer/multicall";
import { getViewerTokenById } from "@/lib/viewer/registry";

export async function fetchViewerBalances(
  address: string,
  tokenIds: string[],
): Promise<Record<string, string | "error">> {
  const cached = getCachedBalances(address, tokenIds);
  if (cached) return cached;

  const balances: Record<string, string | "error"> = {};
  const byChain = new Map<Network, MulticallItem[]>();
  const natives: { tokenId: string; chain: Network }[] = [];

  for (const id of tokenIds) {
    const token = getViewerTokenById(id);
    if (!token) {
      balances[id] = "error";
      continue;
    }
    if (token.type === "native") {
      natives.push({ tokenId: id, chain: token.chain });
      continue;
    }
    if (!token.address) {
      balances[id] = "error";
      continue;
    }
    const list = byChain.get(token.chain) ?? [];
    list.push({
      tokenId: id,
      target: token.address,
      callData: encodeBalanceOfCall(address),
    });
    byChain.set(token.chain, list);
  }

  await Promise.all([
    ...Array.from(byChain.entries()).map(async ([chain, items]) => {
      const chainBalances = await fetchBalancesViaMulticall(
        chain,
        address,
        items,
      );
      for (const [id, value] of chainBalances) {
        balances[id] = value;
      }
    }),
    ...natives.map(async ({ tokenId, chain }) => {
      balances[tokenId] = await fetchNativeBalance(chain, address);
    }),
  ]);

  for (const id of tokenIds) {
    if (!(id in balances)) balances[id] = "error";
  }

  setCachedBalances(address, tokenIds, balances);
  return balances;
}
