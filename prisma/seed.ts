import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const BCRYPT_ROUNDS = 10;

/**
 * 사무실 seed — code 기준 upsert. 강남(=서초)만 isActive=true(OTC 예약 노출 — 기존 정책 그대로).
 * Step 16: educationActive = 교육 플랫폼(/host·교육 슬롯) 노출 여부. OTC(isActive)와 독립.
 * Step 17: 사람 승인으로 회관 개명(name만). code·id·isActive·educationActive는 불변.
 *   ⚠️ OTC 화면 표시명도 함께 바뀌는 것을 알고 내린 결정.
 * - GANGNAM 행 = 서초 모빅회관(주소 동일한 같은 건물). 상세 주소(지하층)는 OTC 안내 정확성 위해 유지.
 * - SUWON: 신규(교육 전용, isActive=false — OTC 예약에 뜨면 안 됨).
 * - 대전만 "커뮤니티센터"(모빅회관 아님).
 */
const OFFICE_SEEDS = [
  {
    code: "GANGNAM",
    name: "서초 모빅회관",
    // 서초 모빅회관 — 기존 상세 주소(지하층) 유지가 OTC 안내에 더 정확
    address: "서울 서초구 사임당로 149-5 지하층" as string | null,
    isActive: true,
    educationActive: true,
    sortOrder: 0,
  },
  {
    code: "SEONGSU",
    name: "성수 사무실",
    address: null as string | null,
    isActive: false,
    educationActive: false,
    sortOrder: 1,
  },
  {
    code: "SUWON",
    name: "수원 모빅회관",
    address: "경기도 수원시 권선구 세화로 168번길 6, 3층 4층",
    isActive: false,
    educationActive: true,
    sortOrder: 2,
  },
  {
    code: "DAEJEON",
    name: "대전 커뮤니티센터",
    address: "대전시 유성구 송림로 48번길 6-28, 103호",
    isActive: false,
    educationActive: true,
    sortOrder: 3,
  },
  {
    code: "GWANGJU",
    name: "광주 모빅회관",
    address: "광주시 동구 충장로 58번길 2, 2층",
    isActive: false,
    educationActive: true,
    sortOrder: 4,
  },
  {
    code: "DAEGU",
    name: "대구 모빅회관",
    address: "대구광역시 서구 팔달로 92, B1F",
    isActive: false,
    educationActive: true,
    sortOrder: 5,
  },
  {
    code: "BUSAN",
    name: "부산 모빅회관",
    address: "부산 수영구 광안해변로 95, 3층 304호",
    isActive: false,
    educationActive: true,
    sortOrder: 6,
  },
] as const;

async function seedOffices() {
  for (const o of OFFICE_SEEDS) {
    await prisma.office.upsert({
      where: { code: o.code },
      create: {
        code: o.code,
        name: o.name,
        address: o.address,
        isActive: o.isActive,
        educationActive: o.educationActive,
        sortOrder: o.sortOrder,
      },
      update: {
        name: o.name,
        address: o.address,
        isActive: o.isActive,
        educationActive: o.educationActive,
        sortOrder: o.sortOrder,
      },
    });
    console.log(`[seed] office upsert done: ${o.code}`);
  }
}

/** 교육 행사 seed — slug 기준 upsert(재실행 안전). 전부 승인·공개 상태로 UI에서 바로 보이게. */
const EDUCATION_EVENT_SEEDS = [
  {
    slug: "seocho-sbmb-lecture-2026-07",
    title: "서초모빅회관 춘심 SBMB 강연",
    category: "LECTURE",
    mode: "OFFLINE",
    isFeatured: true,
    instructorName: "춘심이 동생",
    customLocation: "서초모빅회관",
    capacity: 40,
    feeKrw: 10000,
    depositBankName: "국민은행",
    depositAccountNo: "366501-01-204058",
    depositAccountHolder: "조용래/모빅스테이션",
    preparation: "주차 불가, 대중교통 권장",
    notice: "주차 불가, 대중교통 권장",
    reward: "이더리움 지갑 1장",
    refundPolicy: "신청 후 취소 불가, 불참 시 환불·리워드 없음",
    descriptionMd: [
      "## 강연 내용",
      "",
      "- SBMB Q&A",
      "- Trust Wallet 기초 (EVM 종이지갑 · 지갑 생성 · 토큰 전송)",
      "- 토큰 스테이킹",
      "- Uniswap 스왑",
      "- 지갑 운용 주의사항",
    ].join("\n"),
    sessions: [{ date: "2026-07-17", startTime: "14:00", endTime: "16:00" }],
  },
  {
    slug: "seocho-sbmb-lecture-2026-06",
    title: "서초모빅회관 춘심 SBMB 강연 6월",
    category: "LECTURE",
    mode: "OFFLINE",
    isFeatured: false,
    instructorName: "춘심팀",
    customLocation: "서초모빅회관",
    capacity: 40,
    feeKrw: 10000,
    depositBankName: "국민은행",
    depositAccountNo: "366501-01-204058",
    depositAccountHolder: "조용래/모빅스테이션",
    preparation: null,
    notice: null,
    reward: null,
    refundPolicy: "신청 후 취소 불가, 불참 시 환불·리워드 없음",
    descriptionMd: [
      "## 강연 내용",
      "",
      "- SBMB·콘솔 자유 질의응답",
      "- 트러스트월렛·유니스왑 실습 (격주)",
      "- 회관 중심 OTC 안내",
    ].join("\n"),
    sessions: [{ date: "2026-06-26", startTime: "14:00", endTime: "17:00" }],
  },
  {
    slug: "suwon-harvest-movn-2026-07",
    title: "수원모빅회관 Harvest MOVN(10모의 기적) 실습",
    category: "WORKSHOP",
    mode: "OFFLINE",
    isFeatured: true,
    instructorName: "가브리엘(수모크루)",
    customLocation: "수원모빅회관",
    capacity: 30,
    feeKrw: 5000,
    depositBankName: null,
    depositAccountNo: null,
    depositAccountHolder: null,
    preparation: "10모의 기적 종이지갑 지참(WBMB 전송 실습 희망 시)",
    notice: "주차 불가, 대중교통 권장",
    reward: null,
    refundPolicy: null,
    descriptionMd: [
      "## 실습 내용",
      "",
      "- 10모의 기적 소개 및 규칙 설명",
      "- 모빅원(app) 지갑 스왑 및 전송 실습",
    ].join("\n"),
    sessions: [{ date: "2026-07-25", startTime: "14:00", endTime: "16:00" }],
  },
] as const;

async function seedEducationEvents() {
  for (const ev of EDUCATION_EVENT_SEEDS) {
    const { sessions, slug, ...fields } = ev;
    const common = {
      ...fields,
      status: "APPROVED" as const,
      isPublished: true,
      isTest: false,
    };
    const existing = await prisma.educationEvent.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      await prisma.educationEvent.update({
        where: { slug },
        data: common,
      });
    } else {
      await prisma.educationEvent.create({
        data: {
          slug,
          ...common,
          sessions: { create: [...sessions] },
        },
      });
    }
    console.log(`[seed] education event upsert done: ${slug}`);
  }
}

interface SeedAccount {
  username: string;
  displayName: string;
  password: string;
}

function envKey(prefix: string, username: string): string {
  return `${prefix}${username.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

function resolvePassword(username: string): string | undefined {
  return (
    process.env[envKey("SEED_PW_", username)]?.trim() ||
    process.env[`SEED_${username.toUpperCase()}_PW`]?.trim() ||
    undefined
  );
}

function collectAccounts(): { accounts: SeedAccount[]; missing: string[] } {
  const list = (process.env.ADMIN_SEED_USERNAMES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const accounts: SeedAccount[] = [];
  const missing: string[] = [];

  for (const username of list) {
    const password = resolvePassword(username);
    if (!password) {
      missing.push(envKey("SEED_PW_", username));
      continue;
    }
    accounts.push({
      username,
      displayName:
        process.env[envKey("SEED_NAME_", username)]?.trim() || username,
      password,
    });
  }

  return { accounts, missing };
}

async function main() {
  const list = (process.env.ADMIN_SEED_USERNAMES ?? "").trim();
  if (!list) {
    throw new Error(
      "ADMIN_SEED_USERNAMES 가 비어 있습니다. .env.local 에 계정 목록을 설정하세요.",
    );
  }

  const { accounts, missing } = collectAccounts();
  // 비밀번호 env가 "전부" 없으면(이 머신은 계정 시드 대상 아님) 어드민 시드만 스킵하고
  // 사무실·교육 시드는 진행한다. 일부만 없으면 기존대로 실패(반쪽 시드 방지).
  if (missing.length > 0 && accounts.length === 0) {
    console.warn(
      `[seed] SEED_PW_* 미설정(${missing.join(", ")}) — 어드민 계정 시드는 건너뜀.`,
    );
  } else if (missing.length > 0) {
    throw new Error(
      `다음 비밀번호 환경변수가 비어 있습니다: ${missing.join(", ")}.`,
    );
  }

  for (const acc of accounts) {
    const passwordHash = await bcrypt.hash(acc.password, BCRYPT_ROUNDS);
    await prisma.adminUser.upsert({
      where: { username: acc.username },
      create: {
        username: acc.username,
        passwordHash,
        displayName: acc.displayName,
        role: "admin",
      },
      update: {
        passwordHash,
        displayName: acc.displayName,
        role: "admin",
      },
    });
    console.log(`[seed] upsert done: ${acc.username}`);
  }

  await seedOffices();
  await seedEducationEvents();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("[seed] failed:", e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
