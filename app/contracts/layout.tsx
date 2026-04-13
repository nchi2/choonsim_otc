import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Token contracts & addresses | Choonsim",
  description:
    "ERC-20 contract addresses by chain (Ethereum, Base, BNB Chain). Copy addresses or add tokens in your wallet app browser via wallet_watchAsset—no wallet connect or signing.",
  openGraph: {
    title: "Token contracts & addresses | Choonsim",
    description:
      "SBMB, LDT, PRR, MOVL, WBMB, MOVN and more—per-chain addresses and explorer links.",
    url: "https://choonsim.com/contracts",
    siteName: "Choonsim",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
