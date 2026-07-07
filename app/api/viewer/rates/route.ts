import { viewerJson, viewerOptions } from "@/lib/viewer/cors";
import { fetchViewerRates } from "@/lib/viewer/prices";

export const runtime = "nodejs";

export function OPTIONS() {
  return viewerOptions();
}

export async function GET() {
  const payload = await fetchViewerRates();
  return viewerJson(payload, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
    },
  });
}
