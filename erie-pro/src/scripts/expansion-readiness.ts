#!/usr/bin/env npx tsx
// ── Expansion Readiness Check ─────────────────────────────────────────
// Validates that a new city deployment is correctly configured.
// Run: npx tsx src/scripts/expansion-readiness.ts [city-slug]
//
// Uses src/lib/city-helpers.ts for the actual validation rules. Surfacing
// the same checks that show up on /admin/cities, plus registry-wide
// overlap / conflict detection.

import { getCityBySlug, getAllCities } from "../lib/city-registry";
import { niches } from "../lib/niches";
import {
  validateCityConfig,
  findCoverageOverlaps,
  findRegistryConflicts,
} from "../lib/city-helpers";

const slug = process.argv[2];

if (!slug) {
  console.log("Usage: npx tsx src/scripts/expansion-readiness.ts <city-slug>");
  console.log("\nAvailable cities:");
  for (const city of getAllCities()) {
    console.log(`  ${city.slug.padEnd(15)} ${city.name}, ${city.stateCode} — ${city.domain}`);
  }
  process.exit(0);
}

const city = getCityBySlug(slug);

if (!city) {
  console.error(`\n❌ City "${slug}" not found in registry.`);
  console.error("   Add it to src/lib/city-registry.ts first.\n");
  process.exit(1);
}

console.log(`\n🏙️  Expansion Readiness Check: ${city.name}, ${city.stateCode}\n`);

// ── Per-city validation ──────────────────────────────────────────────

const result = validateCityConfig(city);
const errors = result.issues.filter((i) => i.severity === "error");
const warnings = result.issues.filter((i) => i.severity === "warning");
const infos = result.issues.filter((i) => i.severity === "info");

console.log("─".repeat(60));
console.log("Per-city validation");
console.log("─".repeat(60));
if (errors.length === 0 && warnings.length === 0 && infos.length === 0) {
  console.log("  ✅ All checks pass.");
} else {
  for (const e of errors) {
    console.log(`  ❌ [error]   ${e.field.padEnd(24)} ${e.message}`);
  }
  for (const w of warnings) {
    console.log(`  ⚠️  [warning] ${w.field.padEnd(24)} ${w.message}`);
  }
  for (const i of infos) {
    console.log(`  ℹ️  [info]    ${i.field.padEnd(24)} ${i.message}`);
  }
}

// ── Registry-wide checks ─────────────────────────────────────────────

const allCities = getAllCities();
const conflicts = findRegistryConflicts(allCities);
const overlaps = findCoverageOverlaps(allCities).filter((o) =>
  o.cities.includes(slug)
);

console.log("\n" + "─".repeat(60));
console.log("Registry-wide checks");
console.log("─".repeat(60));

if (conflicts.length > 0) {
  for (const c of conflicts) {
    const involved = c.cities.includes(slug) ? " (involves this city)" : "";
    console.log(
      `  ❌ ${c.type === "duplicate_slug" ? "Duplicate slug" : "Duplicate domain"} "${c.value}" → ${c.cities.join(", ")}${involved}`
    );
  }
} else {
  console.log("  ✅ No registry-wide slug/domain conflicts.");
}

if (overlaps.length > 0) {
  console.log(`\n  ZIP coverage overlaps involving ${slug}:`);
  for (const o of overlaps) {
    const others = o.cities.filter((c) => c !== slug);
    console.log(`    ${o.zip} → also served by ${others.join(", ")}`);
  }
  console.log(
    "  (Overlaps may be intentional — county-adjacent ZIPs. Review case-by-case.)"
  );
} else {
  console.log("  ✅ No ZIP coverage overlap with other cities.");
}

// ── Summary + deploy steps ───────────────────────────────────────────

const nicheCount = niches.length;
console.log("\n" + "─".repeat(60));
console.log("Summary");
console.log("─".repeat(60));
console.log(`  Domain:          ${city.domain}`);
console.log(`  Population:      ${city.population.toLocaleString()}`);
console.log(`  Coverage ZIPs:   ${(city.coverageZips ?? []).length}`);
console.log(`  Service area:    ${city.serviceArea.length} communities`);
console.log(`  Niches:          ${nicheCount} (${nicheCount * 15} total pages)`);
console.log(`  Price multiplier:${city.pricingMultiplier}x`);

if (errors.length > 0) {
  console.log(
    `\n❌ ${errors.length} error(s) must be fixed before deploying ${city.name}.\n`
  );
  process.exit(1);
}

if (warnings.length > 0) {
  console.log(
    `\n⚠️  ${warnings.length} warning(s) — review before deploying ${city.name}.\n`
  );
}

console.log(`\n✅ ${city.name} is ready for deployment.\n`);
console.log("Deploy steps:");
console.log(`  1. Register domain: ${city.domain}`);
console.log(`  2. Create Vercel project with env CITY_SLUG=${city.slug}`);
console.log(`  3. Set DATABASE_URL for the city's database`);
console.log("  4. Run: npx prisma migrate deploy");
console.log("  5. Run: npx tsx src/scripts/stripe-setup.ts");
console.log("  6. Deploy: vercel --prod\n");
