// 교육 공개 POST용 IP 레이트리밋 — 인메모리 슬라이딩 윈도우(sbmb rateLimit 패턴 확장).
// ★ Vercel 서버리스 제약: 인스턴스별 메모리라 완전한 전역 한도는 아님(외부 스토어 없이는 불가).
//   목적은 봇 버스트 억제 — 정상 사용자는 걸리지 않는 넉넉한 한도. 진짜 방어선은 Turnstile(키 장착 시).
// 한도는 env로 조정 가능: EDU_RATE_APPLY_MAX / EDU_RATE_HOST_MAX (기본 아래 상수).

const WINDOW_MS = 60_000; // 1분

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

const buckets = new Map<string, number[]>();

function allow(key: string, max: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

/** 수강 신청 — 기본 분당 8회/IP (다인 가족·회관 공용 와이파이 고려해 넉넉히). */
export function allowEducationApply(ip: string): boolean {
  return allow(`edu-apply:${ip}`, envInt("EDU_RATE_APPLY_MAX", 8));
}

/** 개설 신청 — 기본 분당 3회/IP (정상 사용자는 1~2회면 충분). */
export function allowEducationHost(ip: string): boolean {
  return allow(`edu-host:${ip}`, envInt("EDU_RATE_HOST_MAX", 3));
}

/** 포스터 업로드 — 기본 분당 10회/IP (여러 장 교체·재시도 여유. 게이트가 승인 교육자·운영자로 이미 제한). */
export function allowPosterUpload(ip: string): boolean {
  return allow(`edu-poster:${ip}`, envInt("EDU_RATE_POSTER_MAX", 10));
}

/** 클라이언트 IP — 프록시 헤더 우선(sbmb clientIp와 동일 규칙). */
export function clientIpOf(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
