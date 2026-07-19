// 교육 공개 페이지 공용 조회 — /events, /events/[slug], /events/calendar 가 재사용.
// ★ 공개 노출 조건은 항상: status=APPROVED AND isPublished=true AND isTest=false.
// 정원/결제/권한 로직 없음(표시용 카운트만). 신청 트랜잭션은 Step 3(Fable).
import { unstable_cache } from "next/cache";
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

/**
 * URL slug 정규화 — /events/[slug]의 params.slug 처리.
 * Next.js가 넘기는 param이 퍼센트 인코딩(%ED..)인 채 도착하므로 디코딩이 필요하다.
 * (Step 17 진단: 한글 slug가 인코딩된 채 DB 조회 → 불일치 404. 원인은 정규화가 아닌 디코딩 누락.)
 * - 우리 slug 문자셋은 [a-z0-9가-힣-]로 리터럴 %가 없어 decodeURIComponent가 안전(멱등).
 * - 이미 디코딩된 param이 와도 %가 없어 no-op. 잘못된 시퀀스면 원문 유지(→ 조회 실패=404).
 * - DB는 NFC 저장이므로 NFC로 정규화(일부 클라이언트가 NFD로 보내도 매칭되게 — 방어).
 */
export function normalizePublicSlug(raw: string): string {
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    // malformed percent-encoding — 원문 유지
  }
  return s.normalize("NFC");
}

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
async function loadPublishedEventCardsUncached(): Promise<EventCardData[]> {
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

/** 캐러셀 최소 채움 개수 — 다가오는 featured가 이보다 적으면 지난 featured로 뒤를 채운다. */
export const CAROUSEL_MIN_ITEMS = 3;

/**
 * 메인 추천 캐러셀 목록 — isFeatured 중 "다가오는(일정 미정 포함)"을 앞에,
 * 그 수가 CAROUSEL_MIN_ITEMS 미만일 때만 지난(종료) featured로 뒤를 채움.
 * 다가오는 게 MIN 이상이면 지난 건 노출하지 않음. featured 0건이면 빈 배열(캐러셀 숨김).
 */
export function pickCarouselEvents(cards: EventCardData[]): EventCardData[] {
  const today = todayKst();
  const featured = cards.filter((c) => c.isFeatured);
  if (featured.length === 0) return [];
  const upcoming = featured.filter(
    (c) => c.session == null || c.session.date >= today,
  );
  if (upcoming.length >= CAROUSEL_MIN_ITEMS) return upcoming;
  const past = featured.filter(
    (c) => c.session != null && c.session.date < today,
  );
  return [...upcoming, ...past.slice(0, CAROUSEL_MIN_ITEMS - upcoming.length)];
}

/** 교육 노출 회관 — 필터·개설 폼 선택지. Step 16: educationActive 기준(OTC isActive와 독립). */
async function loadActiveOfficesUncached(): Promise<{ id: number; name: string }[]> {
  return prisma.office.findMany({
    where: { educationActive: true },
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
async function loadEventDetailUncached(
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
async function loadSameOfficeEventsUncached(
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

async function loadCalendarSessionsUncached(
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

/* ── Step 11: 공개 조회 캐시 (unstable_cache, 60s) ──
 * 페이지 ISR 전환 대신 DB 조회만 캐시 — 빌드타임 DB 의존 없이(force-dynamic 유지) Prisma 왕복·CPU 절감.
 * 인자는 캐시 키에 자동 포함. 어드민 GET은 이 lib 미사용(무영향). 공개 반영 지연 최대 60초. */

const REVALIDATE_SEC = 60;

export const loadPublishedEventCards = unstable_cache(
  loadPublishedEventCardsUncached,
  ["edu-public-cards"],
  { revalidate: REVALIDATE_SEC },
);

export const loadActiveOffices = unstable_cache(
  loadActiveOfficesUncached,
  ["edu-education-offices"], // Step 16: isActive→educationActive 전환으로 캐시 키 교체(스테일 방지)
  { revalidate: 300 }, // 회관 목록은 거의 불변 — 5분
);

export const loadEventDetail = unstable_cache(
  loadEventDetailUncached,
  ["edu-event-detail"],
  { revalidate: REVALIDATE_SEC },
);

export const loadSameOfficeEvents = unstable_cache(
  loadSameOfficeEventsUncached,
  ["edu-same-office"],
  { revalidate: REVALIDATE_SEC },
);

export const loadCalendarSessions = unstable_cache(
  loadCalendarSessionsUncached,
  ["edu-calendar-sessions"],
  { revalidate: REVALIDATE_SEC },
);
