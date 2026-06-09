/** 토큰 레지스트리 — STEP 1.2.2에서 토큰 배열, STEP 2에서 조회 연동 */

export type Network = "eth" | "base" | "bsc";

/** UI·문서용 체인 표시 순서 */
export const SCANNER_NETWORK_ORDER: readonly Network[] = ["eth", "base", "bsc"];

export const SCANNER_NETWORK_LABEL: Record<Network, string> = {
  eth: "Ethereum",
  base: "Base",
  bsc: "BNB Chain",
};

/** 조회 가능 토큰 목록 — 열 제목이 체인이므로 라벨 끝의 `(Base)` 등 제거 */
export function scannerTokenOverviewLabel(label: string): string {
  return label
    .replace(/ \(BNB Chain\)$/, "")
    .replace(/ \(Ethereum\)$/, "")
    .replace(/ \(Base\)$/, "");
}

/** TokenRow 등 — 심볼 옆 전체 표기 */
export const SCANNER_SYMBOL_DISPLAY: Readonly<Partial<Record<string, string>>> =
  {
    LDT: "LDT (Lucem Diffundo Token)",
    WBMB: "WBMB (Wrapped BMB)",
  };

export type TokenType = "native" | "erc20";

/** balanceOf 동일 시그니처라 RPC는 type:"erc20"로 재사용하되, 표시 구분용 */
export type TokenKind = "erc20" | "erc721";

export type Tier = "ours" | "otaverse";

/** LDT STAKE NFT 5개 티어를 한 행으로 묶는 그룹 키 */
export const LDT_STAKE_NFT_GROUP = "ldt-stake-nft" as const;

export interface Token {
  symbol: string;
  network: Network;
  type: TokenType;
  /** ERC-20: 컨트랙트 주소. 네이티브: STEP 1.2.2에서 관례값(placeholder 등)으로 채움 */
  address: string;
  decimals: number;
  /** ours / otaverse. 네이티브처럼 티어가 없으면 `null` */
  tier: Tier | null;
  label: string;
  /** UI용. 예: `globals.css`의 CSS 변수명 */
  colorVar: string;
  /** 토큰 표준 구분. 없으면 erc20으로 취급 */
  kind?: TokenKind;
  /** 같은 행으로 묶을 그룹 키 (예: LDT STAKE NFT 티어 묶음) */
  group?: string;
  /** 그룹 내 NFT 티어 라벨 (예: "10", "1000"). 기존 `tier`(ours/otaverse)와 별개 */
  nftTier?: string;
}

export interface TokenResult extends Token {
  balance: number;
}

/** 네이티브 잔고 조회용 주소 필드 자리 (컨트랙트 없음). RPC 단계에서 `type === 'native'`일 때 무시 */
export const NATIVE_PLACEHOLDER_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

/** Go-Live 전 ERC-20 컨트랙트 주소 — 임의로 채우지 말 것 (RULE-6) */
export const ERC20_ADDRESS_PLACEHOLDER = "0x__________" as const;

export const SCANNER_TOKENS: readonly Token[] = [
  {
    symbol: "ETH",
    network: "eth",
    type: "native",
    address: NATIVE_PLACEHOLDER_ADDRESS,
    decimals: 18,
    tier: null,
    label: "ETH (Ethereum)",
    colorVar: "--scanner-native-eth",
  },
  {
    symbol: "ETH",
    network: "base",
    type: "native",
    address: NATIVE_PLACEHOLDER_ADDRESS,
    decimals: 18,
    tier: null,
    label: "ETH (Base)",
    colorVar: "--scanner-native-base",
  },
  {
    symbol: "BNB",
    network: "bsc",
    type: "native",
    address: NATIVE_PLACEHOLDER_ADDRESS,
    decimals: 18,
    tier: null,
    label: "BNB (BNB Chain)",
    colorVar: "--scanner-native-bsc",
  },
  {
    symbol: "SBMB",
    network: "eth",
    type: "erc20",
    address: "0xc90990Db321F5806587bF496a3652c19aB223b94",
    decimals: 18,
    tier: "ours",
    label: "SBMB (Ethereum)",
    colorVar: "--scanner-tier-ours",
  },
  {
    symbol: "SBMB",
    network: "base",
    type: "erc20",
    address: "0xc90990Db321F5806587bF496a3652c19aB223b94",
    decimals: 18,
    tier: "ours",
    label: "SBMB (Base)",
    colorVar: "--scanner-tier-ours",
  },
  {
    symbol: "SBMB",
    network: "bsc",
    type: "erc20",
    address: "0xc90990Db321F5806587bF496a3652c19aB223b94",
    decimals: 18,
    tier: "ours",
    label: "SBMB (BNB Chain)",
    colorVar: "--scanner-tier-ours",
  },
  {
    symbol: "LDT",
    network: "eth",
    type: "erc20",
    address: "0xD437aB2F890A119c654B67B3d392e204087A3696",
    decimals: 18,
    tier: "ours",
    label: "LDT (Lucem Diffundo Token) (Ethereum)",
    colorVar: "--scanner-tier-ours",
  },
  {
    symbol: "LDT",
    network: "base",
    type: "erc20",
    address: "0x504B262539d3A4194d0649f69Fe3cCA06D5bB24a",
    decimals: 18,
    tier: "ours",
    label: "LDT (Lucem Diffundo Token) (Base)",
    colorVar: "--scanner-tier-ours",
  },
  {
    symbol: "WBMB",
    network: "base",
    type: "erc20",
    address: "0x71E7CBD674762F95D4D685138749feC3665c8225",
    decimals: 8,
    tier: "otaverse",
    label: "WBMB (Wrapped BMB) (Base)",
    colorVar: "--scanner-tier-otaverse",
  },
  {
    symbol: "LDT",
    network: "bsc",
    type: "erc20",
    address: "0x504B262539d3A4194d0649f69Fe3cCA06D5bB24a",
    decimals: 18,
    tier: "ours",
    label: "LDT (Lucem Diffundo Token) (BNB Chain)",
    colorVar: "--scanner-tier-ours",
  },
  {
    symbol: "MOVL",
    network: "base",
    type: "erc20",
    address: "0x6c3b923561B9e3b19D06cB02537Cc0FD5F1af6d4",
    decimals: 18,
    tier: "otaverse",
    label: "MOVL (Base)",
    colorVar: "--scanner-tier-otaverse",
  },

  {
    symbol: "PRR",
    network: "base",
    type: "erc20",
    address: "0x7d29E2274212426Ae964cE354F9A5FC9b74BA2d1",
    decimals: 18,
    tier: "ours",
    label: "PRR (Base)",
    colorVar: "--scanner-tier-ours",
  },

  {
    symbol: "WBMB",
    network: "bsc",
    type: "erc20",
    address: "0x9E4c611B834672c3643D9818249366bf65ae4C86",
    decimals: 8,
    tier: "otaverse",
    label: "WBMB (Wrapped BMB) (BNB Chain)",
    colorVar: "--scanner-tier-otaverse",
  },

  {
    symbol: "MOVN",
    network: "bsc",
    type: "erc20",
    address: "0x200b63AA750c901892d4DCf82439860F9C270274",
    decimals: 18,
    tier: "otaverse",
    label: "MOVN (BNB Chain)",
    colorVar: "--scanner-tier-otaverse",
  },

  {
    symbol: "USDT",
    network: "eth",
    type: "erc20",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    tier: null,
    label: "USDT (Tether) (Ethereum)",
    colorVar: "--scanner-tier-otaverse",
  },

  {
    symbol: "USDT",
    network: "bsc",
    type: "erc20",
    address: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    tier: null,
    label: "USDT (Tether) (BNB Chain)",
    colorVar: "--scanner-tier-otaverse",
  },

  {
    symbol: "LDTSTAKE",
    network: "base",
    type: "erc20",
    kind: "erc721",
    group: LDT_STAKE_NFT_GROUP,
    nftTier: "10",
    address: "0x4988c1d9FF849A7f7A5700A423273b7807f8EDBa",
    decimals: 0,
    tier: null,
    label: "LDT STAKE NFT 10 (Base)",
    colorVar: "--scanner-native-base",
  },
  {
    symbol: "LDTSTAKE",
    network: "base",
    type: "erc20",
    kind: "erc721",
    group: LDT_STAKE_NFT_GROUP,
    nftTier: "50",
    address: "0xb27E75b2a671f9ed8E484213e45d53eD2FA7cc33",
    decimals: 0,
    tier: null,
    label: "LDT STAKE NFT 50 (Base)",
    colorVar: "--scanner-native-base",
  },
  {
    symbol: "LDTSTAKE",
    network: "base",
    type: "erc20",
    kind: "erc721",
    group: LDT_STAKE_NFT_GROUP,
    nftTier: "100",
    address: "0x3e7082ac9579e008087f712587031aeef82fAbB3",
    decimals: 0,
    tier: null,
    label: "LDT STAKE NFT 100 (Base)",
    colorVar: "--scanner-native-base",
  },
  {
    symbol: "LDTSTAKE",
    network: "base",
    type: "erc20",
    kind: "erc721",
    group: LDT_STAKE_NFT_GROUP,
    nftTier: "200",
    address: "0x0B1797d9f7147a1387D40043c77c695191683b9C",
    decimals: 0,
    tier: null,
    label: "LDT STAKE NFT 200 (Base)",
    colorVar: "--scanner-native-base",
  },
  {
    symbol: "LDTSTAKE",
    network: "base",
    type: "erc20",
    kind: "erc721",
    group: LDT_STAKE_NFT_GROUP,
    nftTier: "1000",
    address: "0x68F1C5D3eA3b20c226e35158f1c0d8F46613B717",
    decimals: 0,
    tier: null,
    label: "LDT STAKE NFT 1000 (Base)",
    colorVar: "--scanner-native-base",
  },
];

/** LDT STAKE NFT 그룹 토큰 여부 */
export function isLdtStakeNft(token: Token): boolean {
  return token.group === LDT_STAKE_NFT_GROUP;
}

/** ERC-20만 — 스커너 컨트랙트 참조·/contracts 등 공통 사용 */
export function getScannerErc20Tokens(): readonly Token[] {
  return SCANNER_TOKENS.filter((t) => t.type === "erc20");
}
