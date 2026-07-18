import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberUser } from "@/lib/member-guard";

export const runtime = "nodejs";

// 프로필 수정 — 이름·전화만(이메일·비번은 별도, 인증 흐름 보호). 구글 회원 전화 보완 경로.
// ★ 미들웨어(/api/member) + getMemberUser 이중 가드. 세션 uid로만 자기 자신 수정.

export async function PATCH(request: Request) {
  const session = await getMemberUser();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { name?: unknown; phone?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const data: { name?: string; phone?: string | null } = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 50) {
      return NextResponse.json(
        { ok: false, error: "이름은 1~50자여야 합니다." },
        { status: 400 },
      );
    }
    data.name = body.name.trim();
  }
  if ("phone" in body) {
    if (body.phone === null || body.phone === "") {
      data.phone = null;
    } else if (typeof body.phone !== "string" || body.phone.trim().length > 30) {
      return NextResponse.json(
        { ok: false, error: "전화번호가 올바르지 않습니다." },
        { status: 400 },
      );
    } else {
      data.phone = body.phone.trim();
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "변경할 항목이 없습니다." }, { status: 400 });
  }

  try {
    const member = await prisma.member.update({
      where: { id: session.memberId },
      data,
      select: { id: true, email: true, name: true, phone: true },
    });
    return NextResponse.json({ ok: true, member });
  } catch (err) {
    console.error("[member/profile] patch failed", err);
    return NextResponse.json({ ok: false, error: "저장에 실패했습니다." }, { status: 500 });
  }
}
