"use client";

import {
  type Token,
  SCANNER_NETWORK_LABEL,
  SCANNER_SYMBOL_DISPLAY,
} from "@/app/scanner/lib/tokens";
import { tokenRowIconScale, tokenRowIconSrc } from "@/app/scanner/lib/token-icons";
import { formatBalance } from "@/app/scanner/lib/utils";
import * as S from "../styles";

function symbolInitials(symbol: string): string {
  const s = symbol.trim();
  if (s.length <= 3) return s.toUpperCase();
  return s.slice(0, 3).toUpperCase();
}

function iconColorVar(token: Token): string {
  if (token.type === "native") return token.colorVar;
  if (token.tier === "ours") return "--scanner-tier-ours";
  if (token.tier === "otaverse") return "--scanner-tier-otaverse";
  return "--scanner-tier-ours";
}

function rowBorderVar(token: Token): string {
  if (token.type === "native") return token.colorVar;
  if (token.tier === "ours") return "--scanner-tier-ours";
  if (token.tier === "otaverse") return "--scanner-tier-otaverse";
  return "--scanner-tier-ours";
}

function rowTint(token: Token): "ours" | "otaverse" | "neutral" {
  if (token.type === "native") return "neutral";
  if (token.tier === "ours") return "ours";
  if (token.tier === "otaverse") return "otaverse";
  return "neutral";
}

export interface TokenRowProps {
  token: Token;
  balance: number;
}

export function TokenRow({ token, balance }: TokenRowProps) {
  const borderVar = rowBorderVar(token);
  const tint = rowTint(token);
  const iconVar = iconColorVar(token);
  const iconSrc = tokenRowIconSrc(token);
  const iconScale = tokenRowIconScale(token);

  return (
    <S.TokenRowRoot $borderVar={borderVar} $tint={tint}>
      <S.TokenRowLeft>
        <S.TokenRowIcon $colorVar={iconVar} $image={Boolean(iconSrc)} aria-hidden>
          {iconSrc ? (
            <S.TokenRowIconImg src={iconSrc} alt="" $scale={iconScale} />
          ) : (
            symbolInitials(token.symbol)
          )}
        </S.TokenRowIcon>
        <S.TokenRowMeta>
          <S.TokenRowSymbol>
            {SCANNER_SYMBOL_DISPLAY[token.symbol] ?? token.symbol}
          </S.TokenRowSymbol>
          <S.TokenRowNetwork>{SCANNER_NETWORK_LABEL[token.network]}</S.TokenRowNetwork>
        </S.TokenRowMeta>
      </S.TokenRowLeft>
      <S.TokenRowRight>
        <S.TokenRowAmount>{formatBalance(balance)}</S.TokenRowAmount>
        <S.TokenRowSymbolSuffix>{token.symbol}</S.TokenRowSymbolSuffix>
      </S.TokenRowRight>
    </S.TokenRowRoot>
  );
}
