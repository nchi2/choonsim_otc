# 교육 행사 포스터 자리

행사 포스터 이미지를 여기에 넣으세요.

- **경로 컨벤션**: `public/education/{slug}.png` → DB `posterUrl`에 `/education/{slug}.png`
  - 예: `public/education/seocho-sbmb-lecture-2026-07.png`
    → `posterUrl = "/education/seocho-sbmb-lecture-2026-07.png"`
- **권장 규격**: 가로:세로 = **4:3** (예: 1200×900px) — `components/education/PosterCard.tsx`의
  `POSTER_ASPECT_W/H` 상수와 동일. 다른 비율은 중앙 크롭됩니다.
- 파일을 넣은 뒤 `prisma/seed.ts`(시드 행사) 또는 어드민 편집으로 `posterUrl`을 채우면
  카드·상세·캐러셀이 자동으로 이미지를 사용합니다. 없으면 카테고리별 디자인 폴백이 표시됩니다.
