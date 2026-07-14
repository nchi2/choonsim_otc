import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

// 본인 비밀번호 즉시 변경 — 현재 비번 검증 후 bcrypt.hash(10) 저장. 승인 큐 없음.
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword) {
    return NextResponse.json(
      { ok: false, error: "현재 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }
  if (newPassword.length < 8 || newPassword.length > 100) {
    return NextResponse.json(
      { ok: false, error: "새 비밀번호는 8자 이상이어야 합니다." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: admin.adminUserId },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "계정을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "현재 비밀번호가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[admin/profile/password] failed", code);
    return NextResponse.json(
      { ok: false, error: "비밀번호 변경에 실패했습니다." },
      { status: 500 },
    );
  }
}
