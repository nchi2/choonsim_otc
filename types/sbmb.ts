export type SbmbLookupSource = "new" | "convert";

/** lookup 성공 시 어느 시트에 해당 참여자가 있는지 (둘 다일 수 있음) */
export type SbmbLookupOk = {
  found: true;
  sources: SbmbLookupSource[];
};

export type SbmbLookupResponse = SbmbLookupOk | { found: false };

/** 시트3 O(LDT), Q(PRR), R(SBMB) → 숫자 (없으면 0) */
export type SbmbVerifyWalletTokens = {
  LDT: number;
  PRR: number;
  SBMB: number;
};

export type SbmbVerifyWallet = {
  no: number;
  type: "main" | "service";
  design?: string;
  /** 고액권 전환 시트2 C열 단위 — 에어드랍 지갑(no≤1000) 메인만. 그 외 null */
  unit?: string | null;
  tokens: SbmbVerifyWalletTokens;
  /** 시트3에서 디자인(A)+No(C) 일치 행의 E열 공개주소 (본인 지갑만) */
  address: string;
};

export type SbmbVerifyEntry = {
  entryType: "신규참여" | "고액권전환";
  unit: string;
  wallets: SbmbVerifyWallet[];
  feeStatus: string;
  walletStatus: string;
  airdropStatus: string;
  submitStatus?: string;
  memo?: string;
};

export type SbmbVerifyOk = {
  found: true;
  name: string;
  entries: SbmbVerifyEntry[];
};

export type SbmbVerifyResponse = SbmbVerifyOk | { found: false };

export type SbmbRoadmapItem = { label: string; status: string };

export type SbmbNoticeListItem = {
  date: string;
  important: boolean;
  title: string;
  summary: string;
  slug: string;
};

export type SbmbNoticeDetail = {
  date: string;
  important: boolean;
  title: string;
  body: string;
  link: string;
};
