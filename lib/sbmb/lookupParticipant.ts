import {
  SBMB_FIRST_DATA_ROW,
  SBMB_SHEET_CONVERT,
  SBMB_SHEET_TEN_MO,
  batchGetSheetValues,
  getSbmbSpreadsheetId,
  sbmbRange,
  type SheetCellValue,
} from "@/lib/googleSheets";
import {
  normalizeParticipantName,
  normalizeParticipantPhoneDigits,
  participantNamesMatch,
  participantPhonesMatch,
} from "@/lib/sbmb/normalizeParticipant";
import type { SbmbLookupResponse, SbmbLookupSource } from "@/types/sbmb";

export type { SbmbLookupSource };

function cellToString(v: SheetCellValue | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  return String(v).trim();
}

/**
 * 시트1 D·E, 시트2 B·P 배치 조회 후 성함+연락처 일치 여부를 각각 판별.
 * 같은 사람이 두 시트 모두에 있을 수 있음 → sources 배열.
 */
export async function lookupSbmbParticipant(
  name: string,
  phone: string,
): Promise<SbmbLookupResponse> {
  const wantName = normalizeParticipantName(name);
  const wantPhone = normalizeParticipantPhoneDigits(phone);
  if (!wantName || !wantPhone) {
    return { found: false };
  }

  const spreadsheetId = getSbmbSpreadsheetId();
  const start = SBMB_FIRST_DATA_ROW;

  /** 시트2: B(성함) ~ P(연락처) — P열 인덱스는 행 배열에서 14 (B=0…P=14) */
  const ranges = [
    sbmbRange(SBMB_SHEET_TEN_MO, `D${start}:E`),
    sbmbRange(SBMB_SHEET_CONVERT, `B${start}:P`),
  ];

  const [tenMoRows, convertRows] = await batchGetSheetValues(
    spreadsheetId,
    ranges,
  );

  let foundNew = false;
  for (let i = 0; i < tenMoRows.length; i++) {
    const row = tenMoRows[i];
    const sheetName = cellToString(row?.[0]);
    const sheetPhone = cellToString(row?.[1]);
    if (
      participantNamesMatch(name, sheetName) &&
      participantPhonesMatch(phone, sheetPhone)
    ) {
      foundNew = true;
      break;
    }
  }

  let foundConvert = false;
  const phoneColInSlice = 14;

  for (let i = 0; i < convertRows.length; i++) {
    const row = convertRows[i];
    const sheetName = cellToString(row?.[0]);
    const sheetPhone = cellToString(row?.[phoneColInSlice]);
    if (
      participantNamesMatch(name, sheetName) &&
      participantPhonesMatch(phone, sheetPhone)
    ) {
      foundConvert = true;
      break;
    }
  }

  const sources: SbmbLookupSource[] = [];
  if (foundNew) sources.push("new");
  if (foundConvert) sources.push("convert");

  if (sources.length === 0) {
    return { found: false };
  }

  return { found: true, sources };
}
