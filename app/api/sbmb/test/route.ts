import { NextResponse } from "next/server";
import {
  SBMB_SHEET_TEN_MO,
  SBMB_TEN_MO_FIRST_DATA_ROW,
  readTenMoFirstDataRow,
} from "@/lib/googleSheets";
import { sanitizeParticipantFacingError } from "@/lib/sbmb/participantFacingMessage";

export async function GET() {
  try {
    const values = await readTenMoFirstDataRow();

    return NextResponse.json({
      ok: true,
      sheet: SBMB_SHEET_TEN_MO,
      rowIndex: SBMB_TEN_MO_FIRST_DATA_ROW,
      values,
    });
  } catch (error) {
    console.error("[sbmb/test]", error);

    const raw =
      error instanceof Error ? error.message : "Google Sheets 요청 실패";
    const message = sanitizeParticipantFacingError(raw);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
