import {
  SCANNER_NETWORK_ORDER,
  SCANNER_SYMBOL_DISPLAY,
  type Network,
  type Token,
  getScannerErc20Tokens,
  scannerTokenOverviewLabel,
} from "@/app/scanner/lib/tokens";
import { scannerErc20Intro } from "@/app/scanner/lib/token-intros";

/** /contracts 페이지 ERC-20 카드 정렬 순서 */
export const CONTRACT_PAGE_SYMBOL_ORDER = [
  "WBMB",
  "SBMB",
  "MOVL",
  "LDT",
  "PRR",
  "MOVN",
] as const;

export interface ContractChainRow {
  network: Network;
  address: string;
  decimals: number;
}

export interface ContractTokenGroup {
  symbol: string;
  title: string;
  intro: string;
  chains: ContractChainRow[];
}

function displayTitleForSymbol(symbol: string, sampleLabel: string): string {
  const extra =
    symbol in SCANNER_SYMBOL_DISPLAY
      ? SCANNER_SYMBOL_DISPLAY[symbol as keyof typeof SCANNER_SYMBOL_DISPLAY]
      : undefined;
  if (extra) return extra;
  return scannerTokenOverviewLabel(sampleLabel);
}

function buildGroups(tokens: readonly Token[]): ContractTokenGroup[] {
  const bySymbol = new Map<string, Token[]>();
  for (const t of tokens) {
    if (t.tier === null) continue;
    const list = bySymbol.get(t.symbol) ?? [];
    list.push(t);
    bySymbol.set(t.symbol, list);
  }

  const out: ContractTokenGroup[] = [];
  for (const [symbol, list] of bySymbol) {
    const sorted = [...list].sort(
      (a, b) =>
        SCANNER_NETWORK_ORDER.indexOf(a.network) -
        SCANNER_NETWORK_ORDER.indexOf(b.network),
    );
    out.push({
      symbol,
      title: displayTitleForSymbol(symbol, sorted[0].label),
      intro: scannerErc20Intro[symbol] ?? "",
      chains: sorted.map((x) => ({
        network: x.network,
        address: x.address,
        decimals: x.decimals,
      })),
    });
  }

  const rank = (symbol: string): number => {
    const i = CONTRACT_PAGE_SYMBOL_ORDER.indexOf(
      symbol as (typeof CONTRACT_PAGE_SYMBOL_ORDER)[number],
    );
    return i === -1 ? 999 : i;
  };

  out.sort((a, b) => rank(a.symbol) - rank(b.symbol));

  return out;
}

export function getContractPageTokens(): readonly ContractTokenGroup[] {
  return buildGroups(getScannerErc20Tokens());
}
