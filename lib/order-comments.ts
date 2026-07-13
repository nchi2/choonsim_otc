// 신청 건 운영자 코멘트 — targetType 검증 + 목록 배지(코멘트 수·안읽음 수) 집계.
import { prisma } from "@/lib/prisma";

export const COMMENT_TARGET_TYPES = ["MIRACLE10", "OTC_REQUEST"] as const;
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
    if (c.authorId !== adminUserId && c.createdAt.getTime() > lastRead) {
      badge.unread += 1;
    }
    map.set(c.targetId, badge);
  }

  return map;
}
