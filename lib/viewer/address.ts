import { keccak256 } from "ethereum-cryptography/keccak";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/** EIP-55 checksum 검증. 전부 소문자/대문자 hex도 허용(지갑·QR 관례). */
export function isValidChecksumAddress(address: string): boolean {
  const trimmed = address.trim();
  if (!ADDRESS_RE.test(trimmed)) return false;

  const hex = trimmed.slice(2);
  const lower = hex.toLowerCase();
  const upper = hex.toUpperCase();

  if (hex === lower || hex === upper) return true;

  const hash = keccak256(new TextEncoder().encode(lower));
  let checksummed = "0x";
  for (let i = 0; i < 40; i++) {
    const nibble = parseInt(lower[i], 16);
    const hashByte = hash[Math.floor(i / 2)];
    const hashNibble = i % 2 === 0 ? hashByte >> 4 : hashByte & 0x0f;
    checksummed += hashNibble >= 8 ? lower[i].toUpperCase() : lower[i];
  }
  return trimmed === checksummed;
}

export function normalizeAddress(address: string): string | null {
  if (!isValidChecksumAddress(address)) return null;
  return address.trim();
}
