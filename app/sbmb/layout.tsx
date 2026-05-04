import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SBMB 신청 현황 | Choonsim Hub",
  description:
    "춘심팀 SBMB 참여자 신청 현황 조회. 지갑 배부 현황, 에어드랍 상태, 진행 로드맵을 확인하세요.",
  openGraph: {
    title: "SBMB 신청 현황 | Choonsim Hub",
    description:
      "춘심팀 SBMB 참여자 신청 현황 조회. 지갑 배부 현황, 에어드랍 상태, 진행 로드맵을 확인하세요.",
    url: "https://www.choonsim.com/sbmb",
    siteName: "Choonsim Hub",
    images: [
      {
        url: "https://www.choonsim.com/og-sbmb.png",
        width: 1200,
        height: 630,
        alt: "SBMB 신청 현황",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function SbmbLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
