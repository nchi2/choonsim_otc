"use client";

import PageLayout from "@/components/layouts/PageLayout";
import OTCSection from "./components/OTCSection";
import HighValueSection from "./components/HighValueSection";
import NewsSection from "./components/NewsSection";
import BlogSection from "./components/BlogSection";
import * as S from "./styles";

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
