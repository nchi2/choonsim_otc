// Step 26 — 1단계: dev-education 교육 데이터 내보내기 (읽기 전용, 프로덕션 무접촉).
// 실행: npx tsx scripts/export-education.ts
// - source = .env의 DIRECT_URL(dev-education). 프로덕션 연결 없음.
// - EducationEvent(isTest=false 전부) + EventSession을 scripts/education-export.json으로 저장.
// - EventApplication·Member·AdminUser는 내보내지 않는다.
// - 콘솔에 옮길 목록 표 출력 — 사람이 눈으로 확인 후 2단계(import)로 진행.

import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });
import { writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const EXPORT_PATH = "scripts/education-export.json";

/** URL에서 호스트만 추출(자격증명 노출 없이 어디에 붙는지 확인용). */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "(unparseable)";
  }
}

async function main() {
  const sourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!sourceUrl) {
    console.error("중단: .env에 DIRECT_URL/DATABASE_URL이 없습니다.");
    process.exit(1);
  }
  const sourceHost = hostOf(sourceUrl);
  console.log(`[source] dev-education 읽기 전용 연결: ${sourceHost}`);
  if (!sourceHost.includes("ep-jolly-sky-aorgvv88")) {
    console.error(
      `중단: source가 dev-education(ep-jolly-sky-aorgvv88)이 아닙니다: ${sourceHost}`,
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: sourceUrl }),
  });

  // 회관 코드 매핑용 — officeId는 DB마다 다르므로 code로 변환해 내보낸다.
  const offices = await prisma.office.findMany({
    select: { id: true, code: true, name: true },
  });
  const officeCodeById = new Map(offices.map((o) => [o.id, o.code]));

  const events = await prisma.educationEvent.findMany({
    where: { isTest: false },
    orderBy: { id: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      posterUrl: true,
      posterFocus: true,
      descriptionMd: true,
      instructorName: true,
      instructorBio: true,
      officeId: true,
      customLocation: true,
      mode: true,
      streamUrl: true,
      capacity: true,
      feeKrw: true,
      depositBankName: true,
      depositAccountNo: true,
      depositAccountHolder: true,
      eligibility: true,
      preparation: true,
      reward: true,
      refundPolicy: true,
      notice: true,
      applyDeadline: true,
      status: true,
      rejectReason: true,
      isPublished: true,
      isFeatured: true,
      hostName: true,
      hostContact: true,
      hostEmail: true,
      // hostMemberId는 내보내지 않음 — 프로덕션엔 그 회원이 없어 import에서 null 고정.
      sessions: {
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        select: { date: true, startTime: true, endTime: true },
      },
    },
  });

  const payload = events.map((e) => {
    const { id, officeId, sessions, applyDeadline, ...rest } = e;
    const officeCode = officeId != null ? (officeCodeById.get(officeId) ?? null) : null;
    if (officeId != null && officeCode == null) {
      console.warn(`경고: 이벤트 #${id}의 officeId=${officeId}에 해당하는 Office가 없습니다.`);
    }
    return {
      devId: id, // 추적용 — import에서는 사용하지 않음
      officeCode, // ★ id 대신 code로 이관(양쪽 DB에서 id가 다를 수 있음)
      applyDeadline: applyDeadline ? applyDeadline.toISOString() : null,
      sessions,
      ...rest,
    };
  });

  writeFileSync(EXPORT_PATH, JSON.stringify({ exportedFrom: sourceHost, events: payload }, null, 2));

  // ── 확인용 표 출력 ──
  console.log(`\n내보낸 이벤트 ${payload.length}건 → ${EXPORT_PATH}\n`);
  const rows = payload.map((e) => ({
    devId: e.devId,
    제목: e.title.length > 24 ? e.title.slice(0, 23) + "…" : e.title,
    상태: e.status,
    공개: e.isPublished ? "공개" : "비공개",
    일시: e.sessions[0] ? `${e.sessions[0].date} ${e.sessions[0].startTime}` : "미정",
    회차: e.sessions.length,
    회관: e.officeCode ?? (e.customLocation ? `직접(${e.customLocation})` : "-"),
    참가비: e.feeKrw > 0 ? `${e.feeKrw.toLocaleString()}원` : "무료",
    포스터: e.posterUrl ? "있음" : "없음",
    slug: e.slug,
  }));
  console.table(rows);
  console.log("위 목록을 확인한 뒤 2단계(import dry-run)로 진행하세요.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
