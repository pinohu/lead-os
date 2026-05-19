// src/lib/service-requests/request-id.ts
// Generates public request IDs: ERIE-YYYY-NNNNNN

import { prisma } from "@/lib/db"

const SETTING_PREFIX = "service_request_seq_"

export async function generateServiceRequestId(): Promise<string> {
  const year = new Date().getFullYear()
  const key = `${SETTING_PREFIX}${year}`

  const seq = await prisma.$transaction(async (tx) => {
    const row = await tx.setting.findUnique({ where: { key } })
    const current = row ? Number.parseInt(JSON.parse(row.value) as string, 10) : 0
    const next = Number.isFinite(current) ? current + 1 : 1
    await tx.setting.upsert({
      where: { key },
      create: { key, value: JSON.stringify(next) },
      update: { value: JSON.stringify(next) },
    })
    return next
  })

  return `ERIE-${year}-${String(seq).padStart(6, "0")}`
}
