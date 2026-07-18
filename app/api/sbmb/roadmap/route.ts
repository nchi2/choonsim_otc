import { NextResponse } from "next/server";
import { fetchRoadmapItems } from "@/lib/sbmb/fetchRoadmap";
import { sanitizeParticipantFacingError } from "@/lib/sbmb/participantFacingMessage";

export async function GET() {
  try {
    const items = await fetchRoadmapItems();
    // 로드맵 — 거의 불변: CDN 1시간 + SWR 24시간 (Step 11)
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("[sbmb/roadmap]", error);
    const raw =
      error instanceof Error ? error.message : "로드맵을 불러오지 못했습니다.";
    const message = sanitizeParticipantFacingError(raw);
    return NextResponse.json({ error: message, items: [] }, { status: 500 });
  }
}
