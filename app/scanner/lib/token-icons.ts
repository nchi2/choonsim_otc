import type { Token } from "./tokens";

/** 스캐너 행 아이콘 — SBMB/LDT는 프로젝트 로고, 네이티브는 체인 심볼 SVG */
export function tokenRowIconSrc(token: Token): string | null {
  if (token.symbol === "SBMB") return "/Logo_SBMB.svg";
  if (token.symbol === "LDT") return "/Logo_LDT.svg";
  if (token.type === "native") {
    if (token.network === "eth" || token.network === "base") {
      return "/logo/ethereum.svg";
    }
    if (token.network === "bsc") {
      return "/logo/bnb.svg";
    }
  }
  return null;
}

/** 임베드 이미지 안쪽 여백 보정 — LDT PNG가 viewBox 대비 여백이 큼 */
export function tokenRowIconScale(token: Token): number {
  if (token.symbol === "LDT") return 1.22;
  return 1;
}
