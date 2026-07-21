// Cloudflare R2(S3 호환) 이미지 업로드 — 서버 전용.
// ★ S3 클라이언트로 aws4fetch 선택: SigV4 서명을 native fetch + WebCrypto로 처리하는 ~수 KB 경량 라이브러리.
//   @aws-sdk/client-s3(수 MB, 많은 의존성)는 Step 11의 CPU/번들 절감 기조에 반해 배제.
// ★ env 게이트: R2 변수가 하나라도 없으면 업로드 기능만 비활성(앱은 안 깨짐 — turnstile 패턴과 동일).
import { AwsClient } from "aws4fetch";

export const R2_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type R2ImageType = (typeof R2_ALLOWED_TYPES)[number];
export const R2_MAX_BYTES = 5 * 1024 * 1024; // 5MB

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

function readConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

/** 업로드 기능 활성 여부 — 라우트에서 503 안내에 사용. */
export function r2Enabled(): boolean {
  return readConfig() !== null;
}

/** 공개 URL이 우리 R2 퍼블릭 도메인 소속인지 — posterUrl 주입 방지 검증에 사용. */
export function isR2PublicUrl(url: string): boolean {
  const cfg = readConfig();
  if (!cfg) return false;
  return url.startsWith(`${cfg.publicBaseUrl}/`);
}

/**
 * 파일 시그니처(매직 바이트)로 실제 이미지 타입 판별 — 확장자·Content-Type 헤더는 위조 가능하므로 신뢰하지 않는다.
 * 허용: jpg/png/webp. 그 외(위조 포함)는 null → 라우트에서 거부.
 */
export function sniffImageType(bytes: Uint8Array): R2ImageType | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // WEBP: "RIFF" .... "WEBP"  (0..3 = 52 49 46 46, 8..11 = 57 45 42 50)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

const EXT_BY_TYPE: Record<R2ImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** 서버 생성 랜덤 객체 키 — 사용자 파일명은 절대 쓰지 않는다(경로 조작·충돌 방지). */
function newObjectKey(type: R2ImageType): string {
  const id = crypto.randomUUID().replace(/-/g, "");
  return `events/${id}.${EXT_BY_TYPE[type]}`;
}

export interface R2UploadResult {
  url: string;
  key: string;
}

/**
 * R2에 이미지 업로드 후 공개 URL 반환. 호출 전 sniffImageType·크기 검증을 마쳐야 한다.
 * env 미설정이면 호출자가 r2Enabled()로 걸러야 하며, 여기선 방어적으로 throw.
 */
export async function uploadImageToR2(
  bytes: Uint8Array,
  type: R2ImageType,
): Promise<R2UploadResult> {
  const cfg = readConfig();
  if (!cfg) throw new Error("R2 not configured");

  const client = new AwsClient({
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    region: "auto", // R2는 region=auto
    service: "s3",
  });

  const key = newObjectKey(type);
  const endpoint = `https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucket}/${key}`;

  const res = await client.fetch(endpoint, {
    method: "PUT",
    // Uint8Array는 BufferSource로 유효한 body지만 TS 5.7 제네릭(ArrayBufferLike) 표기와
    // BodyInit 정의가 어긋나 캐스팅. aws4fetch가 이 바이트로 SigV4 content-hash를 계산한다.
    body: bytes as unknown as BodyInit,
    headers: {
      "Content-Type": type,
      // ★ R2는 PUT에 Content-Length 필수(chunked 전송 미지원). undici가 간헐적으로 chunked를
      //   쓰면 411 MissingContentLength가 나므로 길이를 명시해 결정적으로 고정한다.
      "Content-Length": String(bytes.byteLength),
      // 이미지는 불변(랜덤 키) — 장기 캐시 허용
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[r2] upload failed", res.status, detail.slice(0, 200));
    throw new Error(`R2 upload failed (${res.status})`);
  }

  return { url: `${cfg.publicBaseUrl}/${key}`, key };
}
