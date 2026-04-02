// ── City Configuration ────────────────────────────────────────────────
// Single source of truth for the current city deployment.
// Multi-city: set CITY_SLUG env var to deploy a different city instance.
// The city registry lives in city-registry.ts — add new cities there.

import { getCityBySlug, type CityConfig } from "./city-registry";

export type { CityConfig };

const slug = process.env.CITY_SLUG ?? "erie";
const resolved = getCityBySlug(slug);

if (!resolved) {
  throw new Error(
    `Unknown CITY_SLUG: "${slug}". Add it to src/lib/city-registry.ts first.`
  );
}

/** Active city for this deployment */
export const cityConfig: CityConfig = resolved;
