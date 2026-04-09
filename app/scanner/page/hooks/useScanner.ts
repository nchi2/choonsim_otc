"use client";

import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { scanWallet } from "@/app/scanner/lib/rpc";
import type { Network, TokenResult } from "@/app/scanner/lib/tokens";
import { isValidAddress } from "@/app/scanner/lib/utils";
import type { ScannerNetworkFilter } from "../components/NetworkTab";

export type ScannerStatus = "idle" | "loading" | "done" | "error";

export interface UseScannerResult {
  address: string;
  status: ScannerStatus;
  results: TokenResult[];
  activeTab: ScannerNetworkFilter;
  setActiveTab: Dispatch<SetStateAction<ScannerNetworkFilter>>;
  errorMessage: string | undefined;
  handleScan: (rawAddress: string) => Promise<void>;
  filteredResults: TokenResult[];
}

export function useScanner(): UseScannerResult {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [activeTab, setActiveTab] = useState<ScannerNetworkFilter>("all");
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const handleScan = useCallback(async (rawAddress: string) => {
    const trimmed = rawAddress.trim();
    setErrorMessage(undefined);
    setResults([]);
    setAddress("");

    if (!isValidAddress(trimmed)) {
      setStatus("error");
      setErrorMessage("유효한 EVM 주소를 입력해주세요.");
      return;
    }

    setStatus("loading");
    setActiveTab("all");

    try {
      const next = await scanWallet(trimmed);
      setResults(next);
      setAddress(trimmed);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorMessage("조회 중 오류가 발생했습니다.");
    }
  }, []);

  const filteredResults = useMemo(() => {
    const positive = results.filter((r) => r.balance > 0);
    if (activeTab === "all") return positive;
    return positive.filter((r) => r.network === (activeTab as Network));
  }, [results, activeTab]);

  return {
    address,
    status,
    results,
    activeTab,
    setActiveTab,
    errorMessage,
    handleScan,
    filteredResults,
  };
}
