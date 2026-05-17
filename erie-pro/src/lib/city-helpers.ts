// ── City helpers ─────────────────────────────────────────────────────
// Validation, normalization, and reverse-lookup utilities for the
// multi-city deployment framework. The city registry in city-registry.ts
// stores raw config; these helpers ensure config is well-formed and
// surface conflicts before a new city goes live.

import type { CityConfig } from "@/lib/city-registry";

// ── Validation ───────────────────────────────────────────────────────

export type Severity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: Severity;
  field: string;
  message: string;
}

export interface CityValidationResult {
  city: string; // slug
  ok: boolean; // true iff no errors (warnings still ok)
  issues: ValidationIssue[];
}

const SLUG_RE = /^[a-z][a-z0-9-]{1,40}$/;
const ZIP_RE = /^\d{5}$/;
const STATE_CODE_RE = /^[A-Z]{2}$/;
const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/;
const IANA_TZ_RE = /^[A-Za-z]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/;

export function validateCityConfig(city: CityConfig): CityValidationResult {
  const issues: ValidationIssue[] = [];

  // ── Slug ─────────────────────────────────────────────────────────
  if (!city.slug) {
    issues.push({ severity: "error", field: "slug", message: "slug is required" });
  } else if (!SLUG_RE.test(city.slug)) {
    issues.push({
      severity: "error",
      field: "slug",
      message: `slug "${city.slug}" must be lowercase letters/numbers/hyphens, 2-41 chars, starting with a letter`,
    });
  }

  // ── Name + state ─────────────────────────────────────────────────
  if (!city.name || city.name.length < 2) {
    issues.push({ severity: "error", field: "name", message: "name is required (≥2 chars)" });
  }
  if (!STATE_CODE_RE.test(city.stateCode ?? "")) {
    issues.push({
      severity: "error",
      field: "stateCode",
      message: `stateCode "${city.stateCode}" must be a 2-letter uppercase code (e.g. PA, OH, NY)`,
    });
  }
  if (!city.state) {
    issues.push({ severity: "error", field: "state", message: "state (full name) is required" });
  }

  // ── Domain ───────────────────────────────────────────────────────
  if (!city.domain) {
    issues.push({ severity: "error", field: "domain", message: "domain is required" });
  } else if (!DOMAIN_RE.test(city.domain)) {
    issues.push({
      severity: "error",
      field: "domain",
      message: `domain "${city.domain}" doesn't look like a valid hostname`,
    });
  }

  // ── Coordinates ──────────────────────────────────────────────────
  if (!city.coordinates) {
    issues.push({ severity: "error", field: "coordinates", message: "coordinates required" });
  } else {
    const { lat, lng } = city.coordinates;
    if (typeof lat !== "number" || lat < -90 || lat > 90) {
      issues.push({
        severity: "error",
        field: "coordinates.lat",
        message: `latitude ${lat} out of valid range (-90..90)`,
      });
    }
    if (typeof lng !== "number" || lng < -180 || lng > 180) {
      issues.push({
        severity: "error",
        field: "coordinates.lng",
        message: `longitude ${lng} out of valid range (-180..180)`,
      });
    }
    // Soft check: US bounding box (-130..-65 lng, 24..50 lat). Warn for
    // anything outside since cross-country expansion isn't yet supported.
    if (
      typeof lat === "number" && typeof lng === "number" &&
      (lat < 24 || lat > 50 || lng < -130 || lng > -65)
    ) {
      issues.push({
        severity: "warning",
        field: "coordinates",
        message: `coordinates (${lat}, ${lng}) fall outside the continental US`,
      });
    }
  }

  // ── Population ───────────────────────────────────────────────────
  if (typeof city.population !== "number" || city.population <= 0) {
    issues.push({
      severity: "warning",
      field: "population",
      message: "population should be a positive number (used for market sizing)",
    });
  } else if (city.population < 5000) {
    issues.push({
      severity: "warning",
      field: "population",
      message: `population ${city.population.toLocaleString()} is quite small; lead volume may not justify infrastructure`,
    });
  }

  // ── Timezone ─────────────────────────────────────────────────────
  if (!city.timezone) {
    issues.push({ severity: "error", field: "timezone", message: "timezone (IANA name) is required" });
  } else if (!IANA_TZ_RE.test(city.timezone)) {
    issues.push({
      severity: "warning",
      field: "timezone",
      message: `timezone "${city.timezone}" doesn't look like an IANA name (e.g. America/New_York)`,
    });
  }

  // ── Pricing multiplier ───────────────────────────────────────────
  if (typeof city.pricingMultiplier !== "number" || city.pricingMultiplier <= 0) {
    issues.push({
      severity: "error",
      field: "pricingMultiplier",
      message: "pricingMultiplier must be a positive number",
    });
  } else if (city.pricingMultiplier > 2 || city.pricingMultiplier < 0.3) {
    issues.push({
      severity: "warning",
      field: "pricingMultiplier",
      message: `pricingMultiplier ${city.pricingMultiplier} is outside typical 0.3-2.0 range; double-check`,
    });
  }

  // ── Service area ─────────────────────────────────────────────────
  if (!Array.isArray(city.serviceArea) || city.serviceArea.length === 0) {
    issues.push({
      severity: "error",
      field: "serviceArea",
      message: "serviceArea must list at least one community",
    });
  }

  // ── Coverage ZIPs ────────────────────────────────────────────────
  if (city.coverageZips !== undefined) {
    if (!Array.isArray(city.coverageZips)) {
      issues.push({
        severity: "error",
        field: "coverageZips",
        message: "coverageZips must be an array of 5-digit strings",
      });
    } else {
      for (const zip of city.coverageZips) {
        if (!ZIP_RE.test(zip)) {
          issues.push({
            severity: "error",
            field: "coverageZips",
            message: `ZIP "${zip}" must be exactly 5 digits`,
          });
        }
      }
      const dupes = findDuplicates(city.coverageZips);
      if (dupes.length > 0) {
        issues.push({
          severity: "warning",
          field: "coverageZips",
          message: `duplicate ZIP(s): ${dupes.join(", ")}`,
        });
      }
    }
  }

  // ── Overlap areas ────────────────────────────────────────────────
  if (city.overlapAreas !== undefined) {
    for (let i = 0; i < city.overlapAreas.length; i++) {
      const oa = city.overlapAreas[i];
      if (!STATE_CODE_RE.test(oa.stateCode)) {
        issues.push({
          severity: "error",
          field: `overlapAreas[${i}].stateCode`,
          message: `stateCode "${oa.stateCode}" must be 2 uppercase letters`,
        });
      }
      if (!ZIP_RE.test(oa.zip)) {
        issues.push({
          severity: "error",
          field: `overlapAreas[${i}].zip`,
          message: `ZIP "${oa.zip}" must be 5 digits`,
        });
      }
      if (!oa.city || oa.city.length < 2) {
        issues.push({
          severity: "error",
          field: `overlapAreas[${i}].city`,
          message: "city name is required for overlap entry",
        });
      }
    }
  }

  // ── Pilot categories ─────────────────────────────────────────────
  if (city.pilotCategories !== undefined) {
    if (!Array.isArray(city.pilotCategories) || city.pilotCategories.length === 0) {
      issues.push({
        severity: "warning",
        field: "pilotCategories",
        message: "pilotCategories should list ≥1 niche; otherwise homepage will not feature anything",
      });
    } else if (city.pilotCategories.length > 8) {
      issues.push({
        severity: "info",
        field: "pilotCategories",
        message: `${city.pilotCategories.length} pilot categories — homepage will feel cluttered above 8`,
      });
    }
  }

  const ok = !issues.some((i) => i.severity === "error");
  return { city: city.slug, ok, issues };
}

function findDuplicates<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const dupes = new Set<T>();
  for (const x of arr) {
    if (seen.has(x)) dupes.add(x);
    seen.add(x);
  }
  return Array.from(dupes);
}

// ── Normalization ────────────────────────────────────────────────────

/**
 * Returns a copy of the city config with optional fields defaulted to
 * empty arrays. Used by downstream code that doesn't want to do
 * `?? []` everywhere.
 */
export function normalizeCityConfig(city: CityConfig): Required<CityConfig> {
  return {
    ...city,
    coverageZips: city.coverageZips ?? [],
    overlapAreas: city.overlapAreas ?? [],
    pilotCategories: city.pilotCategories ?? [],
  };
}

// ── Cross-city analysis ──────────────────────────────────────────────

export interface ZipOverlap {
  zip: string;
  cities: string[]; // slugs
}

/**
 * Find ZIPs that appear in MORE THAN ONE city's coverage. These are
 * not necessarily a bug — county-overlap ZIPs (like Cambridge Springs
 * 16403 between Erie and Meadville) are deliberate — but they should
 * be reviewed during expansion.
 *
 * Also considers overlapAreas: if City A has an overlapArea ZIP that
 * matches City B's coverageZip, that's an intentional overlap and is
 * NOT flagged. Only true coverage-coverage overlaps are returned.
 */
export function findCoverageOverlaps(cities: readonly CityConfig[]): ZipOverlap[] {
  const zipToCities = new Map<string, Set<string>>();
  for (const city of cities) {
    for (const zip of city.coverageZips ?? []) {
      if (!zipToCities.has(zip)) zipToCities.set(zip, new Set());
      zipToCities.get(zip)!.add(city.slug);
    }
  }
  const overlaps: ZipOverlap[] = [];
  for (const [zip, slugs] of zipToCities.entries()) {
    if (slugs.size > 1) {
      overlaps.push({ zip, cities: Array.from(slugs).sort() });
    }
  }
  return overlaps.sort((a, b) => a.zip.localeCompare(b.zip));
}

/**
 * Reverse-lookup: which city serves this ZIP? Returns null when no
 * city's coverageZips includes it (caller should default to the main
 * city or show an "out of service area" message).
 */
export function findCityByZip(
  cities: readonly CityConfig[],
  zip: string
): CityConfig | null {
  if (!ZIP_RE.test(zip)) return null;
  for (const city of cities) {
    if ((city.coverageZips ?? []).includes(zip)) return city;
  }
  return null;
}

/**
 * Check that two cities don't claim the same slug or domain.
 * Returns an array of conflicts; empty array = healthy.
 */
export interface RegistryConflict {
  type: "duplicate_slug" | "duplicate_domain";
  value: string;
  cities: string[];
}

export function findRegistryConflicts(cities: readonly CityConfig[]): RegistryConflict[] {
  const conflicts: RegistryConflict[] = [];
  const slugToCities = new Map<string, string[]>();
  const domainToCities = new Map<string, string[]>();
  for (const c of cities) {
    if (c.slug) {
      if (!slugToCities.has(c.slug)) slugToCities.set(c.slug, []);
      slugToCities.get(c.slug)!.push(c.slug);
    }
    if (c.domain) {
      if (!domainToCities.has(c.domain)) domainToCities.set(c.domain, []);
      domainToCities.get(c.domain)!.push(c.slug);
    }
  }
  for (const [slug, slugs] of slugToCities.entries()) {
    if (slugs.length > 1) conflicts.push({ type: "duplicate_slug", value: slug, cities: slugs });
  }
  for (const [domain, slugs] of domainToCities.entries()) {
    if (slugs.length > 1) conflicts.push({ type: "duplicate_domain", value: domain, cities: slugs });
  }
  return conflicts;
}

// ── Convenience: validate the whole registry ────────────────────────

export interface RegistryHealthReport {
  totalCities: number;
  citiesWithErrors: number;
  citiesWithWarnings: number;
  conflicts: RegistryConflict[];
  coverageOverlaps: ZipOverlap[];
  perCity: CityValidationResult[];
}

export function evaluateRegistryHealth(
  cities: readonly CityConfig[]
): RegistryHealthReport {
  const perCity = cities.map(validateCityConfig);
  return {
    totalCities: cities.length,
    citiesWithErrors: perCity.filter((r) => !r.ok).length,
    citiesWithWarnings: perCity.filter((r) =>
      r.issues.some((i) => i.severity === "warning")
    ).length,
    conflicts: findRegistryConflicts(cities),
    coverageOverlaps: findCoverageOverlaps(cities),
    perCity,
  };
}
