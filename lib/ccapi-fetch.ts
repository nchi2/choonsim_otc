import { Agent, fetch as undiciFetch } from "undici";

const CCAPI_ORIGIN = "https://ccapi.rerrkvifj.com";

/**
 * ccapi 호스트는 인증서 체인이 불완전한 경우가 많아,
 * 로컬·Vercel Node의 strict TLS 검증에서 `fetch`가 실패할 수 있습니다.
 * - 개발: 처음부터 완화(빠른 피드백)
 * - 프로덕션: strict 시도 후 TLS 계열 오류면 undici 완화 1회 재시도
 * - CCAPI_TLS_STRICT=true 이면 재시도 없음 / CCAPI_TLS_INSECURE=true 이면 항상 완화
 */
function ccapiRelaxedTlsOnly(): boolean {
  if (process.env.CCAPI_TLS_INSECURE === "true") return true;
  if (process.env.CCAPI_TLS_STRICT === "true") return false;
  return process.env.NODE_ENV === "development";
}

function collectErrText(err: unknown, depth: number): string[] {
  if (depth > 6 || err == null) return [];
  if (err instanceof Error) {
    const out = [err.message];
    const { cause } = err;
    if (cause != null) {
      return [...out, ...collectErrText(cause, depth + 1)];
    }
    return out;
  }
  if (typeof err === "object" && err !== null && "code" in err) {
    return [String((err as { code: unknown }).code)];
  }
  return [String(err)];
}

function isLikelyTlsError(err: unknown): boolean {
  const text = collectErrText(err, 0).join(" ").toUpperCase();
  return (
    text.includes("CERTIFICATE") ||
    text.includes("TLS") ||
    text.includes("SSL") ||
    text.includes("UNABLE_TO_GET_ISSUER_CERT_LOCALLY") ||
    text.includes("SELF_SIGNED") ||
    text.includes("HANDSHAKE") ||
    text.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE")
  );
}

async function fetchCcapiRelaxed(
  url: string,
  rest: RequestInit
): Promise<Response> {
  const dispatcher = new Agent({
    connect: { rejectUnauthorized: false },
  });
  try {
    const res = await undiciFetch(url, {
      ...rest,
      dispatcher,
    } as Parameters<typeof undiciFetch>[1]);
    return res as unknown as Response;
  } finally {
    void dispatcher.close();
  }
}

export function getCcapiKlinesUrl(
  symbol: string,
  interval: string,
  to: number,
  size: number
): string {
  const q = new URLSearchParams({
    symbol,
    interval,
    to: String(to),
    size: String(size),
  });
  return `${CCAPI_ORIGIN}/spot-market-center/klines?${q.toString()}`;
}

type FetchInit = RequestInit & { next?: { revalidate?: number } };

export async function fetchCcapi(url: string, init?: FetchInit): Promise<Response> {
  const { next: _n, ...rest } = init ?? {};
  void _n;

  if (ccapiRelaxedTlsOnly()) {
    return fetchCcapiRelaxed(url, rest);
  }

  if (process.env.CCAPI_TLS_STRICT === "true") {
    return fetch(url, init);
  }

  try {
    return await fetch(url, init);
  } catch (err) {
    if (!isLikelyTlsError(err)) {
      throw err;
    }
    console.warn(
      "[fetchCcapi] strict TLS failed, retrying with relaxed TLS:",
      err instanceof Error ? err.message : err
    );
    return fetchCcapiRelaxed(url, rest);
  }
}
