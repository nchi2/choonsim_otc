"use client";

import * as S from "../styles";

const dummyBlogs = [
  {
    id: 1,
    title: "위러브 모빅: 디지털 자산 투자 가이드",
    summary: "초보자를 위한 디지털 자산 투자 가이드와 유용한 팁을 제공합니다.",
    date: "2024.01.12",
    link: "#",
  },
  {
    id: 2,
    title: "유튜브: 모빅 생태계 이해하기",
    summary: "모빅 생태계의 구조와 작동 원리에 대해 쉽게 설명하는 영상입니다.",
    date: "2024.01.08",
    link: "#",
  },
  {
    id: 3,
    title: "위러브 모빅: 커뮤니티 소식",
    summary: "최근 커뮤니티에서 일어난 주요 소식과 이벤트를 공유합니다.",
    date: "2024.01.03",
    link: "#",
  },
];

export default function BlogSection() {
  return (
    <S.Section>
      <S.SectionTitle>모빅 블로그 / 유튜브</S.SectionTitle>
      <S.CardGrid>
        {dummyBlogs.map((blog) => (
          <S.NewsCard key={blog.id}>
            <S.NewsCardTitle>{blog.title}</S.NewsCardTitle>
            <S.NewsCardSummary>{blog.summary}</S.NewsCardSummary>
            <S.NewsCardDate>{blog.date}</S.NewsCardDate>
          </S.NewsCard>
        ))}
      </S.CardGrid>
      <div style={{ textAlign: "center" }}>
        <S.SectionButton href="#">자세히 보기</S.SectionButton>
      </div>
    </S.Section>
  );
}
