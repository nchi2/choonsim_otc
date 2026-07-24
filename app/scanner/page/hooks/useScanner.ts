"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { scanChain } from "@/app/scanner/lib/rpc";
import {
  SCANNER_NETWORK_ORDER,
  SCANNER_TOKENS,
  type Network,
  type TokenResult,
} from "@/app/scanner/lib/tokens";
import { isValidAddress } from "@/app/scanner/lib/utils";
import type { ScannerNetworkFilter } from "../components/NetworkTab";

export type ScannerStatus = "idle" | "loading" | "done" | "error";
/** 체인별 진행 상태 — 점진 표시·재시도용 */
export type ChainStatus = "loading" | "done" | "timeout" | "error";

/** 한 체인이 이 시간 내 응답하지 않으면 타임아웃 처리(나머지 체인은 계속 표시). */
const PER_CHAIN_TIMEOUT_MS = 3500;

const NETWORKS = SCANNER_NETWORK_ORDER;

function tokenKey(t: { symbol: string; network: string; address: string }) {
  return `${t.symbol}-${t.network}-${t.address}`;
}

function initialChainStatus(value: ChainStatus): Record<Network, ChainStatus> {
  return NETWORKS.reduce(
    (acc, n) => {
      acc[n] = value;
      return acc;
    },
    {} as Record<Network, ChainStatus>,
  );
}

export interface UseScannerResult {
  address: string;
  scannedAddress: string;
  status: ScannerStatus;
  results: TokenResult[];
  chainStatus: Record<Network, ChainStatus>;
  activeTab: ScannerNetworkFilter;
  setActiveTab: Dispatch<SetStateAction<ScannerNetworkFilter>>;
  errorMessage: string | undefined;
  handleScan: (rawAddress: string) => void;
  retryChain: (network: Network) => void;
  filteredResults: TokenResult[];
}

export function useScanner(): UseScannerResult {
  const [address, setAddress] = useState("");
  const [scannedAddress, setScannedAddress] = useState("");
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [chainStatus, setChainStatus] = useState<Record<Network, ChainStatus>>(
    initialChainStatus("done"),
  );
  const [activeTab, setActiveTab] = useState<ScannerNetworkFilter>("all");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  // 진행 중인 스캔 세대 — 새 스캔이 시작되면 이전 스캔의 지연 응답을 무시한다.
  const genRef = useRef(0);
  // 토큰키 → 결과 누적(체인별로 도착하는 대로 병합)
  const resultMapRef = useRef<Map<string, TokenResult>>(new Map());

  // 누적 맵 → SCANNER_TOKENS 순서 배열로 반영
  const flushResults = useCallback(() => {
    const map = resultMapRef.current;
    setResults(
      SCANNER_TOKENS.map((t) => map.get(tokenKey(t))).filter(
        (r): r is TokenResult => r != null,
      ),
    );
  }, []);

  // 모든 체인이 종료(loading 아님)면 overall status 를 done 으로.
  const settleOverall = useCallback(() => {
    setChainStatus((prev) => {
      const anyLoading = NETWORKS.some((n) => prev[n] === "loading");
      if (!anyLoading) setStatus("done");
      return prev;
    });
  }, []);

  // 한 체인 스캔 실행 — 타임아웃/취소 포함. gen 으로 stale 응답 방지.
  const runChain = useCallback(
    (network: Network, wallet: string, gen: number) => {
      const ctrl = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        ctrl.abort();
      }, PER_CHAIN_TIMEOUT_MS);

      scanChain(network, wallet, ctrl.signal)
        .then((list) => {
          if (gen !== genRef.current) return;
          // 타임아웃으로 중단된 경우 scanChain은 (예외 없이) 0잔고로 resolve될 수 있으므로
          // abort 여부를 직접 확인해 "timeout"으로 구분한다(나머지 체인은 그대로 표시).
          if (timedOut || ctrl.signal.aborted) {
            setChainStatus((prev) => ({ ...prev, [network]: "timeout" }));
            return;
          }
          for (const r of list) resultMapRef.current.set(tokenKey(r), r);
          flushResults();
          setChainStatus((prev) => ({ ...prev, [network]: "done" }));
        })
        .catch(() => {
          if (gen !== genRef.current) return;
          setChainStatus((prev) => ({
            ...prev,
            [network]: timedOut || ctrl.signal.aborted ? "timeout" : "error",
          }));
        })
        .finally(() => {
          clearTimeout(timer);
          if (gen === genRef.current) settleOverall();
        });
    },
    [flushResults, settleOverall],
  );

  const handleScan = useCallback(
    (rawAddress: string) => {
      const trimmed = rawAddress.trim();
      setErrorMessage(undefined);

      if (!isValidAddress(trimmed)) {
        genRef.current += 1;
        resultMapRef.current = new Map();
        setResults([]);
        setAddress("");
        setStatus("error");
        setErrorMessage("유효한 EVM 주소를 입력해주세요.");
        return;
      }

      const gen = genRef.current + 1;
      genRef.current = gen;
      resultMapRef.current = new Map();
      setResults([]);
      setAddress(trimmed);
      setScannedAddress(trimmed);
      setActiveTab("all");
      setChainStatus(initialChainStatus("loading"));
      setStatus("loading");

      for (const net of NETWORKS) runChain(net, trimmed, gen);
    },
    [runChain],
  );

  // 특정 체인만 재시도(타임아웃·실패 시). 다른 체인 결과는 유지.
  const retryChain = useCallback(
    (network: Network) => {
      const wallet = scannedAddress;
      if (!isValidAddress(wallet)) return;
      // 이 체인의 기존 결과 제거
      for (const t of SCANNER_TOKENS) {
        if (t.network === network) resultMapRef.current.delete(tokenKey(t));
      }
      flushResults();
      setChainStatus((prev) => ({ ...prev, [network]: "loading" }));
      setStatus("loading");
      runChain(network, wallet, genRef.current);
    },
    [scannedAddress, flushResults, runChain],
  );

  const filteredResults = useMemo(() => {
    const positive = results.filter((r) => r.balance > 0);
    if (activeTab === "all") return positive;
    return positive.filter((r) => r.network === (activeTab as Network));
  }, [results, activeTab]);

  return {
    address,
    scannedAddress,
    status,
    results,
    chainStatus,
    activeTab,
    setActiveTab,
    errorMessage,
    handleScan,
    retryChain,
    filteredResults,
  };
}
