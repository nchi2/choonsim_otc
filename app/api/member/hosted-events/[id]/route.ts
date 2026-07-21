import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isKstYmd } from "@/lib/kst";
import { getMemberUser } from "@/lib/member-guard";
import { EDUCATOR_LOCKED_AFTER_APPROVAL } from "@/lib/education-status";
import { isR2PublicUrl } from "@/lib/r2";

export const runtime = "nodejs";

// 교육자 본인 행사 상세(GET — 수정 폼 프리필) + 수정(PATCH). (Step 15)
// ★ 소유권: hostMemberId === 세션 uid 를 모든 메서드에서 강제(남의 행사는 404).
// 수정 규칙:
//  - PENDING/REJECTED: 전 항목 자유 수정(세션 교체 포함 — 비공개라 신청자 영향 없음).
//    REJECTED + resubmit=true → PENDING 재제출(사유 비움).
//  - APPROVED: 안내성 필드(EDUCATOR_EDITABLE_AFTER_APPROVAL)만 허용.
//    잠긴 필드가 body에 오면 400 거부(조용한 무시로 "저장됐다" 착각 방지).
//  - CANCELED: 수정 불가.

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

const DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  category: true,
  mode: true,
  status: true,
  rejectReason: true,
  isPublished: true,
  posterUrl: true,
  descriptionMd: true,
  instructorName: true,
  instructorBio: true,
  officeId: true,
  customLocation: true,
  streamUrl: true,
  capacity: true,
  feeKrw: true,
  depositBankName: true,
  depositAccountNo: true,
  depositAccountHolder: true,
  eligibility: true,
  preparation: true,
  reward: true,
  refundPolicy: true,
  notice: true,
  applyDeadline: true,
  sessions: {
    orderBy: [{ date: "asc" as const }, { startTime: "asc" as const }],
    select: { id: true, date: true, startTime: true, endTime: true },
  },
  _count: {
    select: { applications: { where: { status: "APPLIED" as const, isTest: false } } },
  },
};

async function loadOwned(memberId: string, id: number) {
  const event = await prisma.educationEvent.findUnique({
    where: { id },
    select: { ...DETAIL_SELECT, hostMemberId: true },
  });
  // 소유권 불일치는 존재 여부를 숨기기 위해 404로 동일 응답
  if (!event || event.hostMemberId !== memberId) return null;
  return event;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getMemberUser();
  if (!session) return bad("unauthorized", 401);
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return bad("잘못된 id");

  try {
    const event = await loadOwned(session.memberId, id);
    if (!event) return bad("행사를 찾을 수 없습니다.", 404);
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error("[member/hosted-events/:id] get failed", err);
    return bad("불러오지 못했습니다.", 500);
  }
}

const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

interface SessionInput {
  date: string;
  startTime: string;
  endTime: string;
}

function parseSessions(v: unknown): SessionInput[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > 20) return null;
  const out: SessionInput[] = [];
  for (const item of v) {
    if (typeof item !== "object" || item == null) return null;
    const o = item as Record<string, unknown>;
    const date = typeof o.date === "string" ? o.date.trim() : "";
    const startTime = typeof o.startTime === "string" ? o.startTime.trim() : "";
    const endTime =
      typeof o.endTime === "string" && o.endTime.trim()
        ? o.endTime.trim()
        : startTime;
    if (!isKstYmd(date) || !TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      return null;
    }
    out.push({ date, startTime, endTime });
  }
  return out;
}

function optText(v: unknown, max: number): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

/** 안내성 필드(승인 후에도 교육자 수정 가능) — body에서 추출 */
function pickEditableAfterApproval(body: Record<string, unknown>) {
  return {
    descriptionMd: optText(body.descriptionMd, 20000),
    instructorBio: optText(body.instructorBio, 500),
    preparation: optText(body.preparation, 500),
    notice: optText(body.notice, 2000),
    eligibility: optText(body.eligibility, 500),
    reward: optText(body.reward, 500),
    streamUrl: optText(body.streamUrl, 500),
  };
}

/**
 * 포스터 URL 파싱 — 미지정(undefined)=변경 없음 / null·""=삭제 / 문자열=우리 R2 공개 URL만 허용(주입 방지).
 * 포스터는 안내성 항목이라 승인 후에도 교체·삭제 자유(Step 18, EDUCATOR_EDITABLE_AFTER_APPROVAL).
 */
function parsePosterUrl(
  body: Record<string, unknown>,
): { value?: string | null; error?: string } {
  if (body.posterUrl === undefined) return {};
  if (body.posterUrl === null || body.posterUrl === "") return { value: null };
  if (typeof body.posterUrl !== "string") return { error: "포스터 값이 올바르지 않습니다." };
  if (!isR2PublicUrl(body.posterUrl)) return { error: "허용되지 않은 이미지 주소입니다." };
  return { value: body.posterUrl };
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getMemberUser();
  if (!session) return bad("unauthorized", 401);
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return bad("잘못된 id");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  try {
    const event = await loadOwned(session.memberId, id);
    if (!event) return bad("행사를 찾을 수 없습니다.", 404);

    if (event.status === "CANCELED") {
      return bad("취소된 행사는 수정할 수 없습니다.");
    }

    // ── APPROVED: 안내성 필드만 허용, 잠긴 필드 포함 시 거부 ──
    if (event.status === "APPROVED") {
      const lockedSent = EDUCATOR_LOCKED_AFTER_APPROVAL.filter(
        (k) => body[k] !== undefined,
      );
      if (lockedSent.length > 0) {
        return bad(
          `승인된 행사에서 신청자에게 영향을 주는 항목(${lockedSent.join(", ")})은 운영자에게 문의해 주세요.`,
          403,
        );
      }
      const data: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(pickEditableAfterApproval(body))) {
        if (v !== undefined) data[k] = v;
      }
      const posterApproved = parsePosterUrl(body);
      if (posterApproved.error) return bad(posterApproved.error);
      if (posterApproved.value !== undefined) data.posterUrl = posterApproved.value;
      if (Object.keys(data).length === 0) return bad("변경할 항목이 없습니다.");
      await prisma.educationEvent.update({ where: { id }, data });
      return NextResponse.json({ ok: true, status: event.status });
    }

    // ── PENDING/REJECTED: 전 항목 수정 ──
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(pickEditableAfterApproval(body))) {
      if (v !== undefined) data[k] = v;
    }
    const posterPending = parsePosterUrl(body);
    if (posterPending.error) return bad(posterPending.error);
    if (posterPending.value !== undefined) data.posterUrl = posterPending.value;
    const title = optText(body.title, 100);
    if (title !== undefined) {
      if (!title) return bad("제목은 비울 수 없습니다.");
      data.title = title;
    }
    if (body.category !== undefined) {
      if (!["LECTURE", "WORKSHOP", "EVENT"].includes(String(body.category))) {
        return bad("분류가 올바르지 않습니다.");
      }
      data.category = body.category;
    }
    if (body.mode !== undefined) {
      if (!["OFFLINE", "ONLINE", "HYBRID"].includes(String(body.mode))) {
        return bad("진행 방식이 올바르지 않습니다.");
      }
      data.mode = body.mode;
    }
    const customLocation = optText(body.customLocation, 100);
    if (body.officeId !== undefined || customLocation !== undefined) {
      const officeId =
        body.officeId === null || body.officeId === "" || body.officeId === undefined
          ? null
          : Number(body.officeId);
      if (officeId != null) {
        if (!Number.isInteger(officeId) || officeId <= 0) return bad("회관이 올바르지 않습니다.");
        // Step 16: 교육 회관 선택지는 educationActive 기준(OTC isActive와 독립)
        const office = await prisma.office.findFirst({
          where: { id: officeId, educationActive: true },
          select: { id: true },
        });
        if (!office) return bad("회관을 찾을 수 없습니다.");
        data.officeId = officeId;
        data.customLocation = null;
      } else {
        if (!customLocation) return bad("장소(회관 선택 또는 직접 입력)를 알려주세요.");
        data.officeId = null;
        data.customLocation = customLocation;
      }
    }
    if (body.capacity !== undefined) {
      if (body.capacity === null || body.capacity === "") data.capacity = null;
      else {
        const n = Number(body.capacity);
        if (!Number.isInteger(n) || n <= 0) return bad("정원이 올바르지 않습니다.");
        data.capacity = n;
      }
    }
    if (body.feeKrw !== undefined) {
      const n = Number(body.feeKrw) || 0;
      if (!Number.isInteger(n) || n < 0 || n > 10_000_000) return bad("참가비가 올바르지 않습니다.");
      data.feeKrw = n;
    }
    for (const k of ["depositBankName", "depositAccountNo", "depositAccountHolder"] as const) {
      const v = optText(body[k], 50);
      if (v !== undefined) data[k] = v;
    }
    const instructorName = optText(body.instructorName, 50);
    if (instructorName !== undefined) data.instructorName = instructorName;
    if (body.applyDeadline !== undefined) {
      const d = optText(body.applyDeadline, 10);
      if (d == null) data.applyDeadline = null;
      else if (!isKstYmd(d)) return bad("신청 마감일이 올바르지 않습니다.");
      else data.applyDeadline = new Date(`${d}T23:59:59+09:00`);
    }

    // 세션 교체 — 비공개(PENDING/REJECTED)라 신청자 없음(공개 전) → 안전
    let sessions: SessionInput[] | null | undefined;
    if (body.sessions !== undefined) {
      sessions = parseSessions(body.sessions);
      if (!sessions) return bad("회차 일시를 확인해 주세요.");
    }

    // REJECTED 재제출 — PENDING 복귀 + 사유 비움
    if (body.resubmit === true) {
      if (event.status !== "REJECTED") return bad("반려된 행사만 재제출할 수 있습니다.");
      data.status = "PENDING";
      data.rejectReason = null;
    }

    if (Object.keys(data).length === 0 && sessions === undefined) {
      return bad("변경할 항목이 없습니다.");
    }

    await prisma.$transaction(async (tx) => {
      if (sessions) {
        await tx.eventSession.deleteMany({ where: { eventId: id } });
        await tx.eventSession.createMany({
          data: sessions.map((s) => ({ eventId: id, ...s })),
        });
      }
      if (Object.keys(data).length > 0) {
        await tx.educationEvent.update({ where: { id }, data });
      }
    });

    return NextResponse.json({
      ok: true,
      status: body.resubmit === true ? "PENDING" : event.status,
    });
  } catch (err) {
    console.error("[member/hosted-events/:id] patch failed", err);
    return bad("저장에 실패했습니다.", 500);
  }
}
