import { cookies } from "next/headers";

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session");

    if (!sessionToken) {
      return false;
    }

    // 환경변수에 저장된 세션 토큰과 비교 (실제로는 DB나 Redis에 저장)
    // 여기서는 간단하게 쿠키 존재 여부만 확인
    // 프로덕션에서는 세션 토큰을 DB에 저장하고 검증하는 것이 좋습니다
    return true;
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
}
