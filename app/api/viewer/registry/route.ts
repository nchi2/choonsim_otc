import { viewerError, viewerJson, viewerOptions } from "@/lib/viewer/cors";
import { getViewerRegistry } from "@/lib/viewer/registry";

export const runtime = "nodejs";

export function OPTIONS() {
  return viewerOptions();
}

export async function GET() {
  const registry = getViewerRegistry();
  return viewerJson(registry, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
