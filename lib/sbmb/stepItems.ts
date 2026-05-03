export function getStepItems(entryType: "신규참여" | "고액권전환") {
  if (entryType === "신규참여") {
    return ["수수료 납부", "EVM 지갑 수령", "에어드랍"];
  }
  return ["수수료 납부", "고액권 제출", "EVM 지갑 수령", "에어드랍"];
}

export function getStepStatuses(
  entryType: "신규참여" | "고액권전환",
  feeStatus: string,
  submitStatus: string | undefined,
  walletStatus: string,
  airdropStatus: string,
): string[] {
  if (entryType === "신규참여") {
    return [feeStatus, walletStatus, airdropStatus];
  }
  return [
    feeStatus,
    submitStatus ?? "대기 중",
    walletStatus,
    airdropStatus,
  ];
}
