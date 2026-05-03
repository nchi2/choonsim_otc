"use client";

import HeroContent from "@/components/sbmb/hero/HeroContent";
import {
  HeroBannerInner,
  HeroBannerOuter,
} from "@/components/sbmb/hero/heroBannerFrame";

/** /sbmb 상단과 동일한 그라데이션·카피 배너(조회 카드 없음). 다른 페이지 상단에 배치. */
export default function SbmbHeroBanner() {
  return (
    <HeroBannerOuter>
      <HeroBannerInner>
        <HeroContent variant="links" />
      </HeroBannerInner>
    </HeroBannerOuter>
  );
}
