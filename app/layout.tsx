import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Inter } from "next/font/google";
import StyledComponentsRegistry from "./registry";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.choonsim.com"),
  title: "Choonsim Hub",
  description:
    "춘심팀 허브 — OTC·고액권 OTC 안내, SBMB 신청 현황 등 Choonsim Hub 서비스를 이용하세요.",
  openGraph: {
    title: "Choonsim Hub",
    description:
      "춘심팀 허브 — OTC·고액권 OTC 안내, SBMB 신청 현황 등 Choonsim Hub 서비스를 이용하세요.",
    url: "https://www.choonsim.com/",
    siteName: "Choonsim Hub",
    images: [
      {
        url: "https://www.choonsim.com/og.png",
        width: 1200,
        height: 630,
        alt: "Choonsim Hub",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.variable}>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
      </body>
    </html>
  );
}
