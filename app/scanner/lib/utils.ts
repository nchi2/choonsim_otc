/** 포맷팅 · 주소 헬퍼 */

export function isValidAddress(input: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(input.trim());
}

/** QR, EIP-681(`ethereum:0x…`), URL·JSON(`{"address":"0x…"}`)·일반 문자열에서 첫 EVM 주소 추출 */
export function extractEvmAddressFromText(raw: string): string | null {
  const t = raw.trim();
  if (t.startsWith("{")) {
    try {
      const j = JSON.parse(t) as { address?: string };
      if (typeof j.address === "string") {
        return extractEvmAddressFromText(j.address);
      }
    } catch {
      /* not JSON */
    }
  }
  const payload = t.startsWith("ethereum:")
    ? t
        .slice("ethereum:".length)
        .split("@")[0]
        .split("?")[0]
        .trim()
    : t;
  const strict = payload.match(/^(0x[a-fA-F0-9]{40})$/);
  if (strict) return strict[1];
  const embedded = payload.match(/0x[a-fA-F0-9]{40}/);
  if (embedded) return embedded[0];
  return null;
}

export function formatBalance(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n > 0 && n < 0.0001) {
    return trimTrailingZeros(n.toFixed(8));
  }
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${trimTrailingZeros(v.toFixed(2))}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${trimTrailingZeros(v.toFixed(2))}K`;
  }
  return trimTrailingZeros(n.toFixed(6));
}

function trimTrailingZeros(s: string): string {
  return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function shortAddress(addr: string): string {
  const a = addr.trim();
  if (a.length < 10) return addr;
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}
