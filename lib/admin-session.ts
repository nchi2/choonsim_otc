/**
 * Admin 세션 — SESSION_SECRET(HMAC-SHA256)로 서명한 경량 쿠키.
 * Web Crypto(globalThis.crypto.subtle)만 사용해 Edge 미들웨어와 Node 라우트 양쪽에서 동작.
 * 토큰 형식: base64url(payload).base64url(hmac)
 * payload = { sub:"admin", uid:<adminUserId>, username, displayName, exp:<unix초> }
 */

export const ADMIN_SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24; // 24h

const enc = new TextEncoder();
const dec = new TextDecoder();

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

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(enc.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export interface AdminSessionPayload {
  sub: "admin";
  uid: number;
  username: string;
  displayName: string;
  exp: number;
}

export interface AdminSessionUser {
  adminUserId: number;
  username: string;
  displayName: string;
}

export async function createSessionToken(
  user: AdminSessionUser,
): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const payload: AdminSessionPayload = {
    sub: "admin",
    uid: user.adminUserId,
    username: user.username,
    displayName: user.displayName,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const payloadB64 = b64urlFromString(JSON.stringify(payload));
  const key = await getKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, toArrayBuffer(enc.encode(payloadB64))),
  );
  return `${payloadB64}.${b64urlFromBytes(sig)}`;
}

export async function parseSessionToken(
  token: string | undefined | null,
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  try {
    const key = await getKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      toArrayBuffer(bytesFromB64url(sigB64)),
      toArrayBuffer(enc.encode(payloadB64)),
    );
    if (!ok) return null;
    const payload = JSON.parse(
      dec.decode(bytesFromB64url(payloadB64)),
    ) as AdminSessionPayload;
    if (payload?.sub !== "admin") return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** @deprecated parseSessionToken 사용 권장 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  const payload = await parseSessionToken(token);
  return payload !== null;
}

export async function getSessionUser(
  token: string | undefined | null,
): Promise<AdminSessionUser | null> {
  const payload = await parseSessionToken(token);
  if (!payload) return null;
  if (
    typeof payload.uid !== "number" ||
    typeof payload.username !== "string" ||
    typeof payload.displayName !== "string"
  ) {
    return null;
  }
  return {
    adminUserId: payload.uid,
    username: payload.username,
    displayName: payload.displayName,
  };
}
