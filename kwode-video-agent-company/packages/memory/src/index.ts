import { prisma } from "../../schemas/src/db.js";

export type MemoryScope = "global" | "tenant" | "client" | "brand" | "job" | "agent";

export async function remember(
  scope: MemoryScope,
  scopeId: string | null,
  key: string,
  value: unknown,
  source?: string
): Promise<void> {
  // upsert based on (scope, scopeId, key, source) — but we don't have a unique
  // constraint, so we emulate it with a find+update pattern.
  const existing = await prisma.memoryRecord.findFirst({
    where: { scope, scopeId: scopeId ?? null, key, source: source ?? null },
  });
  if (existing) {
    await prisma.memoryRecord.update({
      where: { id: existing.id },
      data: { value: value as object },
    });
  } else {
    await prisma.memoryRecord.create({
      data: {
        scope,
        scopeId: scopeId ?? null,
        key,
        value: value as object,
        source: source ?? null,
      },
    });
  }
}

export async function recall(
  scope: MemoryScope,
  scopeId: string | null,
  key: string
): Promise<unknown | null> {
  const row = await prisma.memoryRecord.findFirst({
    where: { scope, scopeId: scopeId ?? null, key },
    orderBy: { updatedAt: "desc" },
  });
  return row?.value ?? null;
}

export async function recallAll(scope: MemoryScope, scopeId: string | null) {
  return prisma.memoryRecord.findMany({
    where: { scope, scopeId: scopeId ?? null },
    orderBy: { updatedAt: "desc" },
  });
}
