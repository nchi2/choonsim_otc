import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayKst } from "@/lib/kst";
import { sendEducationApplyAlert } from "@/lib/education-alerts";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  allowEducationApply,
  clientIpOf,
} from "@/lib/education-rate-limit";

export const runtime = "nodejs";

// 수강 신청 — EventApplication 생성.
// ★ 정원 동시성: 트랜잭션 안에서 EducationEvent 행을 SELECT … FOR UPDATE 로 잠근 뒤
//   APPLIED 수를 세고 정원 미만일 때만 insert. 같은 행사에 대한 신청이 행 락으로
//   직렬화되므로 40명 정원에 41명이 동시에 와도 정확히 40에서 끊긴다.
//   (중복 연락처 검사도 락 이후에 수행 — 더블클릭 이중 제출도 안전.)

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function asTrimmed(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function POST(request: Request) {
  const ip = clientIpOf(request);
  if (!allowEducationApply(ip)) {
    return bad("요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const eventId = Number(body.eventId);
  const name = asTrimmed(body.name);
  const contact = asTrimmed(body.contact);
  const email = asTrimmed(body.email); // 선택 — 없으면 그대로 통과
  const depositorName = asTrimmed(body.depositorName);
  const question = asTrimmed(body.question);
  const sessionIdRaw = body.sessionId;
  const sessionId =
    sessionIdRaw == null || sessionIdRaw === "" ? null : Number(sessionIdRaw);

  if (!Number.isInteger(eventId) || eventId <= 0) return bad("행사가 올바르지 않습니다.");
  if (!name || name.length > 50) return bad("이름을 입력해 주세요.");
  if (!contact || contact.length > 50) return bad("전화번호를 입력해 주세요.");
  // 이메일은 선택 — 값이 있을 때만 느슨히 검증
  if (email && (email.length > 100 || !email.includes("@"))) {
    return bad("이메일 형식이 올바르지 않습니다.");
  }
  if (depositorName && depositorName.length > 50) return bad("입금자명이 너무 깁니다.");
  if (question && question.length > 1000) return bad("사전 질문은 1000자 이내로 적어주세요.");
  if (body.agreePrivacy !== true) return bad("개인정보 수집·이용 동의가 필요합니다.");
  if (sessionId != null && (!Number.isInteger(sessionId) || sessionId <= 0)) {
    return bad("회차가 올바르지 않습니다.");
  }

  // Turnstile — 시크릿 미설정 시 통과(스텁), 설정 시 실검증.
  const ts = await verifyTurnstile(asTrimmed(body.turnstileToken), ip);
  if (!ts.ok) return bad("자동입력 방지 확인에 실패했습니다. 새로고침 후 다시 시도해 주세요.");

  try {
    // 공개 조건 + 마감/종료 검사 (표시 레이어와 동일 규칙)
    const event = await prisma.educationEvent.findFirst({
      where: { id: eventId, status: "APPROVED", isPublished: true, isTest: false },
      select: {
        id: true,
        title: true,
        capacity: true,
        feeKrw: true,
        applyDeadline: true,
        sessions: {
          select: { id: true, date: true, startTime: true, endTime: true },
        },
      },
    });
    if (!event) return bad("신청할 수 없는 행사입니다.", 404);

    if (event.applyDeadline != null && event.applyDeadline.getTime() < Date.now()) {
      return bad("신청이 마감되었습니다.");
    }
    const today = todayKst();
    if (event.sessions.length > 0 && event.sessions.every((s) => s.date < today)) {
      return bad("종료된 행사입니다.");
    }
    if (sessionId != null && !event.sessions.some((s) => s.id === sessionId)) {
      return bad("이 행사의 회차가 아닙니다.");
    }
    if (event.feeKrw > 0 && !depositorName) {
      return bad("유료 행사는 입금자명이 필요합니다.");
    }

    // ★ 정원·중복 원자 처리 — 행 락으로 같은 행사 신청을 직렬화.
    //   락 보유는 ms 단위지만 대량 동시 신청 시 대기열이 생기므로 maxWait/timeout을
    //   넉넉히(기본 2s/5s → 10s/15s) — 기본값에선 순간 폭주 때 P2028로 일부가 500이 났음.
    type TxResult = { error: string; status: number } | { id: number };
    const result = await prisma.$transaction(
      async (tx): Promise<TxResult> => {
        await tx.$queryRaw`SELECT id FROM "EducationEvent" WHERE id = ${event.id} FOR UPDATE`;

        const dup = await tx.eventApplication.findFirst({
          where: { eventId: event.id, contact, status: "APPLIED" },
          select: { id: true },
        });
        if (dup) return { error: "이미 신청된 연락처입니다.", status: 409 };

        if (event.capacity != null) {
          const applied = await tx.eventApplication.count({
            where: { eventId: event.id, status: "APPLIED", isTest: false },
          });
          if (applied >= event.capacity) {
            return { error: "정원이 마감되었습니다.", status: 409 };
          }
        }

        const row = await tx.eventApplication.create({
          data: {
            eventId: event.id,
            sessionId,
            name,
            contact,
            email,
            depositorName,
            question,
            agreePrivacy: true,
            status: "APPLIED",
            isTest: false,
          },
          select: { id: true },
        });
        return { id: row.id };
      },
      { maxWait: 10_000, timeout: 15_000 },
    );

    if ("error" in result) return bad(result.error, result.status);

    // 운영자 알림(건별) — 발송 실패해도 신청은 성공 유지.
    try {
      const appliedCount = await prisma.eventApplication.count({
        where: { eventId: event.id, status: "APPLIED", isTest: false },
      });
      const session =
        sessionId != null
          ? (event.sessions.find((s) => s.id === sessionId) ?? null)
          : (event.sessions[0] ?? null);
      await sendEducationApplyAlert({
        eventId: event.id,
        eventTitle: event.title,
        applicantName: name,
        session,
        appliedCount,
        capacity: event.capacity,
      });
    } catch (alertErr) {
      console.error("[education/apply] alert failed", alertErr);
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "unknown";
    console.error("[education/apply] failed", code);
    return bad("신청 접수에 실패했습니다.", 500);
  }
}
