import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./data/lncurl.db",
});

export const prisma = new PrismaClient({ adapter });
