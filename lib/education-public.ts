// 교육 공개 페이지 공용 조회 — /events, /events/[slug], /events/calendar 가 재사용.
// ★ 공개 노출 조건은 항상: status=APPROVED AND isPublished=true AND isTest=false.
// 정원/결제/권한 로직 없음(표시용 카운트만). 신청 트랜잭션은 Step 3(Fable).
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { todayKst } from "@/lib/kst";
import type { EventCardData } from "@/components/education/types";

/** 공개 노출 필터 — 모든 공개 조회의 단일 기준. */
export const PUBLIC_EVENT_WHERE = {
  status: "APPROVED",
  isPublished: true,
  isTest: false,
} as const;

const CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  category: true,
  mode: true,
  posterUrl: true,
  customLocation: true,
  feeKrw: true,
  capacity: true,
  isFeatured: true,
  officeId: true,
  office: { select: { name: true } },
  sessions: {
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    select: { date: true, startTime: true, endTime: true },
  },
  // APPLIED 신청만 카운트(취소·테스트 제외) — 정원 현황 표시용.
  _count: { select: { applications: { where: { status: "APPLIED", isTest: false } } } },
} satisfies Prisma.EducationEventSelect;

type CardRow = Prisma.EducationEventGetPayload<{ select: typeof CARD_SELECT }>;

/** 대표 세션 = 가장 이른 "오늘 이후" 세션, 전부 지났으면 마지막 세션. */
function representativeSession(
  sessions: { date: string; startTime: string; endTime: string }[],
  today: string,
) {
  return sessions.find((s) => s.date >= today) ?? sessions[sessions.length - 1] ?? null;
}

function toCard(r: CardRow, today: string): EventCardData {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    mode: r.mode,
    posterUrl: r.posterUrl,
    officeId: r.officeId,
    locationName: r.office?.name ?? r.customLocation ?? null,
    feeKrw: r.feeKrw,
    capacity: r.capacity,
    applicationCount: r._count.applications,
    session: representativeSession(r.sessions, today),
    sessionCount: r.sessions.length,
    isFeatured: r.isFeatured,
  };
}

/** 공개 행사 카드 목록 — 대표 세션 오름차순(임박 먼저), 세션 없으면 뒤로. */
export async function loadPublishedEventCards(): Promise<EventCardData[]> {
  const today = todayKst();
  const rows = await prisma.educationEvent.findMany({
    where: PUBLIC_EVENT_WHERE,
    select: CARD_SELECT,
  });

  const cards = rows.map((r) => toCard(r, today));
  return cards.sort((a, b) => {
    const da = a.session?.date ?? "9999-99-99";
    const db = b.session?.date ?? "9999-99-99";
    if (da !== db) return da < db ? -1 : 1;
    const ta = a.session?.startTime ?? "99:99";
    const tb = b.session?.startTime ?? "99:99";
    if (ta !== tb) return ta < tb ? -1 : 1;
    return b.id - a.id;
  });
}

/** 활성 회관 — 필터·개설 폼 선택지. */
export async function loadActiveOffices(): Promise<{ id: number; name: string }[]> {
  return prisma.office.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
}

/** 상세 데이터 — 페이지가 소비하는 직렬화 형태(모든 안내 필드 포함). */
export interface EventDetailData {
  id: number;
  slug: string;
  title: string;
  category: string;
  mode: string;
  posterUrl: string | null;
  descriptionMd: string | null;
  instructorName: string | null;
  instructorBio: string | null;
  officeId: number | null;
  locationName: string | null;
  streamUrl: string | null;
  capacity: number | null;
  feeKrw: number;
  applicationCount: number;
  depositBankName: string | null;
  depositAccountNo: string | null;
  depositAccountHolder: string | null;
  eligibility: string | null;
  preparation: string | null;
  reward: string | null;
  refundPolicy: string | null;
  notice: string | null;
  applyDeadline: string | null; // ISO
  sessions: { id: number; date: string; startTime: string; endTime: string }[];
}

/** slug 상세 — 공개 조건 미충족 시 null(→ notFound). */
export async function loadEventDetail(
  slug: string,
): Promise<EventDetailData | null> {
  const r = await prisma.educationEvent.findFirst({
    where: { slug, ...PUBLIC_EVENT_WHERE },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      mode: true,
      posterUrl: true,
      descriptionMd: true,
      instructorName: true,
      instructorBio: true,
      officeId: true,
      office: { select: { name: true } },
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
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        select: { id: true, date: true, startTime: true, endTime: true },
      },
      _count: {
        select: { applications: { where: { status: "APPLIED", isTest: false } } },
      },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    mode: r.mode,
    posterUrl: r.posterUrl,
    descriptionMd: r.descriptionMd,
    instructorName: r.instructorName,
    instructorBio: r.instructorBio,
    officeId: r.officeId,
    locationName: r.office?.name ?? r.customLocation ?? null,
    streamUrl: r.streamUrl,
    capacity: r.capacity,
    feeKrw: r.feeKrw,
    applicationCount: r._count.applications,
    depositBankName: r.depositBankName,
    depositAccountNo: r.depositAccountNo,
    depositAccountHolder: r.depositAccountHolder,
    eligibility: r.eligibility,
    preparation: r.preparation,
    reward: r.reward,
    refundPolicy: r.refundPolicy,
    notice: r.notice,
    applyDeadline: r.applyDeadline ? r.applyDeadline.toISOString() : null,
    sessions: r.sessions,
  };
}

/** 같은 회관 다른 공개 행사(상세 하단 "이 회관에서는"). officeId 없으면 빈 배열. */
export async function loadSameOfficeEvents(
  officeId: number | null,
  excludeId: number,
  limit = 4,
): Promise<EventCardData[]> {
  if (officeId == null) return [];
  const today = todayKst();
  const rows = await prisma.educationEvent.findMany({
    where: { ...PUBLIC_EVENT_WHERE, officeId, id: { not: excludeId } },
    select: CARD_SELECT,
    take: limit,
  });
  return rows.map((r) => toCard(r, today));
}

/** 캘린더용 — from~to(YMD) 범위에 세션이 있는 공개 행사의 (세션×행사) 목록. */
export interface CalendarSessionItem {
  eventId: number;
  slug: string;
  title: string;
  category: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
}

export async function loadCalendarSessions(
  fromYmd: string,
  toYmd: string,
): Promise<CalendarSessionItem[]> {
  const rows = await prisma.educationEvent.findMany({
    where: {
      ...PUBLIC_EVENT_WHERE,
      sessions: { some: { date: { gte: fromYmd, lte: toYmd } } },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      sessions: {
        where: { date: { gte: fromYmd, lte: toYmd } },
        select: { date: true, startTime: true },
      },
    },
  });
  const items: CalendarSessionItem[] = [];
  for (const e of rows) {
    for (const s of e.sessions) {
      items.push({
        eventId: e.id,
        slug: e.slug,
        title: e.title,
        category: e.category,
        date: s.date,
        startTime: s.startTime,
      });
    }
  }
  return items.sort((a, b) =>
    a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.startTime < b.startTime ? -1 : 1,
  );
}
