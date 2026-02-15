import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL || "file:./data/lncurl.db";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  datasource: {
    url,
  },
  migrate: {
    adapter: async () => {
      const { PrismaBetterSqlite3 } = await import(
        "@prisma/adapter-better-sqlite3"
      );
      return new PrismaBetterSqlite3({ url });
    },
  },
});
