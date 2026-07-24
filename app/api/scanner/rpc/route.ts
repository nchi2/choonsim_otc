import { NextResponse } from "next/server";
import { RPC_URLS } from "@/app/scanner/lib/rpc-config";
import type { Network } from "@/app/scanner/lib/tokens";

const ALLOWED_METHODS = new Set(["eth_getBalance", "eth_call"]);
const MAX_BATCH = 60;

let serverRpcId = 0;

function isNetwork(v: unknown): v is Network {
  return v === "eth" || v === "base" || v === "bsc";
}

/** 상단 후보가 매달리면 6초에 끊어 다음 후보로 폴백(클라이언트도 체인별 타임아웃을 별도로 건다). */
async function forwardOnce(
  url: string,
  payload: unknown,
): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

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

  const { network, method, params, calls } = body as {
    network?: string;
    method?: string;
    params?: unknown;
    calls?: unknown;
  };

  if (!isNetwork(network)) {
    return NextResponse.json(
      { error: "INVALID_NETWORK", result: null },
      { status: 400 },
    );
  }
  const urls = RPC_URLS[network];

  // ── 배치 경로: {network, calls:[{method,params}]} → 체인당 왕복 1회 ──
  if (calls !== undefined) {
    if (!Array.isArray(calls) || calls.length === 0 || calls.length > MAX_BATCH) {
      return NextResponse.json(
        { error: "INVALID_CALLS", results: null },
        { status: 400 },
      );
    }
    const normalized: { method: string; params: unknown[] }[] = [];
    for (const c of calls) {
      if (!c || typeof c !== "object") {
        return NextResponse.json({ error: "INVALID_CALL", results: null }, { status: 400 });
      }
      const { method: m, params: p } = c as { method?: string; params?: unknown };
      if (!m || !ALLOWED_METHODS.has(m) || !Array.isArray(p)) {
        return NextResponse.json({ error: "INVALID_CALL", results: null }, { status: 400 });
      }
      normalized.push({ method: m, params: p });
    }

    // id = 인덱스 → 응답이 순서 바뀌어 와도 id로 원위치 매핑
    const payload = normalized.map((c, i) => ({
      jsonrpc: "2.0",
      id: i,
      method: c.method,
      params: c.params,
    }));

    for (const url of urls) {
      const json = await forwardOnce(url, payload);
      if (!Array.isArray(json)) continue;
      const results = new Array<unknown>(normalized.length).fill(null);
      for (const item of json) {
        const it = item as { id?: unknown; result?: unknown; error?: unknown };
        if (typeof it.id === "number" && it.id >= 0 && it.id < results.length) {
          results[it.id] = it.error != null ? null : (it.result ?? null);
        }
      }
      return NextResponse.json({ results, error: null });
    }
    return NextResponse.json(
      { results: null, error: "RPC_UNAVAILABLE" },
      { status: 502 },
    );
  }

  // ── 단건 경로(기존 호환): {network, method, params} ──
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

  for (const url of urls) {
    serverRpcId += 1;
    const json = (await forwardOnce(url, {
      jsonrpc: "2.0",
      id: serverRpcId,
      method,
      params,
    })) as { result?: unknown; error?: unknown } | null;
    if (!json || json.error != null) continue;
    return NextResponse.json({ result: json.result ?? null, error: null });
  }

  return NextResponse.json(
    { result: null, error: "RPC_UNAVAILABLE" },
    { status: 502 },
  );
}
