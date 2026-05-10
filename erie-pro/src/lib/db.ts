// ── Prisma Client Singleton ─────────────────────────────────────────
// Uses globalThis pattern to prevent multiple Prisma Client instances
// during Next.js hot-reload in development.
// Prisma v7 requires a driver adapter for direct database connections.

import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizePostgresSslMode } from "@/lib/db-url";

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
    connectionString: normalizePostgresSslMode(connectionString),
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  }) as unknown as PrismaClient;
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getPrisma(), prop, receiver);
    return typeof value === "function" ? value.bind(getPrisma()) : value;
  },
});
