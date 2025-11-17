"use client";

import Link from "next/link";
import * as S from "../styles";

const dummyNews = [
  {
    id: 1,
    title: "모빅 경제 동향 분석: 2024년 하반기 전망",
    thumbnail: null, // 나중에 실제 이미지 URL로 교체
    date: "2024.01.15",
    author: "모빅경제",
    link: "#",
  },
  {
    id: 2,
    title: "디지털 자산 시장의 새로운 변화",
    thumbnail: null,
    date: "2024.01.10",
    author: "모빅경제",
    link: "#",
  },
  {
    id: 3,
    title: "블록체인 기술의 미래",
    thumbnail: null,
    date: "2024.01.05",
    author: "모빅경제",
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
            <S.NewsCardThumbnail>
              {news.thumbnail ? (
                <img src={news.thumbnail} alt={news.title} />
              ) : (
                "썸네일"
              )}
            </S.NewsCardThumbnail>
            <S.NewsCardTitle>{news.title}</S.NewsCardTitle>
            <S.NewsCardMeta>
              {news.date} | {news.author}
            </S.NewsCardMeta>
          </S.NewsCard>
        ))}
      </S.CardGrid>
      <div style={{ textAlign: "center" }}>
        <S.SectionButton href="#">모빅경제 바로가기</S.SectionButton>
      </div>
    </S.Section>
  );
}
