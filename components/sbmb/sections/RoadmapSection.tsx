"use client";

import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  IconAlertCircle,
  IconRefreshCw,
} from "@/components/sbmb/shared/SbmbIcons";
import {
  SbmbSectionAnchor,
  SbmbSectionCard,
} from "@/components/sbmb/shared/SectionCard";
import { getStatusStyle } from "@/lib/sbmb/statusStyles";
import { T } from "@/lib/sbmb/tokens";
import type { SbmbRoadmapItem } from "@/types/sbmb";

const Title = styled.h2`
  margin: 0 0 8px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: ${T.textPrimary};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  border-bottom: 1px solid ${T.borderLight};
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(p) => p.$color};
`;

const Label = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: ${T.textPrimary};
`;

const Badge = styled.span<{ $bg: string; $fg: string }>`
  flex-shrink: 0;
  border-radius: 9999px;
  padding: 4px 12px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 12px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
`;

const Muted = styled.p`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  color: ${T.textSecondary};
`;

const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid ${T.errorBorder};
  background: ${T.errorBg};
  color: ${T.errorMid};
  font-size: 13px;
`;

const RetryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid ${T.errorBorder};
  background: ${T.white};
  color: ${T.errorDark};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
`;

export default function RoadmapSection() {
  const [items, setItems] = useState<SbmbRoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/sbmb/roadmap");
      const json = (await res.json()) as {
        items?: SbmbRoadmapItem[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "로드맵을 불러오지 못했습니다.");
      }
      setItems(json.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SbmbSectionAnchor id="roadmap" aria-labelledby="sbmb-roadmap-heading">
      <SbmbSectionCard>
        <Title id="sbmb-roadmap-heading">전체 진행 로드맵</Title>
        {loading && <Muted>불러오는 중…</Muted>}
        {!loading && error && (
          <ErrorBox>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconAlertCircle size={18} color={T.errorDark} />
              {error}
            </span>
            <RetryBtn type="button" onClick={() => void load()}>
              <IconRefreshCw size={16} color={T.errorDark} />
              다시 시도
            </RetryBtn>
          </ErrorBox>
        )}
        {!loading && !error && items.length === 0 && (
          <Muted>등록된 로드맵 항목이 없습니다.</Muted>
        )}
        {!loading && !error && items.length > 0 && (
          <div>
            {items.map((item, idx) => {
              const st = getStatusStyle(item.status);
              return (
                <Row key={`${idx}-${item.label}`}>
                  <Left>
                    <Dot $color={st.dot} aria-hidden />
                    <Label>{item.label}</Label>
                  </Left>
                  <Badge $bg={st.bg} $fg={st.text}>
                    {item.status}
                  </Badge>
                </Row>
              );
            })}
          </div>
        )}
      </SbmbSectionCard>
    </SbmbSectionAnchor>
  );
}
