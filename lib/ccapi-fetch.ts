import { Agent, fetch as undiciFetch } from "undici";

const CCAPI_ORIGIN = "https://ccapi.rerrkvifj.com";

/**
 * ccapi 호스트는 일부 로컬 Node 환경에서 중간 인증서 검증 실패( UNABLE_TO_GET_ISSUER_CERT_LOCALLY )가 납니다.
 * production에서는 기본 TLS 검증. 개발에서는 완화( MITM 위험은 로컬 한정 ).
 * 운영에서도 동일 오류가 나면 환경변수 CCAPI_TLS_INSECURE=true (비권장).
 */
function shouldRelaxTlsForCcapi(): boolean {
  if (process.env.CCAPI_TLS_INSECURE === "true") return true;
  if (process.env.CCAPI_TLS_STRICT === "true") return false;
  return process.env.NODE_ENV === "development";
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
  const relaxed = shouldRelaxTlsForCcapi();
  const { next: _n, ...rest } = init ?? {};
  void _n;
  if (!relaxed) {
    return fetch(url, init);
  }
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
