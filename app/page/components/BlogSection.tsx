"use client";

import * as S from "../styles";

const dummyBlogs = [
  {
    id: 1,
    title: "위러브 모빅: 디지털 자산 투자 가이드",
    thumbnail: null,
    date: "2024.01.12",
    author: "위러브 모빅",
    link: "#",
  },
  {
    id: 2,
    title: "유튜브: 모빅 생태계 이해하기",
    thumbnail: null,
    date: "2024.01.08",
    author: "모빅 채널",
    link: "#",
  },
  {
    id: 3,
    title: "위러브 모빅: 커뮤니티 소식",
    thumbnail: null,
    date: "2024.01.03",
    author: "위러브 모빅",
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
            <S.NewsCardThumbnail>
              {blog.thumbnail ? (
                <img src={blog.thumbnail} alt={blog.title} />
              ) : (
                "썸네일"
              )}
            </S.NewsCardThumbnail>
            <S.NewsCardTitle>{blog.title}</S.NewsCardTitle>
            <S.NewsCardMeta>
              {blog.date} | {blog.author}
            </S.NewsCardMeta>
          </S.NewsCard>
        ))}
      </S.CardGrid>
      <div style={{ textAlign: "center" }}>
        <S.SectionButton href="#">자세히 보기</S.SectionButton>
      </div>
    </S.Section>
  );
}
