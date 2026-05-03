import {
  SBMB_FIRST_DATA_ROW,
  SBMB_SHEET_CONVERT,
  SBMB_SHEET_TEN_MO,
  SBMB_SHEET_WALLET_LIST,
  getSbmbSpreadsheetId,
  readSheetRange,
  type SheetCellValue,
} from "@/lib/googleSheets";
import {
  normalizeWalletDesignLabel,
  participantNamesMatch,
  participantPhonesMatch,
} from "@/lib/sbmb/normalizeParticipant";
import type {
  SbmbVerifyEntry,
  SbmbVerifyResponse,
  SbmbVerifyWallet,
  SbmbVerifyWalletTokens,
} from "@/types/sbmb";

/** 시트1·2: 1행 대분류·2행 헤더 다음, 3행(스프레드시트 1-based)부터 데이터 */
const SHEET_READ_RANGE = "A3:AZ";

/** A3:AZ 구간에 맞춰 C·G 등 고정 인덱스가 안전히 존재하도록 희소 행 패딩 */
const SHEET_ROW_MIN_LEN = 52;

/** 시트3 A열 디자인 — 인덱스 0 */
const SHEET3_COL_A_DESIGN = 0;
/** 시트3 C열 No — 인덱스 2 */
const SHEET3_COL_C_NO = 2;
/** 시트3 E열 공개주소 — 인덱스 4 */
const SHEET3_COL_E_ADDRESS = 4;
/** 시트3 O/Q/R열 토큰 */
const SHEET3_COL_LDT = 14;
const SHEET3_COL_PRR = 16;
const SHEET3_COL_SBMB = 17;

const SHEET3_TOKEN_COLS = [
  SHEET3_COL_LDT,
  SHEET3_COL_PRR,
  SHEET3_COL_SBMB,
] as const;

/** 시트2 연락처 P열 — A=0 기준 인덱스 15 */
const SHEET2_COL_P = 15;

/** 시트2 단위 C열 — A=0 기준 인덱스 2 */
const SHEET2_COL_C_UNIT = 2;

/** 시트2 메인 No G열 — A=0 기준 인덱스 6 */
const SHEET2_COL_G_MAIN_NO = 6;

/** 시트2 메인 지갑 디자인 종류 F열 — A=0 기준 인덱스 5 */
const SHEET2_COL_F_DESIGN = 5;

const SERVICE_DESIGNS_SHEET1: Record<number, string> = {
  9: "초록고래",
  10: "모비기와 모랑이",
  11: "봄냥이",
  12: "블루캣",
  13: "토성",
};

const SERVICE_DESIGNS_SHEET2: Record<number, string> = {
  8: "초록고래",
  9: "모비기와 모랑이",
  10: "봄냥이",
  11: "블루캣",
  12: "토성",
};

type WalletDraft = {
  no: number;
  type: "main" | "service";
  design?: string;
  /** 시트2 C열 — 해당 행 메인 지갑만. 서비스·시트1은 null */
  unit?: string | null;
};

function cellToString(v: SheetCellValue | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  return String(v).trim();
}

function padSheetRowToMinLength(
  row: SheetCellValue[] | undefined,
  minLen: number,
): SheetCellValue[] {
  if (!row?.length) {
    return Array(minLen).fill(null);
  }
  if (row.length >= minLen) {
    return row;
  }
  return [...row, ...Array(minLen - row.length).fill(null)];
}

/** 동일 No가 여러 참여 행에 나올 때, 단위(C열)는 비어 있지 않은 값을 우선 */
function mergeWalletDraftSameNo(prev: WalletDraft, next: WalletDraft): WalletDraft {
  const unit = next.unit?.trim()
    ? next.unit
    : prev.unit?.trim()
      ? prev.unit
      : null;
  const design = next.design?.trim() ? next.design : prev.design;
  return {
    no: prev.no,
    type: prev.type,
    design: design || undefined,
    unit:
      prev.type === "main" || next.type === "main"
        ? unit
        : null,
  };
}

function parseStatusDisplay(v: SheetCellValue | undefined): string {
  const s = cellToString(v);
  if (!s) return "대기 중";
  if (/^\d+(\.\d+)?$/.test(s)) return "진행 중";
  const lower = s.toLowerCase();
  if (s === "TRUE" || s === "완료" || lower === "true") return "완료";
  if (s === "FALSE" || lower === "false") return "대기 중";
  if (s.includes("진행")) return "진행 중";
  if (s.includes("예정")) return "예정";
  return s;
}

function parseWalletNo(v: SheetCellValue | undefined): number | null {
  const s = cellToString(v);
  if (!s) return null;
  const n = parseInt(s.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function parseTokenAmount(v: SheetCellValue | undefined): number {
  const s = cellToString(v);
  if (!s || s === "-" || s === "—") return 0;
  const raw = String(v).replace(/,/g, "").trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function tokensFromSheet3Row(
  row: SheetCellValue[] | undefined,
): SbmbVerifyWalletTokens {
  if (!row) {
    return { LDT: 0, PRR: 0, SBMB: 0 };
  }
  return {
    LDT: parseTokenAmount(row[SHEET3_COL_LDT]),
    PRR: parseTokenAmount(row[SHEET3_COL_PRR]),
    SBMB: parseTokenAmount(row[SHEET3_COL_SBMB]),
  };
}

/** LDT / PRR / SBMB 반영 */
function aggregateTokenStatusFromRow(row: SheetCellValue[]): string {
  const texts = SHEET3_TOKEN_COLS.map((i) => cellToString(row[i])).filter(
    Boolean,
  );
  if (texts.length >= SHEET3_TOKEN_COLS.length) return "완료";
  if (texts.length > 0) return "진행 중";
  return "대기 중";
}

/** 시트3 전체를 한 번 읽고, (정규화 디자인 + No) → 행. 타인 주소는 조회하지 않음. */
async function buildSheet3DesignNoMap(
  spreadsheetId: string,
): Promise<Map<string, SheetCellValue[]>> {
  const rows = await readSheetRange(
    spreadsheetId,
    SBMB_SHEET_WALLET_LIST,
    "A3:R",
  );
  const map = new Map<string, SheetCellValue[]>();
  for (const r of rows) {
    const designCell = cellToString(r[SHEET3_COL_A_DESIGN]);
    const no = parseWalletNo(r[SHEET3_COL_C_NO]);
    if (!designCell || no === null) continue;
    const key = `${normalizeWalletDesignLabel(designCell)}|${no}`;
    if (!map.has(key)) {
      map.set(key, r);
    }
  }
  return map;
}

function walletDraftToSheet3Key(d: WalletDraft): string | null {
  const design = d.design?.trim();
  if (!design) return null;
  return `${normalizeWalletDesignLabel(design)}|${d.no}`;
}

function lookupSheet3RowByDraft(
  sheet3Map: Map<string, SheetCellValue[]>,
  d: WalletDraft,
): SheetCellValue[] | undefined {
  const key = walletDraftToSheet3Key(d);
  return key ? sheet3Map.get(key) : undefined;
}

function enrichWalletsFromSheet3(
  drafts: WalletDraft[],
  sheet3Map: Map<string, SheetCellValue[]>,
): SbmbVerifyWallet[] {
  return drafts.map((d) => {
    const row = lookupSheet3RowByDraft(sheet3Map, d);
    return {
      ...d,
      tokens: tokensFromSheet3Row(row),
      address: row ? cellToString(row[SHEET3_COL_E_ADDRESS]) : "",
    };
  });
}

function parseWalletsFromSheet1Row(rowIn: SheetCellValue[]): WalletDraft[] {
  const row = padSheetRowToMinLength(rowIn, SHEET_ROW_MIN_LEN);
  const mainDesign = cellToString(row[7]);
  const mainNo = parseWalletNo(row[8]);
  const out: WalletDraft[] = [];
  if (mainNo !== null) {
    out.push({
      no: mainNo,
      type: "main",
      design: mainDesign || undefined,
      unit: null,
    });
  }
  for (let col = 9; col <= 13; col++) {
    const n = parseWalletNo(row[col]);
    if (n !== null) {
      out.push({
        no: n,
        type: "service",
        design: SERVICE_DESIGNS_SHEET1[col],
        unit: null,
      });
    }
  }
  return out;
}

function parseWalletsFromSheet2Row(rowIn: SheetCellValue[]): WalletDraft[] {
  const row = padSheetRowToMinLength(rowIn, SHEET_ROW_MIN_LEN);
  const rowUnitRaw = cellToString(row[SHEET2_COL_C_UNIT]);
  const mainUnit = rowUnitRaw.length > 0 ? rowUnitRaw : null;
  const mainDesign = cellToString(row[SHEET2_COL_F_DESIGN]);
  const mainNo = parseWalletNo(row[SHEET2_COL_G_MAIN_NO]);
  const out: WalletDraft[] = [];
  if (mainNo !== null) {
    out.push({
      no: mainNo,
      type: "main",
      design: mainDesign || undefined,
      unit: mainUnit,
    });
  }
  for (let col = 8; col <= 12; col++) {
    const n = parseWalletNo(row[col]);
    if (n !== null) {
      out.push({
        no: n,
        type: "service",
        design: SERVICE_DESIGNS_SHEET2[col],
        unit: null,
      });
    }
  }
  return out;
}

function mergeWalletDrafts(
  allRows: SheetCellValue[][],
  offsets: number[],
  parseRow: (r: SheetCellValue[]) => WalletDraft[],
): WalletDraft[] {
  const byNo = new Map<number, WalletDraft>();
  for (const off of offsets) {
    const r = padSheetRowToMinLength(allRows[off], SHEET_ROW_MIN_LEN);
    for (const w of parseRow(r)) {
      const prev = byNo.get(w.no);
      if (!prev) {
        byNo.set(w.no, w);
      } else {
        byNo.set(w.no, mergeWalletDraftSameNo(prev, w));
      }
    }
  }
  return [...byNo.values()].sort((a, b) => a.no - b.no);
}

function sheetStatusOverlaySync(
  sheet3Row: SheetCellValue[] | undefined,
  participantWalletStatus: string,
  participantAirdrop: string,
): { walletStatus: string; airdropStatus: string } {
  let walletStatus = participantWalletStatus;
  let airdropStatus = participantAirdrop;
  if (sheet3Row) {
    const fromSheet3Wallet = parseStatusDisplay(sheet3Row[1]);
    const fromSheet3Airdrop = aggregateTokenStatusFromRow(sheet3Row);
    if (fromSheet3Wallet !== "대기 중") {
      walletStatus = fromSheet3Wallet;
    }
    if (fromSheet3Airdrop !== "대기 중") {
      airdropStatus = fromSheet3Airdrop;
    }
  }
  return { walletStatus, airdropStatus };
}

/**
 * 성함+연락처로 시트1·시트2 전체를 보고, walletNo가 어느 한쪽 지갑 목록에라도 있으면 성공.
 * 참여 유형별로 entries 항목을 나눠 반환합니다.
 */
export async function verifySbmbParticipant(
  name: string,
  phone: string,
  walletNo: number,
): Promise<SbmbVerifyResponse> {
  if (!Number.isFinite(walletNo)) {
    return { found: false };
  }

  const trimmedName = name.trim();
  const spreadsheetId = getSbmbSpreadsheetId();

  const sheet1Rows = await readSheetRange(
    spreadsheetId,
    SBMB_SHEET_TEN_MO,
    SHEET_READ_RANGE,
  );
  const sheet2Rows = await readSheetRange(
    spreadsheetId,
    SBMB_SHEET_CONVERT,
    SHEET_READ_RANGE,
  );

  const matching1: number[] = [];
  for (let i = 0; i < sheet1Rows.length; i++) {
    const r = padSheetRowToMinLength(sheet1Rows[i], SHEET_ROW_MIN_LEN);
    const n = cellToString(r[3]);
    const p = cellToString(r[4]);
    if (
      participantNamesMatch(trimmedName, n) &&
      participantPhonesMatch(phone, p)
    ) {
      matching1.push(i);
    }
  }

  const matching2: number[] = [];
  for (let i = 0; i < sheet2Rows.length; i++) {
    const r = padSheetRowToMinLength(sheet2Rows[i], SHEET_ROW_MIN_LEN);
    const n = cellToString(r[1]);
    const p = cellToString(r[SHEET2_COL_P]);
    if (
      participantNamesMatch(trimmedName, n) &&
      participantPhonesMatch(phone, p)
    ) {
      matching2.push(i);
    }
  }

  const logSheet2 =
    process.env.SBMB_VERIFY_LOG_SHEET2 === "1" ||
    process.env.NODE_ENV === "development";
  if (logSheet2) {
    console.log(
      `[sbmb/verify] sheet2 '${SBMB_SHEET_CONVERT}': ${sheet2Rows.length} rows, range !${SHEET_READ_RANGE}, 1-based data starts row ${SBMB_FIRST_DATA_ROW} (idx0 = sheet row ${SBMB_FIRST_DATA_ROW})`,
    );
    sheet2Rows.forEach((raw, i) => {
      const r = padSheetRowToMinLength(raw, SHEET_ROW_MIN_LEN);
      const sheetRow = SBMB_FIRST_DATA_ROW + i;
      const isMatch = matching2.includes(i);
      if (
        process.env.SBMB_VERIFY_LOG_SHEET2 === "1" ||
        i < 15 ||
        isMatch
      ) {
        const cVal = r[SHEET2_COL_C_UNIT];
        console.log(
          `[sbmb/verify] sheet2 row ${sheetRow} idx=${i} matched=${isMatch} C[${SHEET2_COL_C_UNIT}]=`,
          cVal === null || cVal === undefined
            ? cVal
            : JSON.stringify(String(cVal)),
          "typeof=",
          typeof cVal,
          "rawLen=",
          raw?.length ?? 0,
          "padLen=",
          r.length,
        );
      }
    });
    if (sheet2Rows.length > 15 && process.env.SBMB_VERIFY_LOG_SHEET2 !== "1") {
      console.log(
        `[sbmb/verify] sheet2: ... ${sheet2Rows.length - 15} more rows omitted (set SBMB_VERIFY_LOG_SHEET2=1 for every row C)`,
      );
    }
  }

  const allNos = new Set<number>();
  for (const off of matching1) {
    for (const w of parseWalletsFromSheet1Row(sheet1Rows[off])) {
      allNos.add(w.no);
    }
  }
  for (const off of matching2) {
    for (const w of parseWalletsFromSheet2Row(sheet2Rows[off])) {
      allNos.add(w.no);
    }
  }

  if (!allNos.has(walletNo)) {
    return { found: false };
  }

  const sheet3DesignNoMap = await buildSheet3DesignNoMap(spreadsheetId);

  const entries: SbmbVerifyEntry[] = [];

  let displayName = trimmedName;
  if (matching1.length > 0) {
    const firstOff = Math.min(...matching1);
    displayName =
      cellToString(
        padSheetRowToMinLength(sheet1Rows[firstOff], SHEET_ROW_MIN_LEN)[3],
      ) || trimmedName;
  } else if (matching2.length > 0) {
    const firstOff = Math.min(...matching2);
    displayName =
      cellToString(
        padSheetRowToMinLength(sheet2Rows[firstOff], SHEET_ROW_MIN_LEN)[1],
      ) || trimmedName;
  }

  if (matching1.length > 0) {
    const firstOff = Math.min(...matching1);
    const statusRow = padSheetRowToMinLength(
      sheet1Rows[firstOff],
      SHEET_ROW_MIN_LEN,
    );
    const drafts = mergeWalletDrafts(
      sheet1Rows,
      matching1,
      parseWalletsFromSheet1Row,
    );
    const wallets = enrichWalletsFromSheet3(drafts, sheet3DesignNoMap);
    const mainNo = parseWalletNo(statusRow[8]);
    const mainDesign = cellToString(statusRow[7]);

    const feeStatus = parseStatusDisplay(statusRow[14]);
    let walletStatus = parseStatusDisplay(statusRow[15]);
    let airdropStatus = parseStatusDisplay(statusRow[16]);
    const mainOverlayRow =
      mainNo !== null
        ? lookupSheet3RowByDraft(sheet3DesignNoMap, {
            no: mainNo,
            type: "main",
            design: mainDesign || undefined,
          })
        : undefined;
    const overlay = sheetStatusOverlaySync(
      mainOverlayRow,
      walletStatus,
      airdropStatus,
    );
    walletStatus = overlay.walletStatus;
    airdropStatus = overlay.airdropStatus;

    const memoRaw = cellToString(statusRow[17]);
    entries.push({
      entryType: "신규참여",
      unit: "10모",
      wallets,
      feeStatus,
      walletStatus,
      airdropStatus,
      memo: memoRaw.length > 0 ? memoRaw : undefined,
    });
  }

  if (matching2.length > 0) {
    const firstOff = Math.min(...matching2);
    const statusRow = padSheetRowToMinLength(
      sheet2Rows[firstOff],
      SHEET_ROW_MIN_LEN,
    );
    const drafts = mergeWalletDrafts(
      sheet2Rows,
      matching2,
      parseWalletsFromSheet2Row,
    );
    const wallets = enrichWalletsFromSheet3(drafts, sheet3DesignNoMap);
    const unit = cellToString(statusRow[SHEET2_COL_C_UNIT]) || "—";
    const mainNo = parseWalletNo(statusRow[SHEET2_COL_G_MAIN_NO]);
    const mainDesign = cellToString(statusRow[SHEET2_COL_F_DESIGN]);

    const feeStatus = parseStatusDisplay(statusRow[17]);
    const submitStatus = parseStatusDisplay(statusRow[18]);
    let walletStatus = parseStatusDisplay(statusRow[19]);
    let airdropStatus = parseStatusDisplay(statusRow[20]);
    const mainOverlayRow =
      mainNo !== null
        ? lookupSheet3RowByDraft(sheet3DesignNoMap, {
            no: mainNo,
            type: "main",
            design: mainDesign || undefined,
          })
        : undefined;
    const overlay = sheetStatusOverlaySync(
      mainOverlayRow,
      walletStatus,
      airdropStatus,
    );
    walletStatus = overlay.walletStatus;
    airdropStatus = overlay.airdropStatus;

    const memoRaw = cellToString(statusRow[21]);
    entries.push({
      entryType: "고액권전환",
      unit,
      wallets,
      feeStatus,
      submitStatus,
      walletStatus,
      airdropStatus,
      memo: memoRaw.length > 0 ? memoRaw : undefined,
    });
  }

  if (entries.length === 0) {
    return { found: false };
  }

  return {
    found: true,
    name: displayName,
    entries,
  };
}
