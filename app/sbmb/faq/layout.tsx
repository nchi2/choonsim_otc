import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문 | SBMB | Choonsim Hub",
  description:
    "SBMB 지갑 조회, 추가접수 대기, 연습 토큰(LDT) 에어드랍 등 자주 묻는 질문과 안내입니다.",
};

export default function SbmbFaqLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
