import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MEMBER_SESSION_COOKIE } from "@/lib/member-session";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(MEMBER_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
