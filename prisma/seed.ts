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
