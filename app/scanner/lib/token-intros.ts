/** /contracts·scanner UI용 토큰당 한 줄 소개 (SCANNER_TOKENS와 동기화) */

export const scannerErc20Intro: Readonly<Record<string, string>> = {
  SBMB: "고액권|콘솔 토큰",
  LDT: "SBMB 에어드랍 대비 연습용 토큰입니다. SBMB와 같은 컨트랙트로 발행되었습니다.",
  PRR: "대구 모빅회관 연습용 ERC-20 토큰입니다. 생태계 내 EVM 토큰입니다.",
  WBMB: "Wrapped BMB",
  MOVL: "생태계 MOVL 토큰입니다.",
  MOVN: "생태계 토큰입니다. (BNB Chain 배포 예정)",
};
