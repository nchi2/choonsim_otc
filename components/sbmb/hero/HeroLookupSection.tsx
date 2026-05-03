"use client";

import { useRef } from "react";
import HeroContent from "@/components/sbmb/hero/HeroContent";
import LookupCard, { type LookupCardHandle } from "@/components/sbmb/hero/LookupCard";
import {
  HeroBannerInner,
  HeroBannerOuter,
} from "@/components/sbmb/hero/heroBannerFrame";

export default function HeroLookupSection() {
  const cardRef = useRef<LookupCardHandle>(null);

  const scrollToSection = (sectionId: "notice" | "apply" | "guide") => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <HeroBannerOuter>
      <HeroBannerInner>
        <HeroContent
          variant="interactive"
          onScrollToLookupCard={() => cardRef.current?.scrollToCard()}
          onScrollToSection={scrollToSection}
        />
      </HeroBannerInner>
      <LookupCard ref={cardRef} />
    </HeroBannerOuter>
  );
}
