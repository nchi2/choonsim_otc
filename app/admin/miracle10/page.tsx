import { redirect } from "next/navigation";

// 구 목록 경로 — 통합 신청 화면으로 이동 (기존 링크·북마크 호환).
// 목록 렌더는 components/admin/requests/Miracle10List.tsx 한 곳뿐 (복제 금지).
// 상세(/admin/miracle10/[id])는 그대로 유지.
export default async function Miracle10ListRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? `&tab=${encodeURIComponent(sp.tab)}` : "";
  redirect(`/admin/requests?type=miracle10${tab}`);
}
