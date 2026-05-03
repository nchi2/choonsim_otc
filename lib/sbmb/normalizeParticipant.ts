/** 성함 비교용: 공백 제거 · 소문자 통일 (영문) · NFC */
export function normalizeParticipantName(s: string): string {
  return s
    .normalize("NFC")
    .trim()
    .replace(/\p{White_Space}+/gu, "")
    .toLowerCase();
}

/** 연락처 비교용: 숫자만 */
export function normalizeParticipantPhoneDigits(s: string): string {
  return s.replace(/\D/g, "");
}

export function participantNamesMatch(a: string, b: string): boolean {
  return normalizeParticipantName(a) === normalizeParticipantName(b);
}

export function participantPhonesMatch(a: string, b: string): boolean {
  const da = normalizeParticipantPhoneDigits(a);
  const db = normalizeParticipantPhoneDigits(b);
  if (!da || !db) return false;
  return da === db;
}

/** 시트3 A열 디자인명 ↔ 참여 시트 디자인 비교용 (성함과 동일 규칙) */
export function normalizeWalletDesignLabel(s: string): string {
  return normalizeParticipantName(s);
}
