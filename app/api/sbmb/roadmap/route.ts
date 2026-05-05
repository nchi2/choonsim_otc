import { NextResponse } from "next/server";
import { fetchRoadmapItems } from "@/lib/sbmb/fetchRoadmap";
import { sanitizeParticipantFacingError } from "@/lib/sbmb/participantFacingMessage";

export async function GET() {
  try {
    const items = await fetchRoadmapItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[sbmb/roadmap]", error);
    const raw =
      error instanceof Error ? error.message : "로드맵을 불러오지 못했습니다.";
    const message = sanitizeParticipantFacingError(raw);
    return NextResponse.json({ error: message, items: [] }, { status: 500 });
  }
}
