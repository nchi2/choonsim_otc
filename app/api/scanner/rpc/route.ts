import { NextResponse } from "next/server";
import { RPC_URLS } from "@/app/scanner/lib/rpc-config";
import type { Network } from "@/app/scanner/lib/tokens";

const ALLOWED_METHODS = new Set(["eth_getBalance", "eth_call"]);

let serverRpcId = 0;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", result: null },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "INVALID_BODY", result: null }, { status: 400 });
  }

  const { network, method, params } = body as {
    network?: string;
    method?: string;
    params?: unknown;
  };

  if (network !== "eth" && network !== "base" && network !== "bsc") {
    return NextResponse.json(
      { error: "INVALID_NETWORK", result: null },
      { status: 400 },
    );
  }
  if (!method || !ALLOWED_METHODS.has(method)) {
    return NextResponse.json(
      { error: "INVALID_METHOD", result: null },
      { status: 400 },
    );
  }
  if (!Array.isArray(params)) {
    return NextResponse.json(
      { error: "INVALID_PARAMS", result: null },
      { status: 400 },
    );
  }

  const urls = RPC_URLS[network as Network];
  for (const url of urls) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25_000);
    try {
      serverRpcId += 1;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: serverRpcId,
          method,
          params,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) continue;
      const json: { result?: unknown; error?: unknown } = await res.json();
      if (json.error != null) continue;
      return NextResponse.json({
        result: json.result ?? null,
        error: null,
      });
    } catch {
      continue;
    } finally {
      clearTimeout(t);
    }
  }

  return NextResponse.json(
    { result: null, error: "RPC_UNAVAILABLE" },
    { status: 502 },
  );
}
