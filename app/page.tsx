"use client";

import PageLayout from "@/components/layouts/PageLayout";
import OTCSection from "./page/components/OTCSection";
import HighValueSection from "./page/components/HighValueSection";
import NewsSection from "./page/components/NewsSection";
// import BlogSection from "./page/components/BlogSection";
import YouTubeSection from "./page/components/YouTubeSection";

export default function Home() {
  return (
    <PageLayout>
      <OTCSection />
      <HighValueSection />
      <NewsSection />
      <YouTubeSection />
      {/* <BlogSection /> */}
    </PageLayout>
  );
}
