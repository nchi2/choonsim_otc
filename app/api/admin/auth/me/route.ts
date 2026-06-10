import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    username: user.username,
    displayName: user.displayName,
  });
}
