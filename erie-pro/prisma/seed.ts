// ── Erie Pro — Database Seed Script ─────────────────────────────────
// Migrates the 6 demo providers from the original in-memory store.
// Run: npx prisma db seed
//
// WARNING: All emails below are FICTIONAL — do NOT use real business
// contact information in seed data.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaClient;

async function main() {
  console.log("Seeding Erie Pro database...");

  // ── Seed Providers ─────────────────────────────────────────────
  // These match the original 6 demo providers from provider-store.ts
  // with emails changed to clearly fake @example.com addresses.

  const providers = [
    {
      slug: "johnson-plumbing-erie",
      businessName: "Johnson Plumbing & Drain",
      niche: "plumbing",
      city: "erie",
      phone: "(814) 555-0101",
      email: "seed-plumbing@example.com",
      website: "https://erie.pro/plumbing/johnson-plumbing-erie",
      addressStreet: "1420 Peach St",
      addressCity: "Erie",
      addressState: "PA",
      addressZip: "16501",
      serviceAreas: ["Erie", "Millcreek", "Harborcreek", "Fairview"],
      description:
        "Full-service plumbing company specializing in emergency repairs, drain cleaning, water heater installation, and residential remodeling plumbing. Family-owned since 2005.",
      yearEstablished: 2005,
      employeeCount: "6-10",
      license: "PA-PLB-039271",
      insurance: true,
      tier: "primary" as const,
      subscriptionStatus: "active" as const,
      monthlyFee: 750, // Updated price from pricing overhaul
      stripeCustomerId: "cus_mock_johnson",
      stripeSubscriptionId: "sub_mock_johnson",
      totalLeads: 147,
      convertedLeads: 98,
      avgResponseTime: 420,
      avgRating: 4.7,
      reviewCount: 63,
      claimedAt: new Date("2024-06-15T10:00:00Z"),
      lastLeadAt: new Date("2026-03-28T14:30:00Z"),
    },
    {
      slug: "erie-comfort-hvac",
      businessName: "Erie Comfort HVAC",
      niche: "hvac",
      city: "erie",
      phone: "(814) 555-0301",
      email: "seed-hvac@example.com",
      website: "https://erie.pro/hvac/erie-comfort-hvac",
      addressStreet: "3205 W 26th St",
      addressCity: "Erie",
      addressState: "PA",
      addressZip: "16506",
      serviceAreas: ["Erie", "Millcreek", "Summit Township", "McKean"],
      description:
        "Heating, cooling, and indoor air quality experts. We service all makes and models. 24/7 emergency service available. EPA-certified technicians.",
      yearEstablished: 2010,
      employeeCount: "11-20",
      license: "PA-HVAC-051842",
      insurance: true,
      tier: "primary" as const,
      subscriptionStatus: "active" as const,
      monthlyFee: 750,
      stripeCustomerId: "cus_mock_eriecomfort",
      stripeSubscriptionId: "sub_mock_eriecomfort",
      totalLeads: 112,
      convertedLeads: 71,
      avgResponseTime: 600,
      avgRating: 4.5,
      reviewCount: 48,
      claimedAt: new Date("2024-07-01T09:00:00Z"),
      lastLeadAt: new Date("2026-03-27T11:15:00Z"),
    },
    {
      slug: "bayfront-electric-erie",
      businessName: "Bayfront Electric Services",
      niche: "electrical",
      city: "erie",
      phone: "(814) 555-0401",
      email: "seed-electrical@example.com",
      addressStreet: "855 E 12th St",
      addressCity: "Erie",
      addressState: "PA",
      addressZip: "16503",
      serviceAreas: ["Erie", "Harborcreek", "North East"],
      description:
        "Licensed electricians providing panel upgrades, rewiring, lighting installation, and code compliance inspections. Commercial and residential.",
      yearEstablished: 2012,
      employeeCount: "6-10",
      license: "PA-ELEC-028374",
      insurance: true,
      tier: "primary" as const,
      subscriptionStatus: "active" as const,
      monthlyFee: 700,
      totalLeads: 89,
      convertedLeads: 54,
      avgResponseTime: 540,
      avgRating: 4.4,
      reviewCount: 37,
      claimedAt: new Date("2024-08-10T14:00:00Z"),
      lastLeadAt: new Date("2026-03-26T16:45:00Z"),
    },
    {
      slug: "lakeshore-dental-erie",
      businessName: "Lakeshore Family Dental",
      niche: "dental",
      city: "erie",
      phone: "(814) 555-0501",
      email: "seed-dental@example.com",
      website: "https://erie.pro/dental/lakeshore-dental",
      addressStreet: "2500 Peach St Suite 200",
      addressCity: "Erie",
      addressState: "PA",
      addressZip: "16502",
      serviceAreas: ["Erie", "Millcreek", "Fairview", "Edinboro"],
      description:
        "Comprehensive family dental care including cleanings, cosmetic dentistry, Invisalign, dental implants, and emergency services. Accepting new patients.",
      yearEstablished: 1998,
      employeeCount: "11-20",
      license: "PA-DDS-018293",
      insurance: true,
      tier: "primary" as const,
      subscriptionStatus: "active" as const,
      monthlyFee: 1200,
      stripeCustomerId: "cus_mock_lakeshore",
      stripeSubscriptionId: "sub_mock_lakeshore",
      totalLeads: 201,
      convertedLeads: 162,
      avgResponseTime: 300,
      avgRating: 4.8,
      reviewCount: 124,
      claimedAt: new Date("2024-05-20T08:00:00Z"),
      lastLeadAt: new Date("2026-03-29T10:00:00Z"),
    },
    {
      slug: "erie-law-partners",
      businessName: "Erie Law Partners LLC",
      niche: "legal",
      city: "erie",
      phone: "(814) 555-0601",
      email: "seed-legal@example.com",
      website: "https://erie.pro/legal/erie-law-partners",
      addressStreet: "100 State St Suite 400",
      addressCity: "Erie",
      addressState: "PA",
      addressZip: "16501",
      serviceAreas: [
        "Erie",
        "Millcreek",
        "Harborcreek",
        "Fairview",
        "Summit Township",
      ],
      description:
        "Full-service law firm specializing in personal injury, family law, criminal defense, and estate planning. Free initial consultations.",
      yearEstablished: 2001,
      employeeCount: "6-10",
      license: "PA-BAR-204857",
      insurance: true,
      tier: "primary" as const,
      subscriptionStatus: "active" as const,
      monthlyFee: 1500,
      stripeCustomerId: "cus_mock_erielaw",
      stripeSubscriptionId: "sub_mock_erielaw",
      totalLeads: 95,
      convertedLeads: 58,
      avgResponseTime: 480,
      avgRating: 4.6,
      reviewCount: 41,
      claimedAt: new Date("2024-06-01T12:00:00Z"),
      lastLeadAt: new Date("2026-03-28T09:20:00Z"),
    },
    {
      slug: "great-lakes-roofing-erie",
      businessName: "Great Lakes Roofing Co.",
      niche: "roofing",
      city: "erie",
      phone: "(814) 555-0701",
      email: "seed-roofing@example.com",
      addressStreet: "4010 W Ridge Rd",
      addressCity: "Erie",
      addressState: "PA",
      addressZip: "16506",
      serviceAreas: ["Erie", "Millcreek", "Fairview", "Girard", "McKean"],
      description:
        "Trusted roofers serving Erie County for over 15 years. Shingle, metal, and flat roof installation. Storm damage restoration and insurance claim assistance.",
      yearEstablished: 2008,
      employeeCount: "11-20",
      license: "PA-ROOF-043918",
      insurance: true,
      tier: "primary" as const,
      subscriptionStatus: "active" as const,
      monthlyFee: 1000,
      totalLeads: 76,
      convertedLeads: 49,
      avgResponseTime: 720,
      avgRating: 4.3,
      reviewCount: 32,
      claimedAt: new Date("2024-09-01T10:00:00Z"),
      lastLeadAt: new Date("2026-03-25T13:00:00Z"),
    },
  ];

  for (const p of providers) {
    const provider = await prisma.provider.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
    console.log(`  Seeded provider: ${provider.businessName} (${provider.niche})`);

    // Create matching territory for each active seed provider
    await prisma.territory.upsert({
      where: {
        niche_city: { niche: p.niche, city: p.city },
      },
      update: {
        providerId: provider.id,
        tier: p.tier,
      },
      create: {
        niche: p.niche,
        city: p.city,
        providerId: provider.id,
        tier: p.tier,
        activatedAt: p.claimedAt,
      },
    });
    console.log(`  Seeded territory: ${p.niche} / ${p.city}`);
  }

  // ── Summary ────────────────────────────────────────────────────
  const providerCount = await prisma.provider.count();
  const territoryCount = await prisma.territory.count();
  console.log(`\nSeed complete: ${providerCount} providers, ${territoryCount} territories`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
