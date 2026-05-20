import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __kwodePrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__kwodePrisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG === "1" ? ["query", "error", "warn"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__kwodePrisma = prisma;
}

export type { Prisma } from "@prisma/client";
