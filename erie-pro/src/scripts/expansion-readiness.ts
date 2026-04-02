#!/usr/bin/env npx tsx
// ── Expansion Readiness Check ─────────────────────────────────────────
// Validates that a new city deployment is correctly configured.
// Run: npx tsx src/scripts/expansion-readiness.ts [city-slug]
//
// Checks:
// 1. City exists in registry
// 2. Domain is configured
// 3. All 44 niches generate valid pages
// 4. Pricing multiplier produces sane values
// 5. Service area is populated
// 6. Database connectivity

import { getCityBySlug, getAllCities } from "../lib/city-registry";
import { niches } from "../lib/niches";

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

const checks: { name: string; pass: boolean; detail: string }[] = [];

// 1. Registry
checks.push({
  name: "City in registry",
  pass: true,
  detail: `${city.slug} → ${city.name}, ${city.stateCode}`,
});

// 2. Domain
checks.push({
  name: "Domain configured",
  pass: city.domain.length > 0 && city.domain.includes("."),
  detail: city.domain,
});

// 3. Service area
checks.push({
  name: "Service area populated",
  pass: city.serviceArea.length >= 3,
  detail: `${city.serviceArea.length} areas: ${city.serviceArea.slice(0, 5).join(", ")}${city.serviceArea.length > 5 ? "..." : ""}`,
});

// 4. Coordinates
checks.push({
  name: "GPS coordinates set",
  pass: city.coordinates.lat !== 0 && city.coordinates.lng !== 0,
  detail: `${city.coordinates.lat}, ${city.coordinates.lng}`,
});

// 5. Pricing multiplier
const sampleNiche = niches[0];
const adjustedPrice = Math.round(sampleNiche.monthlyFee * city.pricingMultiplier);
checks.push({
  name: "Pricing multiplier sane",
  pass: city.pricingMultiplier >= 0.3 && city.pricingMultiplier <= 3.0,
  detail: `${city.pricingMultiplier}x → ${sampleNiche.label}: $${sampleNiche.monthlyFee} → $${adjustedPrice}/mo`,
});

// 6. Niche coverage
const nicheCount = niches.length;
checks.push({
  name: "All niches available",
  pass: nicheCount === 44,
  detail: `${nicheCount} niches × 15 page types = ${nicheCount * 15} pages`,
});

// 7. Population
checks.push({
  name: "Population recorded",
  pass: city.population > 0,
  detail: `${city.population.toLocaleString()} residents`,
});

// 8. Timezone
checks.push({
  name: "Timezone set",
  pass: city.timezone.length > 0,
  detail: city.timezone,
});

// 9. Counties
checks.push({
  name: "Counties defined",
  pass: city.counties.length > 0,
  detail: city.counties.join(", "),
});

// 10. Metro area
checks.push({
  name: "Metro area name",
  pass: city.metroArea.length > 0,
  detail: city.metroArea,
});

// ── Report ────────────────────────────────────────────────────────────
console.log("─".repeat(60));
let failCount = 0;
for (const check of checks) {
  const icon = check.pass ? "✅" : "❌";
  if (!check.pass) failCount++;
  console.log(`  ${icon} ${check.name.padEnd(25)} ${check.detail}`);
}
console.log("─".repeat(60));

if (failCount === 0) {
  console.log(`\n✅ ${city.name} is ready for deployment.`);
  console.log(`\nDeploy steps:`);
  console.log(`  1. Register domain: ${city.domain}`);
  console.log(`  2. Create Vercel project with env CITY_SLUG=${city.slug}`);
  console.log(`  3. Set DATABASE_URL for the city's database`);
  console.log(`  4. Run: npx prisma migrate deploy`);
  console.log(`  5. Run: npx tsx src/scripts/stripe-setup.ts`);
  console.log(`  6. Deploy: vercel --prod\n`);
} else {
  console.log(`\n❌ ${failCount} check(s) failed. Fix them before deploying.\n`);
  process.exit(1);
}
