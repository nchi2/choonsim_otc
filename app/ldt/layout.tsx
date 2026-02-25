import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lucem Diffundo Token (LDT) | Choonsim",
  description:
    "Lucem Diffundo Token (LDT) - Commemorative Training Token for the BTCMOBICK New Bedford Upgrade. Issued by Choonsim Team for ecosystem training and Web3 onboarding.",
  openGraph: {
    title: "Lucem Diffundo Token (LDT) | Choonsim",
    description:
      "Commemorative Training Token for the BTCMOBICK New Bedford Upgrade. Non-financial training token for educational and ecosystem onboarding purposes.",
    url: "https://choonsim.com/ldt",
    siteName: "Choonsim",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LDTLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
