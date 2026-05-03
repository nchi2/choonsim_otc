import {
  getSbmbSpreadsheetId,
  readSheetRange,
  SBMB_SHEET_NOTICES,
  type SheetCellValue,
} from "@/lib/googleSheets";
import type { SbmbNoticeDetail, SbmbNoticeListItem } from "@/types/sbmb";

/** 시트4 — 시트1·2와 동일하게 3행부터 데이터 */
const NOTICES_RANGE = "A3:F";

/** F열 슬러그 — URL 안전 문자만 허용 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function cellStr(v: SheetCellValue | undefined): string {
  if (v == null || v === "") return "";
  return String(v).trim();
}

function parseImportant(b: SheetCellValue | undefined): boolean {
  const s = cellStr(b).toUpperCase();
  return (
    s === "Y" ||
    s === "YES" ||
    s === "TRUE" ||
    s === "1" ||
    s === "중요"
  );
}

function bodySummary(body: string): string {
  const t = body.trim();
  if (!t) return "";
  const lines = t
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const two = lines.slice(0, 2).join(" ");
  if (two.length > 220) return `${two.slice(0, 217)}…`;
  return two;
}

async function readNoticeRows(): Promise<SheetCellValue[][]> {
  const spreadsheetId = getSbmbSpreadsheetId();
  try {
    return await readSheetRange(
      spreadsheetId,
      SBMB_SHEET_NOTICES,
      NOTICES_RANGE,
    );
  } catch {
    return [];
  }
}

function rowToListItem(
  raw: SheetCellValue[],
  sheetRowIndex: number,
): (SbmbNoticeListItem & { _idx: number }) | null {
  const slug = cellStr(raw[5]);
  if (!slug || !SLUG_RE.test(slug)) return null;
  const title = cellStr(raw[2]);
  if (!title) return null;
  const body = cellStr(raw[3]);
  return {
    date: cellStr(raw[0]),
    important: parseImportant(raw[1]),
    title,
    summary: bodySummary(body),
    slug,
    _idx: sheetRowIndex,
  };
}

export async function fetchNoticeListItems(): Promise<SbmbNoticeListItem[]> {
  const rows = await readNoticeRows();
  const out: (SbmbNoticeListItem & { _idx: number })[] = [];
  rows.forEach((raw, idx) => {
    const item = rowToListItem(raw, idx);
    if (item) out.push(item);
  });
  out.sort((a, b) => {
    if (a.important !== b.important) {
      return (b.important ? 1 : 0) - (a.important ? 1 : 0);
    }
    return b._idx - a._idx;
  });
  return out.map(({ _idx, ...rest }) => rest);
}

export async function fetchNoticeBySlug(
  slug: string,
): Promise<{ found: false } | { found: true; detail: SbmbNoticeDetail }> {
  if (!SLUG_RE.test(slug)) {
    return { found: false };
  }
  const rows = await readNoticeRows();
  for (const raw of rows) {
    if (cellStr(raw[5]) !== slug) continue;
    const title = cellStr(raw[2]);
    if (!title) continue;
    return {
      found: true,
      detail: {
        date: cellStr(raw[0]),
        important: parseImportant(raw[1]),
        title,
        body: cellStr(raw[3]),
        link: cellStr(raw[4]),
      },
    };
  }
  return { found: false };
}
