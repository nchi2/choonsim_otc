// 메인 — "교육/이벤트 + OTC" 중심 재편 (Step 6).
// 서버에서 공개 행사(APPROVED∧isPublished∧!isTest)를 조회해 HomeClient에 전달.
// 기존 섹션 컴포넌트(OTCSection·HighValueSection·EcosystemSection)는 삭제하지 않고 보존 —
// SBMB·링크모음은 PublicShell의 ☰메뉴·푸터로 이동, 유튜브만 본문 하단 유지.
// (이전 조립: PageLayout + OTCSection/HighValueSection/YouTubeSection/EcosystemSection)

import { loadPublishedEventCards } from "@/lib/education-public";
import { HomeClient } from "./page/HomeClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const events = await loadPublishedEventCards();
  return <HomeClient events={events} />;
}
