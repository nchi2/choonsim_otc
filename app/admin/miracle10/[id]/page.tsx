"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  MIRACLE10_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  type Miracle10Status,
} from "@/lib/miracle10-status";

const Page = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
`;

const BackLink = styled(Link)`
  font-size: 0.875rem;
  color: #6b7280;
  text-decoration: none;
  &:hover {
    color: #111827;
  }
`;

const Title = styled.h1`
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0.75rem 0 1.25rem;
  color: #111827;
`;

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.75rem;
`;

const Field = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-top: 1px solid #f5f5f5;
  font-size: 0.9rem;
  &:first-of-type {
    border-top: none;
  }
`;

const Key = styled.span`
  color: #6b7280;
`;

const Val = styled.span`
  color: #111827;
  font-weight: 500;
  word-break: break-all;
`;

const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: ${(p) => p.$color};
`;

const StatusButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StatusButton = styled.button<{ $active: boolean; $color: string }>`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1.5px solid ${(p) => p.$color};
  background: ${(p) => (p.$active ? p.$color : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : p.$color)};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Empty = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

interface Detail {
  id: number;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: string | null;
  lastEditedByName: string | null;
  lastEditedAt: string | null;
  status: Miracle10Status;
  quantity: number;
  asset: string | null;
  settle: string;
  contactTimePref: string | null;
  visitType: string | null;
  visitDate: string | null;
  visitTimeSlot: string | null;
  needUsdt: string | null;
  needBmb: string | null;
  needFaceAuth: string | null;
  isSbmbMember: boolean;
  memo: string | null;
  agreePrivacy: boolean;
  agreeRisk: boolean;
  agreeP2p: boolean;
  customer: {
    id: number;
    name: string;
    contact: string;
    verifiedAt: string | null;
    createdAt: string;
  };
}

export default function Miracle10DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/miracle10/${id}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "불러오지 못했습니다.");
      }
      setData(json.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (status: Miracle10Status) => {
    if (!data || data.status === status || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/miracle10/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "상태 변경 실패");
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Page><Empty>불러오는 중...</Empty></Page>;
  if (error) return <Page><Empty style={{ color: "#dc2626" }}>{error}</Empty></Page>;
  if (!data) return null;

  return (
    <Page>
      <BackLink href="/admin/miracle10">← 목록으로</BackLink>
      <Title>
        신청 #{data.id}{" "}
        <Badge $color={STATUS_COLORS[data.status]}>
          {STATUS_LABELS[data.status]}
        </Badge>
      </Title>

      <Card>
        <SectionTitle>상태 변경</SectionTitle>
        <StatusButtons>
          {MIRACLE10_STATUSES.map((s) => (
            <StatusButton
              key={s}
              $active={data.status === s}
              $color={STATUS_COLORS[s]}
              disabled={saving || data.status === s}
              onClick={() => changeStatus(s)}
            >
              {STATUS_LABELS[s]}
            </StatusButton>
          ))}
        </StatusButtons>
      </Card>

      <Card>
        <SectionTitle>신청인</SectionTitle>
        <Field>
          <Key>이름</Key>
          <Val>{data.customer.name}</Val>
        </Field>
        <Field>
          <Key>연락처</Key>
          <Val>{data.customer.contact}</Val>
        </Field>
        <Field>
          <Key>SBMB 회원</Key>
          <Val>{data.isSbmbMember ? "예" : "아니오"}</Val>
        </Field>
        <Field>
          <Key>면대면 인증</Key>
          <Val>
            {data.customer.verifiedAt
              ? new Date(data.customer.verifiedAt).toLocaleString("ko-KR")
              : "미완료"}
          </Val>
        </Field>
      </Card>

      <Card>
        <SectionTitle>신청 내용</SectionTitle>
        <Field>
          <Key>수량</Key>
          <Val>{data.quantity}모 ({data.asset ?? "BMB"})</Val>
        </Field>
        <Field>
          <Key>연락 선호시간</Key>
          <Val>{data.contactTimePref || "-"}</Val>
        </Field>
        <Field>
          <Key>방문 방식</Key>
          <Val>{data.visitType || "-"}</Val>
        </Field>
        <Field>
          <Key>방문 희망일</Key>
          <Val>{data.visitDate || "-"}</Val>
        </Field>
        <Field>
          <Key>방문 시간대</Key>
          <Val>{data.visitTimeSlot || "-"}</Val>
        </Field>
        <Field>
          <Key>메모</Key>
          <Val>{data.memo || "-"}</Val>
        </Field>
      </Card>

      <Card>
        <SectionTitle>사전 파악</SectionTitle>
        <Field>
          <Key>USDT 필요</Key>
          <Val>{data.needUsdt || "-"}</Val>
        </Field>
        <Field>
          <Key>BMB 필요</Key>
          <Val>{data.needBmb || "-"}</Val>
        </Field>
        <Field>
          <Key>면대면 인증 필요</Key>
          <Val>{data.needFaceAuth || "-"}</Val>
        </Field>
      </Card>

      <Card>
        <SectionTitle>동의 / 접수</SectionTitle>
        <Field>
          <Key>개인정보 동의</Key>
          <Val>{data.agreePrivacy ? "동의" : "미동의"}</Val>
        </Field>
        <Field>
          <Key>리스크 고지 동의</Key>
          <Val>{data.agreeRisk ? "동의" : "미동의"}</Val>
        </Field>
        <Field>
          <Key>P2P 동의</Key>
          <Val>{data.agreeP2p ? "동의" : "미동의"}</Val>
        </Field>
        <Field>
          <Key>접수일시</Key>
          <Val>{new Date(data.createdAt).toLocaleString("ko-KR")}</Val>
        </Field>
        <Field>
          <Key>최근 변경</Key>
          <Val>{new Date(data.updatedAt).toLocaleString("ko-KR")}</Val>
        </Field>
        <Field>
          <Key>최종 수정</Key>
          <Val>
            {data.lastEditedByName && data.lastEditedAt
              ? `${data.lastEditedByName} · ${new Date(data.lastEditedAt).toLocaleString("ko-KR")}`
              : "-"}
          </Val>
        </Field>
      </Card>
    </Page>
  );
}
