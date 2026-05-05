/** 참여자 화면에 노출되는 서버 오류 문구 정제용 */

export const PARTICIPANT_DATA_LOAD_ERROR =
  "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";

function containsForbiddenBackendTerms(text: string): boolean {
  if (text.includes("구글") || text.includes("스프레드시트")) return true;
  const lower = text.toLowerCase();
  return lower.includes("google") || lower.includes("sheets");
}

/**
 * 구글/스프레드시트/Google/Sheets 등 백엔드 구현 노출을 피하기 위해,
 * 해당 단어가 포함된 메시지는 참여자용 일반 문구로 바꿉니다.
 */
export function sanitizeParticipantFacingError(message: string): string {
  const t = message.trim();
  if (!t) return PARTICIPANT_DATA_LOAD_ERROR;
  if (containsForbiddenBackendTerms(t)) {
    return PARTICIPANT_DATA_LOAD_ERROR;
  }
  return t;
}
