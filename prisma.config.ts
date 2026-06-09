import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // 마이그레이션/스키마 작업은 풀러가 아닌 직접 연결(DIRECT_URL)을 사용한다.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
