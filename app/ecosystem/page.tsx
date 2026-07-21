// /ecosystem — BTCMobick 생태계 링크 전용 페이지 (Step 19).
// 기존 EcosystemSection(app/page/components) + ecosystem-links.ts(ECOSYSTEM_GROUPS)를 재사용.
// PublicShell로 감싸 헤더·푸터·모바일 하단탭 일관 유지. 파비콘은 기존 /api/ecosystem-icon 그대로.

import type { Metadata } from "next";
import { PublicShell } from "@/components/education/PublicShell";
import EcosystemSection from "@/app/page/components/EcosystemSection";

export const metadata: Metadata = {
  title: "BTCMobick 생태계 — Choonsim Hub",
  description:
    "BTCMobick 공식·정보·거래·커뮤니티·콘텐츠 링크를 카테고리별로 한곳에서.",
};

export default function EcosystemPage() {
  return (
    <PublicShell>
      <EcosystemSection />
    </PublicShell>
  );
}
