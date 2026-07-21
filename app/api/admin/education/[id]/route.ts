import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { editorFieldsFromSession } from "@/lib/admin-guard";
import { requireEducationManager } from "@/lib/education-admin-guard";
import { sendEducationDecisionEmail } from "@/lib/education-alerts";
import {
  canTransitionEducationStatus,
  isEducationEventStatus,
} from "@/lib/education-status";
import { isR2PublicUrl } from "@/lib/r2";
import { isKstYmd } from "@/lib/kst";

export const runtime = "nodejs";

// 어드민 교육 행사 상세(GET) + 관리 저장(PATCH — 승인 상태머신·편집·공개/추천 토글).

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  // Step 16: 교육 읽기(GET)에도 manageEducation 게이트(기본 전원 true — 아무도 안 막힘)
  const gate = await requireEducationManager();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  }

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "잘못된 id" }, { status: 400 });
  }

  try {
    const event = await prisma.educationEvent.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        mode: true,
        status: true,
        rejectReason: true,
        isPublished: true,
        isFeatured: true,
        isTest: true,
        posterUrl: true,
        descriptionMd: true,
        instructorName: true,
        instructorBio: true,
        officeId: true,
        office: { select: { id: true, name: true } },
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
        hostName: true,
        hostContact: true,
        hostEmail: true,
        lastEditedByName: true,
        lastEditedAt: true,
        createdAt: true,
        sessions: {
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          select: { id: true, date: true, startTime: true, endTime: true },
        },
        _count: {
          select: { applications: { where: { status: "APPLIED", isTest: false } } },
        },
      },
    });
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "행사를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/education/:id] get failed", code);
    return NextResponse.json(
      { ok: false, error: "상세를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

// ── PATCH — 승인/반려·공개/추천 토글·내용 편집. 요청에 있는 필드만 반영.
// 규칙:
//  · 반려(REJECTED) 시 rejectReason 필수. 반려하면 isPublished=false 자동(모순 방지).
//  · 승인(APPROVED) 시 isPublished=true 자동 — 단 같은 요청에 isPublished:false를
//    명시하면 그 값이 우선(승인만 하고 비공개 유지 가능). rejectReason은 비움.
//  · 공개(isPublished=true)는 최종 상태가 APPROVED일 때만 허용(승인 우회 방지).
//  · 정원을 현재 APPLIED 수 미만으로 낮추는 편집은 400(먼저 신청 정리 필요).

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function optTrimmed(v: unknown, max: number): string | null | undefined {
  if (v === undefined) return undefined; // 미변경
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

// ── Step 21: 운영자 전체 편집 확장 — Step 15에서 "운영자만 변경 가능"으로 지정한 항목 전체.
// 세션 교체 검증은 member/hosted-events 라우트와 동일 규칙(TIME_RE·isKstYmd).
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

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireEducationManager();
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: gate.error },
      { status: gate.status },
    );
  }
  const admin = gate.admin;

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return bad("잘못된 id");
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  try {
    const current = await prisma.educationEvent.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        isPublished: true,
        rejectReason: true,
        capacity: true,
        // 승인/반려 메일용 스냅샷
        title: true,
        slug: true,
        hostEmail: true,
        hostName: true,
      },
    });
    if (!current) return bad("행사를 찾을 수 없습니다.", 404);

    const data: Record<string, unknown> = {};

    // ① 상태 전환
    if (body.status !== undefined) {
      if (!isEducationEventStatus(body.status)) {
        return bad("유효하지 않은 상태값입니다.");
      }
      if (!isEducationEventStatus(current.status)) {
        return bad("현재 상태를 해석할 수 없습니다.");
      }
      if (!canTransitionEducationStatus(current.status, body.status)) {
        return bad(
          `현재 상태(${current.status})에서 ${body.status}(으)로 전환할 수 없습니다.`,
        );
      }
      data.status = body.status;
      if (body.status === "REJECTED") {
        const reason = optTrimmed(body.rejectReason, 500);
        const finalReason = reason ?? current.rejectReason;
        if (!finalReason) return bad("반려 사유를 입력해 주세요.");
        data.rejectReason = finalReason;
        data.isPublished = false; // 반려된 행사가 공개 중이면 모순 — 자동 비공개
      }
      if (body.status === "APPROVED") {
        data.rejectReason = null;
        // 승인=자동 공개 기본. 같은 요청의 명시적 isPublished가 있으면 아래 ②에서 덮어씀.
        data.isPublished = true;
      }
      if (body.status === "CANCELED") {
        // 취소(교육자 요청 처리 등) — 공개 목록에서 제외
        data.isPublished = false;
      }
    } else if (body.rejectReason !== undefined) {
      // 상태 전환 없이 사유만 수정
      const reason = optTrimmed(body.rejectReason, 500);
      if (reason !== undefined) data.rejectReason = reason;
    }

    // ② 공개/추천 토글 (명시 값이 상태 전환 기본값보다 우선)
    if (body.isPublished !== undefined) {
      if (typeof body.isPublished !== "boolean") return bad("isPublished 값이 올바르지 않습니다.");
      data.isPublished = body.isPublished;
    }
    if (body.isFeatured !== undefined) {
      if (typeof body.isFeatured !== "boolean") return bad("isFeatured 값이 올바르지 않습니다.");
      data.isFeatured = body.isFeatured;
    }

    // 공개는 승인된 행사만 — 승인 우회 방지
    const finalStatus = (data.status ?? current.status) as string;
    const finalPublished = (data.isPublished ?? current.isPublished) as boolean;
    if (finalPublished && finalStatus !== "APPROVED") {
      return bad("승인되지 않은 행사는 공개할 수 없습니다.");
    }

    // ③ 내용 편집
    const title = optTrimmed(body.title, 100);
    if (title !== undefined) {
      if (!title) return bad("제목은 비울 수 없습니다.");
      data.title = title;
    }
    const descriptionMd = optTrimmed(body.descriptionMd, 20000);
    if (descriptionMd !== undefined) data.descriptionMd = descriptionMd;
    const notice = optTrimmed(body.notice, 2000);
    if (notice !== undefined) data.notice = notice;

    // 포스터 교체·삭제(Step 18) — 우리 R2 공개 URL만 허용, null/""=삭제
    if (body.posterUrl !== undefined) {
      if (body.posterUrl === null || body.posterUrl === "") {
        data.posterUrl = null;
      } else if (typeof body.posterUrl === "string" && isR2PublicUrl(body.posterUrl)) {
        data.posterUrl = body.posterUrl;
      } else {
        return bad("허용되지 않은 이미지 주소입니다.");
      }
    }

    // ── Step 21: 운영자 전체 편집 — Step 15에서 "운영자에게 문의" 안내한 항목 전체를
    // 실제로 이 화면에서 바꿀 수 있게 확장. 교육자 쪽 잠금 정책(EDUCATOR_LOCKED_AFTER_APPROVAL)은
    // 회원 라우트에만 적용되며 여기(운영자 전용 API)는 상태 무관하게 전부 허용.
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
    const streamUrl = optTrimmed(body.streamUrl, 500);
    if (streamUrl !== undefined) data.streamUrl = streamUrl;

    const instructorName = optTrimmed(body.instructorName, 50);
    if (instructorName !== undefined) data.instructorName = instructorName;
    const instructorBio = optTrimmed(body.instructorBio, 500);
    if (instructorBio !== undefined) data.instructorBio = instructorBio;
    const eligibility = optTrimmed(body.eligibility, 500);
    if (eligibility !== undefined) data.eligibility = eligibility;
    const preparation = optTrimmed(body.preparation, 500);
    if (preparation !== undefined) data.preparation = preparation;
    const reward = optTrimmed(body.reward, 500);
    if (reward !== undefined) data.reward = reward;
    const refundPolicy = optTrimmed(body.refundPolicy, 500);
    if (refundPolicy !== undefined) data.refundPolicy = refundPolicy;

    // 장소 — 회관(educationActive 기준, Step 16) 또는 직접 입력. 둘 중 하나가 오면 함께 반영.
    const customLocation = optTrimmed(body.customLocation, 100);
    if (body.officeId !== undefined || customLocation !== undefined) {
      const officeId =
        body.officeId === null || body.officeId === "" || body.officeId === undefined
          ? null
          : Number(body.officeId);
      if (officeId != null) {
        if (!Number.isInteger(officeId) || officeId <= 0) return bad("회관이 올바르지 않습니다.");
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

    if (body.feeKrw !== undefined) {
      const n = Number(body.feeKrw) || 0;
      if (!Number.isInteger(n) || n < 0 || n > 10_000_000) return bad("참가비가 올바르지 않습니다.");
      data.feeKrw = n;
    }
    for (const k of ["depositBankName", "depositAccountNo", "depositAccountHolder"] as const) {
      const v = optTrimmed(body[k], 50);
      if (v !== undefined) data[k] = v;
    }
    if (body.applyDeadline !== undefined) {
      const d = optTrimmed(body.applyDeadline, 10);
      if (d == null) data.applyDeadline = null;
      else if (!isKstYmd(d)) return bad("신청 마감일이 올바르지 않습니다.");
      else data.applyDeadline = new Date(`${d}T23:59:59+09:00`);
    }

    // 세션 일정 — 날짜·시작·종료, 회차 추가·삭제. 운영자는 상태 무관하게 교체 가능(전체 교체 방식).
    let sessions: SessionInput[] | null | undefined;
    if (body.sessions !== undefined) {
      sessions = parseSessions(body.sessions);
      if (!sessions) return bad("회차 일시를 확인해 주세요.");
    }

    if (body.capacity !== undefined) {
      let capacity: number | null;
      if (body.capacity === null || body.capacity === "") {
        capacity = null;
      } else {
        const n = typeof body.capacity === "number" ? body.capacity : Number(body.capacity);
        if (!Number.isInteger(n) || n <= 0) return bad("정원이 올바르지 않습니다.");
        capacity = n;
      }
      if (capacity != null) {
        const applied = await prisma.eventApplication.count({
          where: { eventId: id, status: "APPLIED", isTest: false },
        });
        if (capacity < applied) {
          return bad(
            `현재 신청 ${applied}명보다 정원을 낮출 수 없습니다. 먼저 신청을 정리하세요.`,
          );
        }
      }
      data.capacity = capacity;
    }

    if (Object.keys(data).length === 0 && sessions === undefined) {
      return bad("변경할 항목이 없습니다.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (sessions) {
        await tx.eventSession.deleteMany({ where: { eventId: id } });
        await tx.eventSession.createMany({
          data: sessions.map((s) => ({ eventId: id, ...s })),
        });
      }
      if (Object.keys(data).length > 0) {
        return tx.educationEvent.update({
          where: { id },
          data: { ...data, ...editorFieldsFromSession(admin) },
          select: { id: true, status: true, isPublished: true, isFeatured: true },
        });
      }
      // 세션만 바뀐 경우에도 감사 기록(lastEdited*)은 남긴다.
      return tx.educationEvent.update({
        where: { id },
        data: editorFieldsFromSession(admin),
        select: { id: true, status: true, isPublished: true, isFeatured: true },
      });
    });

    // 교육자(hostEmail) 승인/반려 메일 — 상태 전환 성공과 무관(발송 실패는 로그만).
    if (data.status === "APPROVED" || data.status === "REJECTED") {
      try {
        await sendEducationDecisionEmail({
          decision: data.status,
          title: (data.title as string | undefined) ?? current.title,
          slug: current.slug,
          hostEmail: current.hostEmail,
          hostName: current.hostName,
          rejectReason:
            data.status === "REJECTED"
              ? ((data.rejectReason as string | null | undefined) ??
                current.rejectReason)
              : null,
        });
      } catch (alertErr) {
        console.error("[admin/education/:id] decision email failed", alertErr);
      }
    }

    return NextResponse.json({ ok: true, event: updated });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/education/:id] patch failed", id, code);
    return bad("저장에 실패했습니다.", 500);
  }
}
