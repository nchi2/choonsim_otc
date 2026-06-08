import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

/**
 * 미들웨어 보호와 별개로, admin API 라우트 핸들러가 서버단에서 직접 세션을 재검증한다(심층 방어).
 */
export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** 연락처 마스킹 — 목록 화면 등 식별 최소화용. */
export function maskContact(contact: string): string {
  const s = contact.trim();
  if (!s) return "";
  if (s.includes("@")) {
    const [id, domain] = s.split("@");
    const head = id.slice(0, 2);
    return `${head}${"*".repeat(Math.max(1, id.length - 2))}@${domain}`;
  }
  const digits = s.replace(/[^0-9]/g, "");
  if (digits.length >= 7) {
    return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
  }
  if (s.length <= 2) return `${s[0]}*`;
  return `${s.slice(0, 2)}${"*".repeat(s.length - 2)}`;
}

/** 이름 마스킹 — 가운데 글자 가림. */
export function maskName(name: string): string {
  const s = name.trim();
  if (s.length <= 1) return s;
  if (s.length === 2) return `${s[0]}*`;
  return `${s[0]}${"*".repeat(s.length - 2)}${s[s.length - 1]}`;
}
