// ── Runtime Settings Helpers ──────────────────────────────────────
// Read/write key/value runtime config stored in the Setting table.
// Values are JSON-serialized so callers can stash numbers, flags,
// or small objects behind the same interface.
//
// Used for anything that must be adjustable without a redeploy but
// doesn't warrant a dedicated table (founding-seat claimed count,
// launch-kit notes, etc.).

import { isDatabaseReadSkipped, prisma } from "@/lib/db";

export async function getSetting<T = unknown>(
  key: string,
  fallback: T,
): Promise<T> {
  if (isDatabaseReadSkipped()) return fallback;

  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    if (!row) return fallback;
    return JSON.parse(row.value) as T;
  } catch {
    // DB unavailable or JSON malformed — callers get the fallback.
    return fallback;
  }
}

export async function setSetting<T>(
  key: string,
  value: T,
  updatedBy?: string,
): Promise<void> {
  const serialized = JSON.stringify(value);
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: serialized, updatedBy: updatedBy ?? null },
    update: { value: serialized, updatedBy: updatedBy ?? null },
  });
}

// Well-known setting keys so we keep the string constants in one place.
export const SETTING_KEYS = {
  foundingClaimed: "founding.claimed_count",
  foundingTotal: "founding.total_slots",
  foundingPrice: "founding.price_usd",
  foundingNormalPrice: "founding.normal_price_usd",
  foundingLockMonths: "founding.lock_months",
} as const;
