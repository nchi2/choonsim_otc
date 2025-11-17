"use client";

import PageLayout from "@/components/layouts/PageLayout";
import OTCSection from "./page/components/OTCSection";
import HighValueSection from "./page/components/HighValueSection";
import NewsSection from "./page/components/NewsSection";
import BlogSection from "./page/components/BlogSection";
import * as S from "./page/styles";

export default function Home() {
  return (
    <PageLayout>
      <S.Title>Choonsim 메인</S.Title>
      <OTCSection />
      <HighValueSection />
      <NewsSection />
      <BlogSection />
    </PageLayout>
  );
}
