import {
  getCachedSheet,
  getSbmbSpreadsheetId,
  readSheetRange,
  SBMB_SHEET_ROADMAP,
} from "@/lib/googleSheets";
import type { SbmbRoadmapItem } from "@/types/sbmb";

export async function fetchRoadmapItems(): Promise<SbmbRoadmapItem[]> {
  const spreadsheetId = getSbmbSpreadsheetId();
  const rows = await getCachedSheet("roadmap", () =>
    readSheetRange(spreadsheetId, SBMB_SHEET_ROADMAP, "A2:B"),
  );

  return rows
    .map((r) => ({
      label: r[0] != null ? String(r[0]).trim() : "",
      status: r[1] != null ? String(r[1]).trim() : "",
    }))
    .filter((item) => item.label.length > 0)
    .filter(
      (item) =>
        item.label !== "단계명" &&
        item.label.toLowerCase() !== "label" &&
        item.label !== "단계",
    );
}
