import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";
import { getAdminUser } from "@/lib/admin-guard";
import { allowPosterUpload, clientIpOf } from "@/lib/education-rate-limit";
import {
  r2Enabled,
  sniffImageType,
  uploadImageToR2,
  R2_MAX_BYTES,
} from "@/lib/r2";

export const runtime = "nodejs";

// 포스터 이미지 업로드(R2) — 서버 업로드 방식. multipart/form-data 의 file 필드.
// ★ 권한 게이트: 승인 교육자(educatorStatus=APPROVED) 또는 운영자만. 익명 업로드 금지(저장소 남용 방지).
// ★ 검증: 파일 시그니처(매직 바이트)로 실제 타입 확인(확장자·헤더 불신) / 5MB 상한 / 서버 랜덤 파일명.
// env(R2_*) 미설정이면 503(기능만 비활성 — 앱은 안 깨짐).

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** 세션 확인 — 승인 교육자 또는 운영자면 통과. 어느 쪽도 아니면 null. */
async function authorizeUploader(): Promise<
  { kind: "educator"; memberId: string } | { kind: "admin" } | null
> {
  const member = await getMemberUser();
  if (member) {
    const row = await prisma.member.findUnique({
      where: { id: member.memberId },
      select: { educatorStatus: true, status: true },
    });
    if (row && row.status === "ACTIVE" && row.educatorStatus === "APPROVED") {
      return { kind: "educator", memberId: member.memberId };
    }
    // 로그인은 했으나 승인 교육자가 아님 — 운영자 세션도 확인(회원↔운영자 쿠키 분리라 병존 가능)
  }
  const admin = await getAdminUser();
  if (admin) return { kind: "admin" };
  return null;
}

export async function POST(request: Request) {
  if (!r2Enabled()) {
    return bad("이미지 업로드가 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.", 503);
  }

  const who = await authorizeUploader();
  if (!who) {
    return bad("이미지 업로드 권한이 없습니다. (승인된 교육자 또는 운영자만 가능)", 403);
  }

  const ip = clientIpOf(request);
  if (!allowPosterUpload(ip)) {
    return bad("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", 429);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return bad("이미지 파일이 없습니다.");
  }
  if (file.size === 0) {
    return bad("빈 파일입니다.");
  }
  if (file.size > R2_MAX_BYTES) {
    return bad("파일이 5MB를 초과합니다. 더 작은 이미지를 사용해 주세요.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // ★ 확장자·Content-Type이 아니라 실제 바이트로 판별 — 위조 파일 차단
  const type = sniffImageType(bytes);
  if (!type) {
    return bad("jpg·png·webp 이미지만 업로드할 수 있습니다.");
  }

  try {
    const { url } = await uploadImageToR2(bytes, type);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[education/poster] upload failed", err);
    return bad("이미지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }
}
