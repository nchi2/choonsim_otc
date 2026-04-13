import type { Network } from "@/app/scanner/lib/tokens";
import {
  ADD_ETHEREUM_CHAIN_PARAMS,
  chainIdHex,
} from "@/app/contracts/lib/chains";

type EthereumRequester = {
  request(args: {
    method: string;
    params?: Record<string, unknown> | unknown[];
  }): Promise<unknown>;
};

function getEthereum(): EthereumRequester | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: EthereumRequester }).ethereum;
}

export function isWalletBrowser(): boolean {
  return typeof window !== "undefined" && !!getEthereum();
}

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

/** Trust Wallet universal link — opens this URL in the in-app browser */
export function openCurrentPageInTrustWallet(): void {
  if (typeof window === "undefined") return;
  const url = encodeURIComponent(window.location.href);
  window.location.href = `https://link.trustwallet.com/open_url?url=${url}`;
}

/** MetaMask mobile — opens this page in the in-app browser */
export function openCurrentPageInMetaMask(): void {
  if (typeof window === "undefined") return;
  const u = encodeURIComponent(window.location.href);
  window.location.href = `https://metamask.app.link/dapp/${u}`;
}

const CHAIN_NOT_ADDED_CODE = 4902;

async function ensureCorrectChain(
  ethereum: EthereumRequester,
  network: Network,
): Promise<void> {
  const targetHex = chainIdHex(network);
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetHex }],
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === CHAIN_NOT_ADDED_CODE) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [ADD_ETHEREUM_CHAIN_PARAMS[network]],
      });
      return;
    }
    throw err;
  }
}

export async function addTokenToWallet(args: {
  address: string;
  symbol: string;
  decimals: number;
  network: Network;
  image?: string;
}): Promise<boolean> {
  const ethereum = getEthereum();

  if (!ethereum) {
    if (isMobileUserAgent()) {
      openCurrentPageInTrustWallet();
    }
    return false;
  }

  try {
    await ensureCorrectChain(ethereum, args.network);
    const ok = await ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: args.address,
          symbol: args.symbol,
          decimals: args.decimals,
          ...(args.image ? { image: args.image } : {}),
        },
      },
    });
    return ok === true;
  } catch {
    return false;
  }
}
