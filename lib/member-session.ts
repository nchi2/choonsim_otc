/**
 * 회원 세션 — 운영자(admin-session.ts)와 동일한 HMAC-SHA256/b64url 프리미티브를 쓰되
 * ★완전 분리: 쿠키명 member_session · payload sub="member" · 검증 시 sub==="member" 강제.
 *
 * 권한 분리 불변식(양방향):
 *  - admin-session.parseSessionToken은 sub!=="admin"을 거부(무접촉 유지) → 회원 토큰은 /admin·/api/admin 통과 불가.
 *  - 이 파일의 parseMemberToken은 sub!=="member"를 거부 → 운영자 토큰도 회원 경로를 통과 불가.
 *
 * 시크릿: MEMBER_SESSION_SECRET이 있으면 그것을(운영자와 키 분리 — 유출 반경 축소),
 * 없으면 SESSION_SECRET 공유. 공유해도 sub 분리로 교차 통과는 불가(서명 위조는 어차피 시크릿 필요).
 */

export const MEMBER_SESSION_COOKIE = "member_session";
export const MEMBER_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7일 (소비자 편의)
/** 구글 OAuth CSRF state 쿠키 — route.ts는 메서드 외 export 금지라 여기서 공유 */
export const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";

const enc = new TextEncoder();
const dec = new TextDecoder();

function secret(): string | null {
  return (
    process.env.MEMBER_SESSION_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    null
  );
}

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlFromString(s: string): string {
  return b64urlFromBytes(enc.encode(s));
}

function bytesFromB64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}

async function getKey(sec: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(enc.encode(sec)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export interface MemberSessionPayload {
  sub: "member";
  uid: string; // Member.id (cuid)
  email: string;
  name: string;
  exp: number;
}

export interface MemberSessionUser {
  memberId: string;
  email: string;
  name: string;
}

export async function createMemberToken(
  user: MemberSessionUser,
): Promise<string> {
  const sec = secret();
  if (!sec) throw new Error("SESSION_SECRET is not set");
  const payload: MemberSessionPayload = {
    sub: "member",
    uid: user.memberId,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + MEMBER_SESSION_MAX_AGE_SEC,
  };
  const payloadB64 = b64urlFromString(JSON.stringify(payload));
  const key = await getKey(sec);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, toArrayBuffer(enc.encode(payloadB64))),
  );
  return `${payloadB64}.${b64urlFromBytes(sig)}`;
}

export async function parseMemberToken(
  token: string | undefined | null,
): Promise<MemberSessionPayload | null> {
  if (!token) return null;
  const sec = secret();
  if (!sec) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  try {
    const key = await getKey(sec);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      toArrayBuffer(bytesFromB64url(sigB64)),
      toArrayBuffer(enc.encode(payloadB64)),
    );
    if (!ok) return null;
    const payload = JSON.parse(
      dec.decode(bytesFromB64url(payloadB64)),
    ) as MemberSessionPayload;
    if (payload?.sub !== "member") return null; // ★ 운영자 토큰 등 다른 sub 거부
    if (typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof payload.uid !== "string" || !payload.uid) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function verifyMemberToken(
  token: string | undefined | null,
): Promise<boolean> {
  return (await parseMemberToken(token)) !== null;
}

export async function getMemberSessionUser(
  token: string | undefined | null,
): Promise<MemberSessionUser | null> {
  const payload = await parseMemberToken(token);
  if (!payload) return null;
  if (typeof payload.email !== "string" || typeof payload.name !== "string") {
    return null;
  }
  return { memberId: payload.uid, email: payload.email, name: payload.name };
}
