/**
 * 손님가 산정 공통 산식 — 퍼센트 마진 + 원화 절대액 하한.
 * 공개 miracle10 estimate API와 어드민 계산기가 공유한다.
 * env 접근 없음 — 클라이언트 컴포넌트에서도 import 가능.
 */

/** 마진 하한: 10모(개)당 30,000원. */
export const MARGIN_FLOOR_KRW_PER_10MO = 30_000;

/** 종이지갑 1장 단가 (USDT). */
export const PAPER_WALLET_UNIT_USDT = 20;

/** 종이지갑 1장이 커버하는 코인 수량 (10개 = 1장). */
export const MO_PER_PAPER_WALLET = 10;

/** 수량 기준 종이지갑 기본 장수 (기보유자는 운영자가 수동 조정). */
export function defaultPaperWalletCount(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return Math.ceil(quantity / MO_PER_PAPER_WALLET);
}

/** 종이지갑 가격(원) = 장수 × 20 USDT × 환율. */
export function paperWalletPriceKrw(count: number, usdtKrw: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  if (!Number.isFinite(usdtKrw) || usdtKrw <= 0) return 0;
  return Math.round(count * PAPER_WALLET_UNIT_USDT * usdtKrw);
}

/** 수량 기준 마진 하한(원) = (수량/10) × 30,000원. */
export function marginFloorKrw(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return (quantity / 10) * MARGIN_FLOOR_KRW_PER_10MO;
}

export interface CustomerEstimate {
  /** 1모당 손님가(원, 반올림) */
  perMoKrw: number;
  /** 총액(원) = perMoKrw × quantity */
  totalKrw: number;
  /** 실제 적용된 마진(원) = max(percentMarginKrw, floorKrw) */
  marginKrw: number;
  /** 퍼센트 마진 환산액(원) */
  percentMarginKrw: number;
  /** 절대액 하한(원) */
  floorKrw: number;
  /** 하한이 퍼센트 마진을 초과해 적용됐는지 */
  floorApplied: boolean;
}

/**
 * 손님 매수 견적: 원가 총액 + max(퍼센트 마진, 절대액 하한).
 * 마진율·마진액은 서버 전용 — 공개 API 응답에 그대로 노출하지 말 것.
 */
export function computeCustomerEstimate(params: {
  baseUsdt: number;
  usdtKrw: number;
  quantity: number;
  marginRate: number;
}): CustomerEstimate {
  const { baseUsdt, usdtKrw, quantity, marginRate } = params;
  const baseTotalKrw = baseUsdt * usdtKrw * quantity;
  const percentMarginKrw = baseTotalKrw * marginRate;
  const floorKrw = marginFloorKrw(quantity);
  const floorApplied = floorKrw > percentMarginKrw;
  const marginKrw = floorApplied ? floorKrw : percentMarginKrw;
  const perMoKrw = Math.round((baseTotalKrw + marginKrw) / quantity);
  return {
    perMoKrw,
    totalKrw: perMoKrw * quantity,
    marginKrw,
    percentMarginKrw,
    floorKrw,
    floorApplied,
  };
}
