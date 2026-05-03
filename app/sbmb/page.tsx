"use client";

import styled from "styled-components";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroLookupSection from "@/components/sbmb/hero/HeroLookupSection";
import { T } from "@/lib/sbmb/tokens";

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${T.pageBg};
`;

const Anchor = styled.div`
  scroll-margin-top: 72px;
`;

const Stretch = styled.div`
  flex: 1;
  min-height: 24px;
`;

const AnchorStack = styled.section`
  width: 100%;
  max-width: ${T.maxWidth};
  margin: 0 auto;
  padding: 48px 20px 80px;
`;

export default function SbmbPage() {
  return (
    <Shell>
      <Header />
      <HeroLookupSection />
      <Stretch />
      <AnchorStack aria-hidden>
        <Anchor id="notice" />
        <Anchor id="guide" style={{ marginTop: 160 }} />
        <Anchor id="links" style={{ marginTop: 160 }} />
      </AnchorStack>
      <Footer />
    </Shell>
  );
}
