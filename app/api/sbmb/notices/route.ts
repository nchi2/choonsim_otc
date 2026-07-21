import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/sbmb/clientIp";
import { fetchNoticeListItems } from "@/lib/sbmb/fetchNotices";
import { sanitizeParticipantFacingError } from "@/lib/sbmb/participantFacingMessage";
import { rateLimitAllow } from "@/lib/sbmb/rateLimit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimitAllow(`sbmb:notices:list:${ip}`)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }
  try {
    const items = await fetchNoticeListItems();
    // 공지 목록 — CDN 5분 + SWR 30분 (Step 11: Google Sheets 호출 비용 절감)
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
        },
      },
    );
  } catch (error) {
    console.error("[sbmb/notices]", error);
    const raw =
      error instanceof Error
        ? error.message
        : "공지 목록을 불러오지 못했습니다.";
    const message = sanitizeParticipantFacingError(raw);
    return NextResponse.json({ error: message, items: [] }, { status: 500 });
  }
}
