import { normalizeWalletDesignLabel } from "@/lib/sbmb/normalizeParticipant";

export function getWalletRangeLabel(no: number) {
  return no <= 1000 ? "SBMB + 콘솔 NFT 수령용" : "보관 및 연습용";
}

/**
 * 동일 No라도 디자인이 다르면 별도 지갑으로 취급하기 위한 중복 제거 키.
 * 시트3 매칭 키와 동일하게 디자인명은 정규화합니다.
 */
export function walletDedupeKey(design: string | undefined, no: number): string {
  const raw = design?.trim() ?? "";
  const normalized = raw ? normalizeWalletDesignLabel(raw) : "";
  return `${normalized}_${no}`;
}
