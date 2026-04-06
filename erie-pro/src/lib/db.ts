// ── Prisma Client Singleton ─────────────────────────────────────────
// Uses globalThis pattern to prevent multiple Prisma Client instances
// during Next.js hot-reload in development.
// Prisma v7 requires a driver adapter for direct database connections.

import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Please add it to your .env file."
    );
  }

  const adapter = new PrismaPg({
    connectionString,
    max: 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
