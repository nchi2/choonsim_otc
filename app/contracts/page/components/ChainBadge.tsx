import type { Network } from "@/app/scanner/lib/tokens";
import { SCANNER_NETWORK_LABEL } from "@/app/scanner/lib/tokens";
import * as S from "../styles";

export function ChainBadge({ network }: { network: Network }) {
  return <S.ChainBadgeSpan $net={network}>{SCANNER_NETWORK_LABEL[network]}</S.ChainBadgeSpan>;
}
