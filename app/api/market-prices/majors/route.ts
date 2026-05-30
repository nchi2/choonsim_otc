import { NextResponse } from "next/server";
import { fetchBoardMarketData } from "@/lib/market-data";

/**
 * /otc 시세 보드 전용 API.
 *
 * - 메이저 8종(BTC/ETH/XRP/BNB/SOL/TRX/DOGE/USDC) + BMB 24h%를 한 응답에 실어 보낸다.
 *   (BMB의 표시 가격은 클라이언트 보드가 별도로 `/api/market-prices`에서 LBANK 우선 가격을 받아 덮어쓴다.)
 * - 데이터 소스 우선순위: 바이낸스 batch → OKX 8병렬 → ccapi(klines 1h×25). BMB는 ccapi only.
 *   상세는 `lib/market-data.ts` 참고.
 * - 외부 응답이 어떤 형태(HTML/429/장애)든 본문은 절대 객체에 흘리지 않는다.
 *   라우트는 항상 status 200 + 안전한 JSON 으로만 응답한다.
 *   reason 코드는 짧은 문자열만(rate_limited / timeout / unavailable / non_json / no_data / all_failed).
 *
 * ※ 메인 페이지 / 거래 페이지가 사용하는 `/api/market-prices` 라우트는 별도이며 본 작업에서는 손대지 않는다.
 */

/** Vercel function timeout — 폴백 체인이 모두 작동해도 충분한 여유. */
export const maxDuration = 15;

export async function GET() {
  try {
    const result = await fetchBoardMarketData();
    /** UI 보드는 `items` 배열에서 BMB를 분리해 강조 행으로 사용. 정의 순서 유지. */
    const items = result.bmb ? [result.bmb, ...result.majors] : result.majors;
    return NextResponse.json({
      items,
      updatedAt: new Date().toISOString(),
      source: result.source,
      ...(result.stale ? { stale: true } : {}),
      ...(Object.keys(result.errors).length > 0
        ? { errors: result.errors }
        : {}),
    });
  } catch {
    /**
     * 어떤 예외가 나오더라도 외부 본문/스택을 노출하지 않고 200 + safe JSON.
     * 이 분기에 도달하는 일은 거의 없지만(모듈 내부에서 모두 감싸져 있음) 마지막 보호막.
     */
    return NextResponse.json(
      {
        items: [],
        updatedAt: new Date().toISOString(),
        source: { majors: "none" as const, bmb: "none" as const },
        errors: { _global: "unavailable" },
      },
      { status: 200 },
    );
  }
}
