/** 국가번호를 뺀 로컬 번호 최대 길이 (표시·입력 상한) */
export const SBMB_PHONE_MAX_DIGITS = 15;

export function extractPhoneDigits(input: string): string {
  return input.replace(/\D/g, "").slice(0, SBMB_PHONE_MAX_DIGITS);
}

function dashChunks(s: string, chunk: number): string {
  const parts: string[] = [];
  for (let i = 0; i < s.length; i += chunk) {
    parts.push(s.slice(i, i + chunk));
  }
  return parts.join("-");
}

/**
 * 숫자만 기준으로 표시용 하이픈 삽입.
 * - 0으로 시작(한국 등): 기본 000-0000-0000 (3-4-4), 최대 11자리까지
 * - 9자리이면서 50으로 시작: 50-349-1460 (2-3-4)
 * - 그 외: 입력 중엔 3-3-… , 완성 시 10자리면 3-3-4, 그 이상은 4자리씩 꼬리
 */
export function formatPhoneLocalDigits(rawDigits: string): string {
  const d = extractPhoneDigits(rawDigits);
  if (!d) return "";

  if (d.startsWith("0")) {
    const head = d.slice(0, 11);
    let out: string;
    if (head.length <= 3) out = head;
    else if (head.length <= 7)
      out = `${head.slice(0, 3)}-${head.slice(3)}`;
    else out = `${head.slice(0, 3)}-${head.slice(3, 7)}-${head.slice(7)}`;

    if (d.length > 11) {
      out += `-${dashChunks(d.slice(11), 4)}`;
    }
    return out;
  }

  if (d.startsWith("50") && d.length <= 9) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5, 9)}`;
  }

  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;

  const body = d.slice(0, 10);
  let out = `${body.slice(0, 3)}-${body.slice(3, 6)}-${body.slice(6, 10)}`;

  if (d.length > 10) {
    out += `-${dashChunks(d.slice(10), 4)}`;
  }
  return out;
}
