import { cookies } from "next/headers";
import {
  MEMBER_SESSION_COOKIE,
  getMemberSessionUser,
  type MemberSessionUser,
} from "@/lib/member-session";

/** 현재 로그인한 회원 — member_session 쿠키 검증. 미로그인/운영자 토큰이면 null. */
export async function getMemberUser(): Promise<MemberSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MEMBER_SESSION_COOKIE)?.value;
  return getMemberSessionUser(token);
}
