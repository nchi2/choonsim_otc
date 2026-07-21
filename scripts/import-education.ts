// Step 26 — 2단계: 교육 데이터 프로덕션 넣기.
// 실행: npx tsx scripts/import-education.ts            ← dry-run(기본, 프로덕션에 아무것도 안 씀)
//       npx tsx scripts/import-education.ts --commit   ← 실제 INSERT (★사람 확인 후에만)
//
// ★ 안전 규칙:
// - target = 별도 변수 PROD_DIRECT_URL(사람이 .env에 임시 추가). 없으면 즉시 중단.
// - 프로덕션에는 신규 INSERT만 — DELETE/UPDATE 없음(코드에 존재하지 않음).
// - slug가 이미 있으면 건너뜀(덮어쓰기 금지 → 재실행 안전/멱등).
// - officeId는 code로 재매핑. 매칭 실패 시 해당 이벤트 건너뛰고 경고(임의 회관 배정 금지).
// - hostMemberId=null 고정(회원 미이관). hostName/Contact/Email 스냅샷은 그대로.
// - 감사 필드(lastEditedBy*)는 복사하지 않음(비움).

import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const EXPORT_PATH = "scripts/education-export.json";
const commit = process.argv.includes("--commit");

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "(unparseable)";
  }
}

interface ExportedSession {
  date: string;
  startTime: string;
  endTime: string;
}

interface ExportedEvent {
  devId: number;
  officeCode: string | null;
  applyDeadline: string | null;
  sessions: ExportedSession[];
  title: string;
  slug: string;
  category: "LECTURE" | "WORKSHOP" | "EVENT";
  posterUrl: string | null;
  posterFocus: string;
  descriptionMd: string | null;
  instructorName: string | null;
  instructorBio: string | null;
  customLocation: string | null;
  mode: "OFFLINE" | "ONLINE" | "HYBRID";
  streamUrl: string | null;
  capacity: number | null;
  feeKrw: number;
  depositBankName: string | null;
  depositAccountNo: string | null;
  depositAccountHolder: string | null;
  eligibility: string | null;
  preparation: string | null;
  reward: string | null;
  refundPolicy: string | null;
  notice: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  rejectReason: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  hostName: string | null;
  hostContact: string | null;
  hostEmail: string | null;
}

async function main() {
  // ── target: 프로덕션 — PROD_DIRECT_URL 없으면 즉시 중단 ──
  const targetUrl = process.env.PROD_DIRECT_URL;
  if (!targetUrl) {
    console.error(
      [
        "중단: PROD_DIRECT_URL 환경변수가 없습니다.",
        "프로덕션 DB의 DIRECT 연결 문자열을 .env에 임시로 추가해 주세요:",
        '  PROD_DIRECT_URL="postgresql://...ep-withered-shape-aoew1c9x..."',
        "(이관이 끝나면 이 줄을 다시 제거하세요.)",
      ].join("\n"),
    );
    process.exit(1);
  }
  const targetHost = hostOf(targetUrl);
  const sourceUrl = process.env.DIRECT_URL ?? "";
  const sourceHost = hostOf(sourceUrl);

  // 실수 방어 — target이 dev-education이면 이관 의미가 없고 뭔가 잘못된 것.
  if (targetHost.includes("ep-jolly-sky-aorgvv88")) {
    console.error(`중단: PROD_DIRECT_URL이 dev-education 호스트를 가리킵니다: ${targetHost}`);
    process.exit(1);
  }

  console.log(`[source] export JSON: ${EXPORT_PATH} (dev-education에서 내보낸 파일)`);
  console.log(`[target] 프로덕션 연결: ${targetHost}`);
  console.log(`[mode]   ${commit ? "★ COMMIT — 실제 INSERT 수행" : "DRY-RUN — 아무것도 쓰지 않음"}\n`);

  const raw = JSON.parse(readFileSync(EXPORT_PATH, "utf8")) as {
    exportedFrom: string;
    events: ExportedEvent[];
  };
  console.log(`export 원본 호스트: ${raw.exportedFrom} · 이벤트 ${raw.events.length}건`);
  if (sourceHost && raw.exportedFrom !== sourceHost) {
    console.warn(`주의: export 파일의 원본(${raw.exportedFrom})과 현재 .env source(${sourceHost})가 다릅니다.`);
  }

  const prod = new PrismaClient({
    adapter: new PrismaPg({ connectionString: targetUrl }),
  });

  // 프로덕션 회관 code → id 매핑
  const prodOffices = await prod.office.findMany({
    select: { id: true, code: true, name: true },
  });
  const prodOfficeByCode = new Map(prodOffices.map((o) => [o.code, o]));
  console.log(
    `프로덕션 회관 ${prodOffices.length}곳: ${prodOffices.map((o) => o.code).join(", ")}\n`,
  );

  // 기존 slug(중복 건너뛰기용) — 조회는 읽기 전용
  const existing = await prod.educationEvent.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existing.map((e) => e.slug));

  const toInsert: { ev: ExportedEvent; officeId: number | null }[] = [];
  const skippedSlug: ExportedEvent[] = [];
  const skippedOffice: ExportedEvent[] = [];

  for (const ev of raw.events) {
    if (existingSlugs.has(ev.slug)) {
      skippedSlug.push(ev);
      continue;
    }
    let officeId: number | null = null;
    if (ev.officeCode != null) {
      const office = prodOfficeByCode.get(ev.officeCode);
      if (!office) {
        skippedOffice.push(ev);
        continue; // ★ 임의로 다른 회관에 넣지 않는다
      }
      officeId = office.id;
    }
    toInsert.push({ ev, officeId });
  }

  console.log("── 계획 ──");
  for (const { ev, officeId } of toInsert) {
    console.log(
      `  [신규] devId=${ev.devId} "${ev.title}" (${ev.status}${ev.isPublished ? "·공개" : "·비공개"}, ` +
        `회관=${ev.officeCode ?? (ev.customLocation ? "직접입력" : "-")}→prodOfficeId=${officeId ?? "null"}, ` +
        `회차 ${ev.sessions.length}, slug=${ev.slug})`,
    );
  }
  for (const ev of skippedSlug) {
    console.log(`  [건너뜀·slug 중복] devId=${ev.devId} "${ev.title}" (slug=${ev.slug} 이미 존재)`);
  }
  for (const ev of skippedOffice) {
    console.log(
      `  [건너뜀·회관 미매칭 ★경고] devId=${ev.devId} "${ev.title}" (code=${ev.officeCode} 프로덕션에 없음)`,
    );
  }
  console.log(
    `\n요약: 신규 ${toInsert.length} · slug중복 건너뜀 ${skippedSlug.length} · 회관미매칭 건너뜀 ${skippedOffice.length}`,
  );

  if (!commit) {
    console.log("\nDRY-RUN 종료 — 아무것도 쓰지 않았습니다. 실제 반영은 --commit 플래그로.");
    await prod.$disconnect();
    return;
  }

  // ── 실제 INSERT (신규 생성만 — update/delete 없음) ──
  console.log("\n★ COMMIT — INSERT 시작");
  for (const { ev, officeId } of toInsert) {
    const created = await prod.educationEvent.create({
      data: {
        title: ev.title,
        slug: ev.slug,
        category: ev.category,
        posterUrl: ev.posterUrl,
        posterFocus: ev.posterFocus,
        descriptionMd: ev.descriptionMd,
        instructorName: ev.instructorName,
        instructorBio: ev.instructorBio,
        officeId,
        customLocation: ev.customLocation,
        mode: ev.mode,
        streamUrl: ev.streamUrl,
        capacity: ev.capacity,
        feeKrw: ev.feeKrw,
        depositBankName: ev.depositBankName,
        depositAccountNo: ev.depositAccountNo,
        depositAccountHolder: ev.depositAccountHolder,
        eligibility: ev.eligibility,
        preparation: ev.preparation,
        reward: ev.reward,
        refundPolicy: ev.refundPolicy,
        notice: ev.notice,
        applyDeadline: ev.applyDeadline ? new Date(ev.applyDeadline) : null,
        status: ev.status,
        rejectReason: ev.rejectReason,
        isPublished: ev.isPublished,
        isFeatured: ev.isFeatured,
        isTest: false,
        hostName: ev.hostName,
        hostContact: ev.hostContact,
        hostEmail: ev.hostEmail,
        hostMemberId: null, // ★ 회원 미이관 — 스냅샷(hostName 등)으로만 식별
        sessions: { create: ev.sessions },
      },
      select: { id: true, slug: true },
    });
    console.log(`  생성됨: prodId=${created.id} slug=${created.slug} (회차 ${ev.sessions.length})`);
  }
  console.log(`\n완료: ${toInsert.length}건 INSERT. (건너뜀 slug=${skippedSlug.length}, 회관=${skippedOffice.length})`);
  console.log("이관이 끝났으면 .env에서 PROD_DIRECT_URL 줄을 제거하세요.");

  await prod.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
