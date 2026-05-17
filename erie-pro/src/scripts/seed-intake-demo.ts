// ── seed-intake-demo ─────────────────────────────────────────────────
// Populates intake_conversations (and linked leads) with realistic
// demo data so the analytics dashboard at /admin/intake-analytics has
// something meaningful to render in dev / staging.
//
// Usage:
//   npx tsx src/scripts/seed-intake-demo.ts --count 200 --days 30 --seed 42 --dry-run
//   npx tsx src/scripts/seed-intake-demo.ts --count 200 --days 30 --confirm
//   npx tsx src/scripts/seed-intake-demo.ts --clean --confirm
//
// Demo data is tagged with `ipPrefix = "demo:"` and emails ending in
// "@erie.pro.demo" so --clean can remove it without touching real rows.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  makePrng,
  pickNiche,
  decideFunnelOutcome,
  buildConversation,
  generateCreatedAt,
} from "@/lib/intake/demo-data";

interface CliArgs {
  count: number;
  days: number;
  seed: number;
  niceCorrectionRate: number;
  dryRun: boolean;
  confirm: boolean;
  clean: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    count: 200,
    days: 30,
    seed: 42,
    niceCorrectionRate: 0.12, // ~12% of conversations include a did-you-mean switch
    dryRun: false,
    confirm: false,
    clean: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--count") args.count = parseInt(argv[++i] ?? "200", 10);
    else if (a === "--days") args.days = parseInt(argv[++i] ?? "30", 10);
    else if (a === "--seed") args.seed = parseInt(argv[++i] ?? "42", 10);
    else if (a === "--switch-rate") args.niceCorrectionRate = parseFloat(argv[++i] ?? "0.12");
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--confirm") args.confirm = true;
    else if (a === "--clean") args.clean = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        [
          "seed-intake-demo — populate intake_conversations with realistic demo rows",
          "",
          "Usage:",
          "  npx tsx src/scripts/seed-intake-demo.ts --dry-run        # preview only",
          "  npx tsx src/scripts/seed-intake-demo.ts --confirm        # actually write",
          "  npx tsx src/scripts/seed-intake-demo.ts --clean --confirm   # remove demo data",
          "",
          "Options:",
          "  --count <n>          Number of conversations to generate (default 200)",
          "  --days <n>           Spread across past N days (default 30)",
          "  --seed <n>           PRNG seed for reproducibility (default 42)",
          "  --switch-rate <f>    Fraction with did-you-mean switch (default 0.12)",
          "  --dry-run            Print a summary without writing to DB",
          "  --confirm            Required for any real write (writes + cleans)",
          "  --clean              Delete demo data (ipPrefix=\"demo:\")",
          "",
          "Demo data is tagged so --clean only removes seeded rows.",
        ].join("\n")
      );
      process.exit(0);
    }
  }
  return args;
}

// ── DB setup (deferred — only connects when actually writing) ────────

const DEMO_IP_PREFIX = "demo:";

function getPrisma(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set in .env.local");
    process.exit(1);
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

// ── Clean ────────────────────────────────────────────────────────────

async function cleanDemoData(prisma: PrismaClient) {
  console.log(`Removing rows where ipPrefix starts with "${DEMO_IP_PREFIX}"...`);
  const convs = await prisma.intakeConversation.findMany({
    where: { ipPrefix: { startsWith: DEMO_IP_PREFIX } },
    select: { id: true, leadId: true },
  });
  console.log(`  Found ${convs.length} demo conversations`);

  // Delete linked leads first (foreign-key safety)
  const leadIds = convs.map((c) => c.leadId).filter((id): id is string => Boolean(id));
  if (leadIds.length > 0) {
    const deletedLeads = await prisma.lead.deleteMany({
      where: { id: { in: leadIds } },
    });
    console.log(`  Deleted ${deletedLeads.count} linked demo leads`);
  }

  const deletedConvs = await prisma.intakeConversation.deleteMany({
    where: { ipPrefix: { startsWith: DEMO_IP_PREFIX } },
  });
  console.log(`  Deleted ${deletedConvs.count} demo conversations`);
}

// ── Generate + write ─────────────────────────────────────────────────

async function generate(args: CliArgs, prisma: PrismaClient | null) {
  const rng = makePrng(args.seed);
  const now = new Date();

  console.log(`\nGenerating ${args.count} demo conversations over the past ${args.days} days...`);
  console.log(`  Seed: ${args.seed}  ·  Switch rate: ${(args.niceCorrectionRate * 100).toFixed(0)}%\n`);

  const summary = {
    completed: 0,
    abandoned: 0,
    in_progress: 0,
    error: 0,
    orphan_completed: 0,
    niche_switches: 0,
    leads_created: 0,
  };

  const byNiche: Record<string, number> = {};

  for (let i = 0; i < args.count; i++) {
    const niche = pickNiche(rng);
    const { furthestStep, outcomeStatus } = decideFunnelOutcome(rng);
    const createdAt = generateCreatedAt(rng, args.days, now);
    const includeNicheSwitch = rng() < args.niceCorrectionRate && furthestStep !== "problem";

    const c = buildConversation(rng, {
      niche,
      furthestStep,
      outcomeStatus,
      includeNicheSwitch,
      createdAt,
    });

    summary[outcomeStatus]++;
    if (c.isOrphan) summary.orphan_completed++;
    if (includeNicheSwitch) summary.niche_switches++;
    byNiche[niche] = (byNiche[niche] ?? 0) + 1;

    if (!args.dryRun) {
      if (!prisma) throw new Error("prisma should be initialized for non-dry-run");
      // Create Lead first if applicable, then conversation linked to it
      let leadId: string | null = null;
      if (c.createLead && c.contact) {
        const lead = await prisma.lead.create({
          data: {
            niche: c.outcome.primaryNiche ?? niche, // use final niche (post-switch)
            city: "erie",
            firstName: c.contact.firstName,
            lastName: c.contact.lastName,
            email: c.contact.email,
            phone: c.contact.phone,
            message: c.outcome.problemDescription ?? "",
            source: "erie-pro-demo",
            createdAt: c.updatedAt,
            updatedAt: c.updatedAt,
          },
        });
        leadId = lead.id;
        summary.leads_created++;
      }

      await prisma.intakeConversation.create({
        data: {
          citySlug: "erie",
          startedFromNicheSlug: c.startedFromNicheSlug,
          currentStep: c.currentStep,
          messages: c.messages as unknown as object,
          outcome: c.outcome as unknown as object,
          variant: "intake",
          outcomeStatus: c.outcomeStatus,
          leadId,
          ipPrefix: `${DEMO_IP_PREFIX}seed${args.seed}`,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        },
      });
    }

    if ((i + 1) % 25 === 0) {
      process.stdout.write(`  ${i + 1} / ${args.count}\r`);
    }
  }

  console.log(`\n\nSummary:`);
  console.log(`  Completed:        ${summary.completed} (${((summary.completed / args.count) * 100).toFixed(1)}%)`);
  console.log(`  Abandoned:        ${summary.abandoned} (${((summary.abandoned / args.count) * 100).toFixed(1)}%)`);
  console.log(`  In progress:      ${summary.in_progress}`);
  console.log(`  Errored:          ${summary.error}`);
  console.log(`  Orphan-completed: ${summary.orphan_completed} (intentional for analytics alarm testing)`);
  console.log(`  Niche switches:   ${summary.niche_switches} (did-you-mean usage)`);
  console.log(`  Leads created:    ${summary.leads_created}\n`);

  const topNiches = Object.entries(byNiche)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log(`Top niches by volume:`);
  for (const [niche, count] of topNiches) {
    console.log(`  ${niche.padEnd(20)} ${count}`);
  }

  if (args.dryRun) {
    console.log("\n(dry-run — no rows written. Add --confirm to actually write.)");
  } else {
    console.log("\nWritten. View at /admin/intake-analytics.");
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Only initialize the DB connection when we're actually going to use it
  const prisma = args.dryRun ? null : getPrisma();

  try {
    if (args.clean) {
      if (!args.confirm) {
        console.error("--clean requires --confirm (destructive action)");
        process.exit(1);
      }
      await cleanDemoData(prisma!);
      return;
    }

    if (!args.dryRun && !args.confirm) {
      console.error(
        "Either --dry-run (preview) or --confirm (write to DB) is required.\n" +
          "Use --help for usage."
      );
      process.exit(1);
    }

    await generate(args, prisma);
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
