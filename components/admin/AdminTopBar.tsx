"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
`;

const UserBadge = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 999px;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavLink = styled(Link)`
  font-size: 0.85rem;
  color: #6b7280;
  text-decoration: none;
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  &:hover {
    color: #111827;
    background: #f9fafb;
  }
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  &:hover {
    background: #f9fafb;
  }
`;

interface AdminTopBarProps {
  title: string;
  displayName?: string | null;
  showHubLink?: boolean;
}

export default function AdminTopBar({
  title,
  displayName,
  showHubLink = true,
}: AdminTopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <Bar>
      <Left>
        <Title>{title}</Title>
        {displayName ? <UserBadge>{displayName}</UserBadge> : null}
      </Left>
      <Right>
        {showHubLink ? <NavLink href="/admin">대시보드</NavLink> : null}
        <LogoutButton type="button" onClick={handleLogout}>
          로그아웃
        </LogoutButton>
      </Right>
    </Bar>
  );
}
