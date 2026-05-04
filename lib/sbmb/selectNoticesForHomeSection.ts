import type { SbmbNoticeListItem } from "@/types/sbmb";

/**
 * 홈 공지 섹션: 최대 2건(데이터가 1건이면 1건만).
 * - 중요 공지가 있으면: (1) 중요 중 시트상 최신 1건, (2) 그 외 전체 중 최신 1건(중요 여부 무관, 1번과 다른 글).
 * - 중요가 없으면: 시트상 최신 2건.
 * `sheetOrder` 클수록 시트 아래쪽(최신).
 */
export function selectNoticesForHomeSection(
  items: SbmbNoticeListItem[],
): SbmbNoticeListItem[] {
  if (items.length === 0) return [];

  const byNew = [...items].sort(
    (a, b) => (b.sheetOrder ?? 0) - (a.sheetOrder ?? 0),
  );

  const importantNewestFirst = byNew.filter((i) => i.important);
  const impLatest = importantNewestFirst[0];

  if (impLatest) {
    const second = byNew.find((i) => i.slug !== impLatest.slug);
    return second ? [impLatest, second] : [impLatest];
  }

  return byNew.slice(0, Math.min(2, byNew.length));
}
