"use client";

import * as S from "../styles";

export type ScanMode = "single" | "continuous";

export interface ScanModeToggleProps {
  mode: ScanMode;
  onChange: (mode: ScanMode) => void;
}

const MODES: readonly { id: ScanMode; label: string }[] = [
  { id: "single", label: "단일 조회" },
  { id: "continuous", label: "연속 스캔" },
] as const;

export function ScanModeToggle({ mode, onChange }: ScanModeToggleProps) {
  return (
    <S.ScanModeTabBar role="tablist" aria-label="스캔 모드">
      {MODES.map((item) => {
        const active = mode === item.id;
        return (
          <S.ScanModeTabButton
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            $active={active}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </S.ScanModeTabButton>
        );
      })}
    </S.ScanModeTabBar>
  );
}
