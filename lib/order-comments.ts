// 신청 건 운영자 코멘트 — targetType 검증 + 목록 배지(코멘트 수·안읽음 수) 집계.
import { prisma } from "@/lib/prisma";

export const COMMENT_TARGET_TYPES = [
  "MIRACLE10",
  "OTC_REQUEST",
  "EDUCATION_EVENT",
] as const;
export type CommentTargetType = (typeof COMMENT_TARGET_TYPES)[number];

export function isCommentTargetType(v: unknown): v is CommentTargetType {
  return (
    typeof v === "string" &&
    (COMMENT_TARGET_TYPES as readonly string[]).includes(v)
  );
}

export interface CommentBadge {
  /** 전체 코멘트 수 */
  count: number;
  /** 내가 아직 안 본 코멘트 수 (내가 쓴 코멘트 제외) */
  unread: number;
}

/**
 * 안읽음 판정 단일 규칙 — unread = lastReadAt 이후 생성 ∧ 남의 코멘트.
 * getCommentBadges(목록 배지)와 getGlobalUnreadCount(전역 합계)가 공유한다.
 * 규칙 변경 시 여기 한 곳만 고칠 것.
 */
function isUnreadComment(
  c: { createdAt: Date; authorId: number | null },
  lastReadAtMs: number,
  adminUserId: number,
): boolean {
  return c.authorId !== adminUserId && c.createdAt.getTime() > lastReadAtMs;
}

/**
 * 목록용 배지 집계 — 신청 id별 {count, unread}.
 * unread = lastReadAt 이후 생성된 남의 코멘트 수 (읽음 기록 없으면 전부).
 */
export async function getCommentBadges(
  adminUserId: number,
  targetType: CommentTargetType,
  targetIds: number[],
): Promise<Map<number, CommentBadge>> {
  const map = new Map<number, CommentBadge>();
  if (targetIds.length === 0) return map;

  const [comments, reads] = await Promise.all([
    prisma.orderComment.findMany({
      where: { targetType, targetId: { in: targetIds } },
      select: { targetId: true, createdAt: true, authorId: true },
    }),
    prisma.commentReadState.findMany({
      where: { adminUserId, targetType, targetId: { in: targetIds } },
      select: { targetId: true, lastReadAt: true },
    }),
  ]);

  const lastReadByTarget = new Map(
    reads.map((r) => [r.targetId, r.lastReadAt.getTime()]),
  );

  for (const c of comments) {
    const badge = map.get(c.targetId) ?? { count: 0, unread: 0 };
    badge.count += 1;
    const lastRead = lastReadByTarget.get(c.targetId) ?? 0;
    if (isUnreadComment(c, lastRead, adminUserId)) {
      badge.unread += 1;
    }
    map.set(c.targetId, badge);
  }

  return map;
}

export interface CommentItem {
  id: number;
  createdAt: Date;
  editedAt: Date | null;
  authorId: number | null;
  authorName: string;
  body: string;
}

/** 대상 건의 코멘트 목록 + 내 안읽음 수 (읽음 처리 전 기준). */
export async function getCommentsForTarget(
  adminUserId: number,
  targetType: CommentTargetType,
  targetId: number,
): Promise<{ comments: CommentItem[]; unreadCount: number }> {
  const [comments, read] = await Promise.all([
    prisma.orderComment.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        editedAt: true,
        authorId: true,
        authorName: true,
        body: true,
      },
    }),
    prisma.commentReadState.findUnique({
      where: {
        adminUserId_targetType_targetId: { adminUserId, targetType, targetId },
      },
      select: { lastReadAt: true },
    }),
  ]);
  const lastReadMs = read?.lastReadAt.getTime() ?? 0;
  const unreadCount = comments.filter((c) =>
    isUnreadComment(c, lastReadMs, adminUserId),
  ).length;
  return { comments, unreadCount };
}

export interface UnreadTarget {
  targetType: CommentTargetType;
  targetId: number;
  /** 이 건의 내 안읽음 코멘트 수 */
  unread: number;
  /** 마지막 코멘트(전체 기준) 미리보기·작성자·시각 */
  lastBody: string;
  lastAuthorName: string;
  lastCreatedAt: Date;
}

/**
 * 내 안읽음 코멘트가 있는 신청 목록 — 헤더 벨 드롭다운용 (읽기 전용).
 * getGlobalUnreadCount와 동일 판정 규칙(isUnreadComment) 재사용.
 * 신청명(이름)은 라우트에서 붙인다(여기선 targetType/targetId까지만).
 */
export async function getUnreadCommentTargets(
  adminUserId: number,
): Promise<UnreadTarget[]> {
  const [comments, reads] = await Promise.all([
    prisma.orderComment.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        targetType: true,
        targetId: true,
        createdAt: true,
        authorId: true,
        authorName: true,
        body: true,
      },
    }),
    prisma.commentReadState.findMany({
      where: { adminUserId },
      select: { targetType: true, targetId: true, lastReadAt: true },
    }),
  ]);

  const lastReadByKey = new Map(
    reads.map((r) => [`${r.targetType}\t${r.targetId}`, r.lastReadAt.getTime()]),
  );

  const byKey = new Map<string, UnreadTarget & { key: string }>();
  for (const c of comments) {
    const key = `${c.targetType}\t${c.targetId}`;
    const lastRead = lastReadByKey.get(key) ?? 0;
    // 마지막 코멘트 정보는 남의 것/내 것 무관하게 최신으로 갱신 (오름차순 순회 → 마지막이 최신)
    const existing = byKey.get(key);
    const base =
      existing ??
      ({
        key,
        targetType: c.targetType as CommentTargetType,
        targetId: c.targetId,
        unread: 0,
        lastBody: "",
        lastAuthorName: "",
        lastCreatedAt: c.createdAt,
      } as UnreadTarget & { key: string });
    base.lastBody = c.body;
    base.lastAuthorName = c.authorName;
    base.lastCreatedAt = c.createdAt;
    if (isUnreadComment(c, lastRead, adminUserId)) base.unread += 1;
    byKey.set(key, base);
  }

  return [...byKey.values()]
    .filter((t) => t.unread > 0)
    .sort((a, b) => b.lastCreatedAt.getTime() - a.lastCreatedAt.getTime())
    .map(({ key: _key, ...t }) => t);
}

/** 읽음 처리 — 지금 시점까지 읽은 것으로 기록 (상세 열람·코멘트 작성 시). */
export async function markCommentsRead(
  adminUserId: number,
  targetType: CommentTargetType,
  targetId: number,
): Promise<void> {
  const now = new Date();
  await prisma.commentReadState.upsert({
    where: {
      adminUserId_targetType_targetId: { adminUserId, targetType, targetId },
    },
    update: { lastReadAt: now },
    create: { adminUserId, targetType, targetId, lastReadAt: now },
  });
}

/**
 * 내 전역 안읽음 코멘트 총합 (모든 신청 종류 합산) — 헤더 벨·배지용.
 * Prisma 쿼리 2회(병렬) + 공용 판정 규칙. 데이터 규모(수십 건)상 충분,
 * 커지면 그때 집계 쿼리로 교체.
 */
export async function getGlobalUnreadCount(
  adminUserId: number,
): Promise<number> {
  const [comments, reads] = await Promise.all([
    prisma.orderComment.findMany({
      where: { NOT: { authorId: adminUserId } },
      select: {
        targetType: true,
        targetId: true,
        createdAt: true,
        authorId: true,
      },
    }),
    prisma.commentReadState.findMany({
      where: { adminUserId },
      select: { targetType: true, targetId: true, lastReadAt: true },
    }),
  ]);

  const lastReadByKey = new Map(
    reads.map((r) => [
      `${r.targetType}\t${r.targetId}`,
      r.lastReadAt.getTime(),
    ]),
  );

  let unread = 0;
  for (const c of comments) {
    const lastRead =
      lastReadByKey.get(`${c.targetType}\t${c.targetId}`) ?? 0;
    if (isUnreadComment(c, lastRead, adminUserId)) unread += 1;
  }
  return unread;
}
