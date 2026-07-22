"use client";

// 이벤트 관리 영역 상단 탭 (Step 28) — [이벤트 | 교육자 신청] 화면 전환.
// 기존 화면·API 재사용, 진입 동선만 탭으로 재배치(이전엔 헤더 버튼에 묻혀 있었음).

import Link from "next/link";
import styled from "styled-components";
import { adminColors } from "@/components/admin/ui";

const TabRow = styled.div`
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
  border-bottom: 1px solid ${adminColors.border};
`;

const TabLink = styled(Link)<{ $active: boolean }>`
  padding: 0.5rem 0.9rem;
  font-size: 0.88rem;
  font-weight: ${(p) => (p.$active ? 800 : 600)};
  color: ${(p) => (p.$active ? adminColors.primary : adminColors.textMuted)};
  text-decoration: none;
  border-bottom: 2px solid
    ${(p) => (p.$active ? adminColors.primary : "transparent")};
  margin-bottom: -1px;

  &:hover {
    color: ${adminColors.primary};
  }
`;

export function EducationTabs({ active }: { active: "events" | "educators" }) {
  return (
    <TabRow role="tablist" aria-label="이벤트 관리 영역">
      <TabLink
        href="/admin/education"
        $active={active === "events"}
        aria-current={active === "events" ? "page" : undefined}
      >
        이벤트
      </TabLink>
      <TabLink
        href="/admin/education/educators"
        $active={active === "educators"}
        aria-current={active === "educators" ? "page" : undefined}
      >
        교육자 신청
      </TabLink>
    </TabRow>
  );
}
