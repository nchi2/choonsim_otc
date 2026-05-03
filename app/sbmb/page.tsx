"use client";

import styled from "styled-components";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroLookupSection from "@/components/sbmb/hero/HeroLookupSection";
import ApplySection from "@/components/sbmb/sections/ApplySection";
import LinksSection from "@/components/sbmb/sections/LinksSection";
import NoticeSection from "@/components/sbmb/sections/NoticeSection";
import RoadmapSection from "@/components/sbmb/sections/RoadmapSection";
import WalletGuideSection from "@/components/sbmb/sections/WalletGuideSection";
import { T } from "@/lib/sbmb/tokens";

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${T.pageBg};
`;

const Stretch = styled.div`
  flex: 1;
  min-height: 24px;
`;

const Lower = styled.div`
  width: 100%;
  max-width: ${T.maxWidth};
  margin: 0 auto;
  padding: 48px 20px 80px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export default function SbmbPage() {
  return (
    <Shell>
      <Header />
      <HeroLookupSection />
      <Stretch />
      <Lower>
        <NoticeSection />
        <ApplySection />
        <RoadmapSection />
        <LinksSection />
        <WalletGuideSection />
      </Lower>
      <Footer />
    </Shell>
  );
}
