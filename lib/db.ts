import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/tabscape?schema=public";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    adapter: new PrismaPg(
      new Pool({
        connectionString,
      })
    ),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
