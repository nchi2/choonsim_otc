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

export async function addTokenToWallet(args: {
  address: string;
  symbol: string;
  decimals: number;
  image?: string;
}): Promise<boolean> {
  const ethereum = getEthereum();
  if (!ethereum) return false;
  try {
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
