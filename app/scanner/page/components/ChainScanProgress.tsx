"use client";

// 체인별 진행 표시(점진 렌더) — 조회 중인 체인은 스피너, 지연/실패는 재시도 버튼.
// 완료된 체인은 여기서 감추고 결과(토큰 행)로 대체된다. 색은 globals.css의 네트워크 CSS 변수 재사용.

import styled, { keyframes } from "styled-components";
import {
  SCANNER_NETWORK_LABEL,
  SCANNER_NETWORK_ORDER,
  type Network,
} from "@/app/scanner/lib/tokens";
import type { ChainStatus } from "../hooks/useScanner";

const NET_VAR: Record<Network, string> = {
  eth: "var(--scanner-native-eth)",
  base: "var(--scanner-native-base)",
  bsc: "var(--scanner-native-bsc)",
};

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.75rem 0;
`;

const Row = styled.div<{ $net: Network }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, ${(p) => NET_VAR[p.$net]} 26%, #ffffff);
  background: color-mix(in srgb, ${(p) => NET_VAR[p.$net]} 6%, #ffffff);
  font-size: 0.85rem;
`;

const Dot = styled.span<{ $net: Network }>`
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(p) => NET_VAR[p.$net]};
`;

const Spinner = styled.span<{ $net: Network }>`
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, ${(p) => NET_VAR[p.$net]} 30%, #ffffff);
  border-top-color: ${(p) => NET_VAR[p.$net]};
  animation: ${spin} 0.7s linear infinite;
`;

const Label = styled.span`
  font-weight: 700;
  color: #111827;
`;

const StateText = styled.span`
  color: #6b7280;
  flex: 1;
`;

const RetryBtn = styled.button<{ $net: Network }>`
  flex-shrink: 0;
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  border: 1px solid ${(p) => NET_VAR[p.$net]};
  background: #ffffff;
  color: ${(p) => NET_VAR[p.$net]};
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, ${(p) => NET_VAR[p.$net]} 12%, #ffffff);
  }
`;

export interface ChainScanProgressProps {
  chainStatus: Record<Network, ChainStatus>;
  onRetry: (network: Network) => void;
}

const STATE_LABEL: Record<Exclude<ChainStatus, "done">, string> = {
  loading: "잔고 조회 중…",
  timeout: "응답이 지연됩니다",
  error: "조회에 실패했습니다",
};

export function ChainScanProgress({
  chainStatus,
  onRetry,
}: ChainScanProgressProps) {
  // 완료(done)된 체인은 결과로 대체되므로 감춘다. 나머지(loading/timeout/error)만 표시.
  const visible = SCANNER_NETWORK_ORDER.filter(
    (n) => chainStatus[n] !== "done",
  );
  if (visible.length === 0) return null;

  return (
    <List role="status" aria-live="polite">
      {visible.map((net) => {
        const st = chainStatus[net] as Exclude<ChainStatus, "done">;
        const failed = st === "timeout" || st === "error";
        return (
          <Row key={net} $net={net}>
            {st === "loading" ? (
              <Spinner $net={net} aria-hidden />
            ) : (
              <Dot $net={net} aria-hidden />
            )}
            <Label>{SCANNER_NETWORK_LABEL[net]}</Label>
            <StateText>{STATE_LABEL[st]}</StateText>
            {failed ? (
              <RetryBtn
                type="button"
                $net={net}
                onClick={() => onRetry(net)}
              >
                다시 시도
              </RetryBtn>
            ) : null}
          </Row>
        );
      })}
    </List>
  );
}
