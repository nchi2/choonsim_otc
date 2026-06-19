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

/** 사무실 seed — code 기준 upsert. 강남만 isActive=true. */
const OFFICE_SEEDS = [
  {
    code: "GANGNAM",
    name: "강남 사무실",
    address: "서울 서초구 사임당로 149-5 지하층",
    isActive: true,
    sortOrder: 0,
  },
  {
    code: "SEONGSU",
    name: "성수 사무실",
    address: null as string | null,
    isActive: false,
    sortOrder: 1,
  },
  {
    code: "DAEGU",
    name: "대구 사무실",
    address: null,
    isActive: false,
    sortOrder: 2,
  },
  {
    code: "DAEJEON",
    name: "대전 사무실",
    address: null,
    isActive: false,
    sortOrder: 3,
  },
  {
    code: "GWANGJU",
    name: "광주 사무실",
    address: null,
    isActive: false,
    sortOrder: 4,
  },
  {
    code: "BUSAN",
    name: "부산 사무실",
    address: null,
    isActive: false,
    sortOrder: 5,
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
        sortOrder: o.sortOrder,
      },
      update: {
        name: o.name,
        address: o.address,
        isActive: o.isActive,
        sortOrder: o.sortOrder,
      },
    });
    console.log(`[seed] office upsert done: ${o.code}`);
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
  if (missing.length > 0) {
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
