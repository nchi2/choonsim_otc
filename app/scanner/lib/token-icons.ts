import type { Token } from "./tokens";

/** 스캐너 행 아이콘 — SBMB/LDT는 프로젝트 로고, 네이티브는 체인 심볼 SVG */
export function tokenRowIconSrc(token: Token): string | null {
  if (token.symbol === "SBMB") return "/Logo_SBMB.svg";
  if (token.symbol === "LDT") return "/Logo_LDT.svg";
  if (token.symbol === "USDT") return "/coin-icons/usdt.svg";
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

/**
 * LDT STAKE NFT 티어 썸네일. public/nft/thumb/ 의 128px 경량본을 사용한다
 * (원본 2048px PNG는 뱃지 표시에 과해 로딩 실패→폴백을 유발했음).
 * 파일이 없으면 컴포넌트에서 티어 숫자 이니셜로 폴백한다(IPFS 직접 로드 금지).
 */
export function nftTierImageSrc(tier: string): string {
  return `/nft/thumb/${tier}_LDT_STAKE_NFT.png`;
}
