import { google } from "googleapis";

/** 시트1 — 워크플로우 기준 1행 대분류, 2행 헤더, 3행부터 데이터 */
export const SBMB_SHEET_TEN_MO = "10모 단위 참여";
/** 시트2 — 동일하게 3행부터 데이터 */
export const SBMB_SHEET_CONVERT = "고액권 전환 참여";
export const SBMB_SHEET_WALLET_LIST = "전체 지갑 리스트";
/** 시트4 — 1·2행 헤더 후 3행~ (워크플로우와 동일) */
export const SBMB_SHEET_NOTICES = "공지사항";
export const SBMB_SHEET_ROADMAP = "로드맵";
export const SBMB_TEN_MO_FIRST_DATA_ROW = 3;

/** 시트1·시트2 공통 데이터 시작 행 (1-based) */
export const SBMB_FIRST_DATA_ROW = SBMB_TEN_MO_FIRST_DATA_ROW;

export type SheetCellValue = string | number | boolean | null;

/** 공지·로드맵 등 부하가 큰 읽기 전용 구간용 인메모리 캐시 (서버 프로세스 단위) */
const sheetResponseCache = new Map<
  string,
  { data: unknown; timestamp: number }
>();
const sheetInFlight = new Map<string, Promise<unknown>>();
const SHEET_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * 동일 키에 대해 TTL 동안 시트 API 호출을 줄이고,
 * TTL 미스 시 동시 요청은 한 번의 fetcher만 실행한 뒤 같은 결과를 공유합니다.
 * lookup / verify 등 실시간 조회에는 사용하지 마세요.
 */
export async function getCachedSheet<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = sheetResponseCache.get(key);
  if (cached && Date.now() - cached.timestamp < SHEET_CACHE_TTL_MS) {
    return cached.data as T;
  }

  const pending = sheetInFlight.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const load = (async (): Promise<T> => {
    try {
      const data = await fetcher();
      sheetResponseCache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      sheetInFlight.delete(key);
    }
  })();

  sheetInFlight.set(key, load);
  return load;
}

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`${name} is not set`);
  }
  return v;
}

export function escapeSheetTitleForRange(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

/** 예: `sbmbRange("시트명", "D3:E")` → `'시트명'!D3:E` */
export function sbmbRange(sheetTitle: string, a1Range: string): string {
  return `${escapeSheetTitleForRange(sheetTitle)}!${a1Range}`;
}

export async function batchGetSheetValues(
  spreadsheetId: string,
  fullRanges: string[],
): Promise<SheetCellValue[][][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: fullRanges,
  });
  return (res.data.valueRanges ?? []).map((vr) => vr.values ?? []);
}

export function getSbmbSpreadsheetId(): string {
  return requireEnv("GOOGLE_SPREADSHEET_ID");
}

function createJwtAuth() {
  const email = requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const key = normalizePrivateKey(requireEnv("GOOGLE_PRIVATE_KEY"));

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export function getSheetsClient() {
  const auth = createJwtAuth();
  return google.sheets({ version: "v4", auth });
}

/**
 * 스프레드시트의 특정 시트에서 한 행(1-based row index)을 읽습니다.
 */
export async function readSheetRow(
  spreadsheetId: string,
  sheetTitle: string,
  rowIndex: number,
): Promise<SheetCellValue[]> {
  const sheets = getSheetsClient();
  const range = `${escapeSheetTitleForRange(sheetTitle)}!${rowIndex}:${rowIndex}`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const row = res.data.values?.[0];
  if (!row?.length) {
    return [];
  }
  return row.map((cell) => {
    if (cell === "") return null;
    return cell as SheetCellValue;
  });
}

/** '10모 단위 참여' 시트 첫 번째 데이터 행(3행) 전체 */
export async function readTenMoFirstDataRow(): Promise<SheetCellValue[]> {
  const spreadsheetId = getSbmbSpreadsheetId();
  return readSheetRow(
    spreadsheetId,
    SBMB_SHEET_TEN_MO,
    SBMB_TEN_MO_FIRST_DATA_ROW,
  );
}

export async function readSheetRange(
  spreadsheetId: string,
  sheetTitle: string,
  a1Range: string,
): Promise<SheetCellValue[][]> {
  const sheets = getSheetsClient();
  const range = `${escapeSheetTitleForRange(sheetTitle)}!${a1Range}`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  const values = res.data.values ?? [];
  return values.map((row) =>
    row.map((cell) => (cell === "" ? null : (cell as SheetCellValue))),
  );
}
