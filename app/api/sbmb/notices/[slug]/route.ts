import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/sbmb/clientIp";
import { fetchNoticeBySlug } from "@/lib/sbmb/fetchNotices";
import { rateLimitAllow } from "@/lib/sbmb/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = getClientIp(request);
  if (!rateLimitAllow(`sbmb:notices:detail:${ip}`)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }
  const { slug } = await params;
  try {
    const result = await fetchNoticeBySlug(slug);
    if (!result.found) {
      return NextResponse.json({ found: false }, { status: 404 });
    }
    const { detail } = result;
    return NextResponse.json({
      found: true,
      date: detail.date,
      important: detail.important,
      title: detail.title,
      body: detail.body,
      link: detail.link,
    });
  } catch (error) {
    console.error("[sbmb/notices/[slug]]", error);
    const message =
      error instanceof Error
        ? error.message
        : "공지를 불러오지 못했습니다.";
    return NextResponse.json({ error: message, found: false }, { status: 500 });
  }
}
