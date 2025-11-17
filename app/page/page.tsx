"use client";

import PageLayout from "@/components/layouts/PageLayout";
import OTCSection from "./components/OTCSection";
import * as S from "./styles";

export default function Home() {
  return (
    <PageLayout>
      <S.Title>Choonsim 메인</S.Title>
      <OTCSection />
    </PageLayout>
  );
}
