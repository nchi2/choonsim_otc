"use client";

import Link from "next/link";
import * as S from "../styles";

const dummyNews = [
  {
    id: 1,
    title: "모빅 경제 동향 분석: 2024년 하반기 전망",
    summary: "최근 모빅 경제의 주요 동향과 하반기 전망에 대해 전문가들이 분석한 내용을 공유합니다.",
    date: "2024.01.15",
    link: "#",
  },
  {
    id: 2,
    title: "디지털 자산 시장의 새로운 변화",
    summary: "디지털 자산 시장에서 나타나는 새로운 트렌드와 변화에 대해 살펴봅니다.",
    date: "2024.01.10",
    link: "#",
  },
  {
    id: 3,
    title: "블록체인 기술의 미래",
    summary: "블록체인 기술이 가져올 미래의 변화와 가능성에 대해 탐구합니다.",
    date: "2024.01.05",
    link: "#",
  },
];

export default function NewsSection() {
  return (
    <S.Section>
      <S.SectionTitle>모빅 뉴스 (모빅경제)</S.SectionTitle>
      <S.CardGrid>
        {dummyNews.map((news) => (
          <S.NewsCard key={news.id}>
            <S.NewsCardTitle>{news.title}</S.NewsCardTitle>
            <S.NewsCardSummary>{news.summary}</S.NewsCardSummary>
            <S.NewsCardDate>{news.date}</S.NewsCardDate>
          </S.NewsCard>
        ))}
      </S.CardGrid>
      <div style={{ textAlign: "center" }}>
        <S.SectionButton href="#">모빅경제 바로가기</S.SectionButton>
      </div>
    </S.Section>
  );
}



