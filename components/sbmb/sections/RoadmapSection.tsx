"use client";

import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
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
        throw new Error(json.error ?? "roadmap_fetch_failed");
      }
      setItems(json.items ?? []);
    } catch (e) {
      console.error("[sbmb/roadmap] 로드맵을 가져오지 못했습니다.", e);
      setError("load_failed");
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
          <Muted>
            현재 진행 현황을 불러오는 중입니다.
            <br />
            잠시 후 다시 확인해주세요.
          </Muted>
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
