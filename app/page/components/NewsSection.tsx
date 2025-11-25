"use client";

import { useMemo, useState } from "react";
import * as S from "../styles";

const MOBICK_ECONOMY_URL = "https://www.mobickeconomy.com/";
const PAGE_SIZE = 6;

const dummyNews = [
  {
    id: 1,
    title: "모빅 경제 동향 분석: 2024년 하반기 전망",
    date: "2024.01.15",
    author: "모빅경제",
  },
  {
    id: 2,
    title: "디지털 자산 시장의 새로운 변화",
    date: "2024.01.10",
    author: "모빅경제",
  },
  {
    id: 3,
    title: "블록체인 기술의 미래",
    date: "2024.01.05",
    author: "모빅경제",
  },
];

export default function NewsSection() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleNews = useMemo(
    () => dummyNews.slice(0, visibleCount),
    [visibleCount]
  );
  const canLoadMore = visibleNews.length < dummyNews.length;

  const handleLoadMore = () =>
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, dummyNews.length));

  return (
    <S.Section>
      <S.ContentSectionHeader>
        <S.ContentSectionTitle>모빅 뉴스 (모빅경제)</S.ContentSectionTitle>
        <S.ContentLinkButton
          href={MOBICK_ECONOMY_URL}
          target="_blank"
          rel="noreferrer"
        >
          모빅경제 링크 보기 →
        </S.ContentLinkButton>
      </S.ContentSectionHeader>

      <S.CardGrid>
        {visibleNews.map((news) => (
          <S.NewsCardLink
            key={news.id}
            href={MOBICK_ECONOMY_URL}
            target="_blank"
            rel="noreferrer"
          >
            <S.NewsCard>
              <S.NewsCardThumbnail>썸네일</S.NewsCardThumbnail>
              <S.NewsCardTitle>{news.title}</S.NewsCardTitle>
              <S.NewsCardMeta>
                {news.date} | {news.author}
              </S.NewsCardMeta>
            </S.NewsCard>
          </S.NewsCardLink>
        ))}
      </S.CardGrid>

      {canLoadMore && (
        <div style={{ textAlign: "center" }}>
          <S.ContentLoadMore onClick={handleLoadMore}>더보기</S.ContentLoadMore>
        </div>
      )}
    </S.Section>
  );
}
