import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isKstYmd, todayKst } from "@/lib/kst";
import { sendEducationHostApplyAlert } from "@/lib/education-alerts";
import { getMemberUser } from "@/lib/member-guard";
import { verifyTurnstile } from "@/lib/turnstile";
import { isR2PublicUrl } from "@/lib/r2";
import {
  allowEducationHost,
  clientIpOf,
} from "@/lib/education-rate-limit";

export const runtime = "nodejs";

// 행사 개설 신청 — EducationEvent(status=PENDING, isPublished=false) + EventSession 다중 생성.
// 승인/반려는 Step 4 어드민.
// slug 정책(Step 17): URL은 짧고 ASCII-safe하게 자동 생성한다(공유·복사 편의).
//   제목의 ASCII 단어만 살린 prefix + 랜덤 토큰. 한글 제목이면 날짜 prefix로 폴백.
//   ★기존 slug(시드 영문·사람이 만든 한글)는 조회 시 디코딩으로 계속 동작하므로 마이그레이션 없음.

const CATEGORIES = new Set(["LECTURE", "WORKSHOP", "EVENT"]);
const MODES = new Set(["OFFLINE", "ONLINE", "HYBRID"]);
const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function asTrimmed(v: unknown, max = 200): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
}

/** 제목 → ASCII prefix: 영숫자만 유지(한글 등은 버림), 하이픈 정리, 40자 컷. 없으면 빈 문자열. */
function asciiSlugPrefix(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const SLUG_TOKEN_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** 짧은 ASCII 랜덤 토큰(기본 6자) — slug 유일성·공유 편의. */
function randomSlugToken(len = 6): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += SLUG_TOKEN_CHARS[Math.floor(Math.random() * SLUG_TOKEN_CHARS.length)];
  }
  return s;
}

/**
 * 짧고 ASCII-safe한 유일 slug 생성.
 * - 제목에 ASCII 단어가 있으면 `<ascii>-<token>`, 아니면 `<오늘(KST)>-<token>`.
 * - 랜덤 토큰이라 충돌은 극히 드물지만, unique 확인 후 재시도.
 */
async function uniqueSlug(title: string): Promise<string> {
  const ascii = asciiSlugPrefix(title);
  const prefix = ascii || todayKst(); // "2026-07-25" 형태 폴백
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${prefix}-${randomSlugToken()}`.slice(0, 60);
    const exists = await prisma.educationEvent.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  // 사실상 도달 불가 폴백 — 더 긴 토큰
  return `${prefix}-${randomSlugToken(12)}`.slice(0, 60);
}

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
    const date = asTrimmed(o.date, 10);
    const startTime = asTrimmed(o.startTime, 5);
    const endTime = asTrimmed(o.endTime, 5) ?? startTime;
    if (!date || !isKstYmd(date)) return null;
    if (!startTime || !TIME_RE.test(startTime)) return null;
    if (!endTime || !TIME_RE.test(endTime)) return null;
    out.push({ date, startTime, endTime });
  }
  return out;
}

function parseOptionalPositiveInt(v: unknown): number | null | "invalid" {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isInteger(n) || n <= 0) return "invalid";
  return n;
}

export async function POST(request: Request) {
  const ip = clientIpOf(request);
  if (!allowEducationHost(ip)) {
    return bad("요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.", 429);
  }

  // ★ B-3 게이트: 개설은 로그인 + 교육자 승인(APPROVED) 필수.
  //   기존 무계정 개설 경로는 여기서 차단(비활성) — 아래 코드·필드는 보존, 되돌리려면 이 블록만 제거.
  const session = await getMemberUser();
  if (!session) return bad("로그인이 필요합니다.", 401);
  const hostMember = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      educatorStatus: true,
      status: true,
    },
  });
  if (!hostMember || hostMember.status !== "ACTIVE") {
    return bad("로그인이 필요합니다.", 401);
  }
  if (hostMember.educatorStatus !== "APPROVED") {
    return bad("교육자 승인 후 행사를 개설할 수 있습니다.", 403);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const title = asTrimmed(body.title, 100);
  const category = asTrimmed(body.category, 20) ?? "";
  const mode = asTrimmed(body.mode, 20) ?? "";
  // 개설자 스냅샷 — 회원 정보로 자동(요청 body의 host*는 무시. 무계정 시절 검증 코드는 비활성 보존)
  const hostName = hostMember.name;
  const hostContact = hostMember.phone ?? hostMember.email;
  const hostEmail = hostMember.email;

  if (!title) return bad("행사 제목을 입력해 주세요.");
  if (!CATEGORIES.has(category)) return bad("분류가 올바르지 않습니다.");
  if (!MODES.has(mode)) return bad("진행 방식이 올바르지 않습니다.");

  const sessions = parseSessions(body.sessions);
  if (!sessions) return bad("회차 일시를 확인해 주세요. (최소 1개, 날짜·시작 시간 필수)");

  const capacity = parseOptionalPositiveInt(body.capacity);
  if (capacity === "invalid") return bad("정원이 올바르지 않습니다.");
  const feeRaw = body.feeKrw ?? 0;
  const feeKrw = typeof feeRaw === "number" ? feeRaw : Number(feeRaw);
  if (!Number.isInteger(feeKrw) || feeKrw < 0 || feeKrw > 10_000_000) {
    return bad("참가비가 올바르지 않습니다.");
  }

  // 장소 — 회관 선택 또는 직접 입력 중 하나 필수
  const officeIdParsed = parseOptionalPositiveInt(body.officeId);
  if (officeIdParsed === "invalid") return bad("회관이 올바르지 않습니다.");
  const customLocation = asTrimmed(body.customLocation, 100);
  if (officeIdParsed == null && !customLocation) {
    return bad("장소(회관 선택 또는 직접 입력)를 알려주세요.");
  }

  const applyDeadlineRaw = asTrimmed(body.applyDeadline, 10);
  if (applyDeadlineRaw && !isKstYmd(applyDeadlineRaw)) {
    return bad("신청 마감일이 올바르지 않습니다.");
  }
  // 마감일은 그날 자정(KST)까지 유효로 저장
  const applyDeadline = applyDeadlineRaw
    ? new Date(`${applyDeadlineRaw}T23:59:59+09:00`)
    : null;

  const ts = await verifyTurnstile(asTrimmed(body.turnstileToken, 3000), ip);
  if (!ts.ok) return bad("자동입력 방지 확인에 실패했습니다. 새로고침 후 다시 시도해 주세요.");

  try {
    let officeName: string | null = null;
    if (officeIdParsed != null) {
      // Step 16: 교육 개설 회관은 educationActive 기준(OTC isActive와 독립)
      const office = await prisma.office.findFirst({
        where: { id: officeIdParsed, educationActive: true },
        select: { id: true, name: true },
      });
      if (!office) return bad("회관을 찾을 수 없습니다.");
      officeName = office.name;
    }

    // 포스터(선택) — 우리 R2 공개 URL만 허용(주입 방지). 없으면 null(공개 화면 폴백).
    const posterUrlRaw = asTrimmed(body.posterUrl, 500);
    const posterUrl =
      posterUrlRaw && isR2PublicUrl(posterUrlRaw) ? posterUrlRaw : null;

    const slug = await uniqueSlug(title);
    const row = await prisma.educationEvent.create({
      data: {
        title,
        slug,
        posterUrl,
        category: category as "LECTURE" | "WORKSHOP" | "EVENT",
        mode: mode as "OFFLINE" | "ONLINE" | "HYBRID",
        // 스트림 링크는 온라인·혼합일 때만 저장(오프라인은 무시)
        streamUrl:
          mode === "ONLINE" || mode === "HYBRID"
            ? asTrimmed(body.streamUrl, 500)
            : null,
        descriptionMd: asTrimmed(body.descriptionMd, 20000),
        instructorName: asTrimmed(body.instructorName, 50),
        instructorBio: asTrimmed(body.instructorBio, 500),
        officeId: officeIdParsed,
        customLocation: officeIdParsed == null ? customLocation : null,
        capacity: capacity,
        feeKrw,
        depositBankName: feeKrw > 0 ? asTrimmed(body.depositBankName, 50) : null,
        depositAccountNo: feeKrw > 0 ? asTrimmed(body.depositAccountNo, 50) : null,
        depositAccountHolder:
          feeKrw > 0 ? asTrimmed(body.depositAccountHolder, 50) : null,
        eligibility: asTrimmed(body.eligibility, 500),
        preparation: asTrimmed(body.preparation, 500),
        reward: asTrimmed(body.reward, 500),
        refundPolicy: asTrimmed(body.refundPolicy, 500),
        notice: asTrimmed(body.notice, 2000),
        applyDeadline,
        status: "PENDING",
        isPublished: false,
        isFeatured: false,
        isTest: false,
        hostName,
        hostContact,
        hostEmail,
        hostMemberId: hostMember.id, // ★ 교육자(회원) 연결
        sessions: { create: sessions },
      },
      select: { id: true, slug: true, createdAt: true },
    });

    // 운영자 알림 — 발송 실패해도 접수는 성공 유지.
    try {
      await sendEducationHostApplyAlert({
        eventId: row.id,
        title,
        category,
        instructorName: asTrimmed(body.instructorName, 50),
        locationName: officeName ?? customLocation,
        sessions,
        hostName,
        createdAt: row.createdAt,
      });
    } catch (alertErr) {
      console.error("[education/host] alert failed", alertErr);
    }

    return NextResponse.json({ ok: true, id: row.id, slug: row.slug });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[education/host] failed", code);
    return bad("개설 신청 접수에 실패했습니다.", 500);
  }
}
