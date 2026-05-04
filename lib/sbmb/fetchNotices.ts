import {
  getCachedSheet,
  getSbmbSpreadsheetId,
  readSheetRange,
  SBMB_SHEET_NOTICES,
  type SheetCellValue,
} from "@/lib/googleSheets";
import type { SbmbNoticeDetail, SbmbNoticeListItem } from "@/types/sbmb";

/** 시트4 '공지사항' — 1행 헤더, 2행부터 데이터 */
const NOTICES_RANGE = "A2:F";

const logNotices =
  process.env.NODE_ENV === "development" ||
  process.env.SBMB_NOTICES_LOG === "1";

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

/** 본문 미리보기: 줄바꿈·공백을 한 줄로 이은 뒤 글자 수 제한, 초과 시 … */
const NOTICE_SUMMARY_MAX_CHARS = 120;

function bodySummary(body: string): string {
  const t = body.trim();
  if (!t) return "";
  const flat = t.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  if (flat.length <= NOTICE_SUMMARY_MAX_CHARS) return flat;
  const cut = flat.slice(0, NOTICE_SUMMARY_MAX_CHARS - 1).trimEnd();
  return `${cut}…`;
}

async function readNoticeRows(): Promise<SheetCellValue[][]> {
  const spreadsheetId = getSbmbSpreadsheetId();
  try {
    return await getCachedSheet("notices", () =>
      readSheetRange(spreadsheetId, SBMB_SHEET_NOTICES, NOTICES_RANGE),
    );
  } catch (e) {
    if (logNotices) {
      console.error("[sbmb/fetchNotices] readSheetRange failed:", e);
    }
    return [];
  }
}

function rowToListItem(
  raw: SheetCellValue[],
  sheetRowIndex: number,
): (SbmbNoticeListItem & { _idx: number }) | null {
  /** F열 슬러그 없음·형식 불일치 행은 목록/상세 모두 제외 */
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
    sheetOrder: sheetRowIndex,
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
  const items = out.map(({ _idx, ...rest }) => ({
    ...rest,
    sheetOrder: _idx,
  }));

  if (logNotices) {
    const sheetRowStart = 2;
    console.log(
      `[sbmb/fetchNotices] sheet='${SBMB_SHEET_NOTICES}' range=!${NOTICES_RANGE} (1-based data from row ${sheetRowStart}), rawRows=${rows.length}, parsedItems=${items.length}`,
    );
    rows.slice(0, 12).forEach((raw, i) => {
      const slugCell = cellStr(raw[5]);
      const importantRaw = raw[1];
      console.log(
        `[sbmb/fetchNotices] raw row sheetRow=${sheetRowStart + i} idx=${i} A=`,
        JSON.stringify(cellStr(raw[0])),
        "B=",
        importantRaw === null || importantRaw === undefined
          ? importantRaw
          : JSON.stringify(String(importantRaw)),
        "importantParsed=",
        parseImportant(raw[1]),
        "F(slug)=",
        slugCell ? JSON.stringify(slugCell) : "(empty)",
      );
    });
    console.log("[sbmb/fetchNotices] parsed items:", JSON.stringify(items, null, 2));
  }

  return items;
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
