"use client";

import { useCallback, useRef, useState } from "react";

export function useCopyToClipboard(copiedMs = 1500) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string, key: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return false;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      setCopiedKey(key);
      timerRef.current = setTimeout(() => setCopiedKey(null), copiedMs);
      return true;
    },
    [copiedMs],
  );

  return { copiedKey, copy };
}
