import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

// ★ 본인 전용 API — uid는 무조건 세션에서만 읽는다. URL 파라미터로 남의 id 조회 불가.
// 계좌 필드는 이 API 외 어디에도(목록·조회 API) 노출하지 않는다.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROFILE_SELECT = {
  username: true,
  displayName: true,
  email: true,
  phone: true,
  bankName: true,
  bankAccountNo: true,
  bankAccountHolder: true,
} as const;

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const profile = await prisma.adminUser.findUnique({
      where: { id: admin.adminUserId },
      select: PROFILE_SELECT,
    });
    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "계정을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/profile] get failed", code);
    return NextResponse.json(
      { ok: false, error: "프로필을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

// 수정 가능 필드 — 요청에 없으면 미변경, null/빈 문자열이면 비우기.
const TEXT_FIELDS = [
  { key: "phone", max: 30 },
  { key: "bankName", max: 50 },
  { key: "bankAccountNo", max: 50 },
  { key: "bankAccountHolder", max: 50 },
] as const;

export async function PATCH(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const data: Record<string, string | null> = {};

  if ("displayName" in body) {
    const v = body.displayName;
    if (typeof v !== "string" || !v.trim() || v.trim().length > 30) {
      return NextResponse.json(
        { ok: false, error: "표시 이름은 1~30자여야 합니다." },
        { status: 400 },
      );
    }
    data.displayName = v.trim();
  }

  if ("email" in body) {
    const v = body.email;
    if (v === null || (typeof v === "string" && v.trim() === "")) {
      data.email = null;
    } else if (
      typeof v !== "string" ||
      v.trim().length > 100 ||
      !EMAIL_RE.test(v.trim())
    ) {
      return NextResponse.json(
        { ok: false, error: "이메일 형식이 올바르지 않습니다." },
        { status: 400 },
      );
    } else {
      data.email = v.trim();
    }
  }

  for (const { key, max } of TEXT_FIELDS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === null) {
      data[key] = null;
    } else if (typeof v !== "string" || v.trim().length > max) {
      return NextResponse.json(
        { ok: false, error: `${key} 값이 올바르지 않습니다.` },
        { status: 400 },
      );
    } else {
      data[key] = v.trim() || null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "변경할 항목이 없습니다." },
      { status: 400 },
    );
  }

  try {
    const profile = await prisma.adminUser.update({
      where: { id: admin.adminUserId },
      data,
      select: PROFILE_SELECT,
    });
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/profile] patch failed", code);
    return NextResponse.json(
      { ok: false, error: "저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
