"use client";

import { useRef } from "react";
import styled from "styled-components";
import HeroContent from "@/components/sbmb/hero/HeroContent";
import LookupCard, { type LookupCardHandle } from "@/components/sbmb/hero/LookupCard";
import { T } from "@/lib/sbmb/tokens";

const mobile = "@media (max-width: 767px)";

const Outer = styled.section`
  width: 100%;
  background: ${T.heroGradient};
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  position: relative;
`;

const Inner = styled.div`
  width: 100%;
  max-width: ${T.maxWidth};
  padding-top: 112px;
  padding-left: 20px;
  padding-right: 20px;

  ${mobile} {
    padding-top: 100px;
  }
`;

export default function HeroLookupSection() {
  const cardRef = useRef<LookupCardHandle>(null);

  const scrollToSection = (sectionId: "notice" | "apply" | "video") => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Outer>
      <Inner>
        <HeroContent
          onScrollToLookupCard={() => cardRef.current?.scrollToCard()}
          onScrollToSection={scrollToSection}
        />
      </Inner>
      <LookupCard ref={cardRef} />
    </Outer>
  );
}
