import "dotenv/config";
import { prisma } from "../packages/schemas/src/db.js";
import { loadAgentDefinitions } from "../packages/agents/src/loader.js";
import { loadMasterVideoTypes } from "../packages/video-catalog/src/loader.js";
import { getToolRegistry } from "../packages/tool-registry/src/loader.js";
import { PRICING_PLANS } from "../packages/billing/src/plans.js";

async function seedTenants() {
  const tenants = [
    { slug: "kwode-video-factory", name: "Kwode Video Factory", kind: "internal" },
    { slug: "erie-pro", name: "Erie.pro", kind: "erie-pro" },
    { slug: "yourdeputy", name: "YourDeputy", kind: "yourdeputy" },
  ];
  for (const t of tenants) {
    await prisma.tenant.upsert({
      where: { slug: t.slug },
      create: t,
      update: t,
    });
  }
  console.log(`✓ Seeded ${tenants.length} tenants`);
}

async function seedAgents() {
  const defs = loadAgentDefinitions();
  for (const a of defs) {
    await prisma.agentDefinition.upsert({
      where: { id: a.agent_id },
      create: {
        id: a.agent_id,
        name: a.name,
        department: a.department,
        mission: a.mission,
        responsibilities: a.responsibilities as object,
        inputs: a.inputs as object,
        outputs: a.outputs as object,
        toolsAllowed: a.tools_allowed as object,
        toolsDisallowed: a.tools_disallowed as object,
        memoryScope: a.memory_scope,
        escalationRules: a.escalation_rules as object,
        qualityGates: a.quality_gates as object,
        successMetrics: a.success_metrics as object,
        promptTemplate: a.prompt_template,
        exampleTasks: a.example_tasks as object,
        source: "yaml",
      },
      update: {
        name: a.name,
        department: a.department,
        mission: a.mission,
        responsibilities: a.responsibilities as object,
        inputs: a.inputs as object,
        outputs: a.outputs as object,
        toolsAllowed: a.tools_allowed as object,
        toolsDisallowed: a.tools_disallowed as object,
        memoryScope: a.memory_scope,
        escalationRules: a.escalation_rules as object,
        qualityGates: a.quality_gates as object,
        successMetrics: a.success_metrics as object,
        promptTemplate: a.prompt_template,
        exampleTasks: a.example_tasks as object,
      },
    });
  }
  console.log(`✓ Seeded ${defs.length} agent definitions`);
}

async function seedTools() {
  const tools = getToolRegistry();
  for (const t of tools) {
    await prisma.toolRegistry.upsert({
      where: { id: t.tool_id },
      create: {
        id: t.tool_id,
        name: t.name,
        category: t.category,
        roleInFactory: t.role_in_video_factory ?? null,
        bestUseCases: (t.best_use_cases ?? []) as object,
        inputTypes: (t.input_types ?? []) as object,
        outputTypes: (t.output_types ?? []) as object,
        automationPossible: !!t.automation_possible,
        apiAvailable: t.api_available ?? "unknown",
        manualWorkflow: t.manual_workflow_supported ?? true,
        connectorStatus: t.connector_status ?? "planned",
        envKeys: (t.env_keys ?? []) as object,
        notes: t.notes ?? null,
      },
      update: {
        name: t.name,
        category: t.category,
        roleInFactory: t.role_in_video_factory ?? null,
        bestUseCases: (t.best_use_cases ?? []) as object,
        inputTypes: (t.input_types ?? []) as object,
        outputTypes: (t.output_types ?? []) as object,
        automationPossible: !!t.automation_possible,
        apiAvailable: t.api_available ?? "unknown",
        manualWorkflow: t.manual_workflow_supported ?? true,
        connectorStatus: t.connector_status ?? "planned",
        envKeys: (t.env_keys ?? []) as object,
        notes: t.notes ?? null,
      },
    });
  }
  console.log(`✓ Seeded ${tools.length} tools`);
}

async function seedPricingPlans() {
  for (const p of PRICING_PLANS) {
    await prisma.pricingPlan.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        cadence: p.cadence,
        priceUSD: p.priceUSDCents,
        description: p.description ?? null,
        features: p.features as object,
        metadata: (p.scope ?? {}) as object,
      },
      update: {
        name: p.name,
        cadence: p.cadence,
        priceUSD: p.priceUSDCents,
        description: p.description ?? null,
        features: p.features as object,
        metadata: (p.scope ?? {}) as object,
      },
    });
  }
  console.log(`✓ Seeded ${PRICING_PLANS.length} pricing plans`);
}

async function seedDemoClientsAndJobs() {
  const kwode = await prisma.tenant.findUniqueOrThrow({ where: { slug: "kwode-video-factory" } });
  const eriePro = await prisma.tenant.findUniqueOrThrow({ where: { slug: "erie-pro" } });
  const yourDeputy = await prisma.tenant.findUniqueOrThrow({ where: { slug: "yourdeputy" } });

  const clients = [
    { tenantId: eriePro.id, name: "Erie Plumbing Demo", niche: "plumbing", phone: "+18142000328" },
    { tenantId: eriePro.id, name: "Erie HVAC Demo", niche: "hvac", phone: "+18142000328" },
    { tenantId: eriePro.id, name: "Erie Roofing Demo", niche: "roofing", phone: "+18142000328" },
  ];

  const createdClients: Record<string, { id: string; name: string }> = {};
  for (const c of clients) {
    const existing = await prisma.client.findFirst({
      where: { tenantId: c.tenantId, name: c.name },
    });
    const client =
      existing ??
      (await prisma.client.create({
        data: { tenantId: c.tenantId, name: c.name, phone: c.phone, metadata: { niche: c.niche } },
      }));
    createdClients[c.name] = { id: client.id, name: client.name };

    // Brand profile
    const existingBrand = await prisma.brandProfile.findUnique({ where: { clientId: client.id } });
    if (!existingBrand) {
      await prisma.brandProfile.create({
        data: {
          tenantId: c.tenantId,
          clientId: client.id,
          brandName: c.name,
          voiceTone: "warm, confident, neighborly",
          palette: { primary: "#0F4C81", accent: "#FFB400" } as object,
          forbidden: ["guaranteed cheapest", "medical claims"] as object,
          proofPoints: [
            "Locally owned",
            "Licensed & insured",
            "Same-day appointments",
          ] as object,
        },
      });
    }
  }
  console.log(`✓ Seeded ${clients.length} demo clients + brand profiles`);

  const demoJobs = [
    {
      tenantId: eriePro.id,
      clientName: "Erie Plumbing Demo",
      videoTypeId: "service-explainer",
      title: "Emergency plumbing visibility video",
      metadata: {
        intake: { audience: "Erie homeowners", goal: "Drive emergency calls", cta: "Call (814) 200-0328", durationSec: 45, aspectRatio: "9:16" },
      },
    },
    {
      tenantId: eriePro.id,
      clientName: "Erie HVAC Demo",
      videoTypeId: "service-explainer",
      title: "HVAC seasonal tune-up video",
      metadata: {
        intake: { audience: "Homeowners ahead of winter", goal: "Book tune-ups", cta: "Schedule online", durationSec: 60, aspectRatio: "16:9" },
      },
    },
    {
      tenantId: eriePro.id,
      clientName: "Erie Roofing Demo",
      videoTypeId: "before-after",
      title: "Roofing storm damage before/after",
      metadata: {
        intake: { audience: "Storm-affected homeowners", goal: "Generate inspection requests", cta: "Free inspection", durationSec: 30, aspectRatio: "9:16" },
      },
    },
    {
      tenantId: eriePro.id,
      clientName: "Erie Plumbing Demo",
      videoTypeId: "directory-listing",
      title: "Erie.pro premium provider explainer",
      metadata: {
        intake: { audience: "Directory visitors", goal: "Drive call from listing page", cta: "View profile", durationSec: 45, aspectRatio: "16:9" },
      },
    },
    {
      tenantId: yourDeputy.id,
      clientName: null,
      videoTypeId: "product-explainer",
      title: "YourDeputy Lead Capture Pack explainer",
      metadata: {
        intake: { audience: "Local service business owners", goal: "Sell Lead Capture Pack", cta: "Start free trial", durationSec: 90, aspectRatio: "16:9" },
      },
    },
    {
      tenantId: kwode.id,
      clientName: null,
      videoTypeId: "faith-inspirational",
      title: "Arise and Shine — inspirational story",
      metadata: {
        intake: { audience: "General faith audience", goal: "Inspirational engagement", cta: "Share with someone", durationSec: 120, aspectRatio: "9:16" },
      },
    },
    {
      tenantId: kwode.id,
      clientName: null,
      videoTypeId: "manufacturing-training",
      title: "Manufacturing safety training: LOTO refresher",
      metadata: {
        intake: { audience: "Plant workforce", goal: "Refresher training", cta: "Complete quiz", durationSec: 480, aspectRatio: "16:9" },
      },
    },
  ];

  let count = 0;
  for (const dj of demoJobs) {
    const clientId = dj.clientName ? createdClients[dj.clientName]?.id : undefined;
    const existing = await prisma.videoJob.findFirst({
      where: { title: dj.title, tenantId: dj.tenantId },
    });
    if (existing) continue;
    await prisma.videoJob.create({
      data: {
        tenantId: dj.tenantId,
        clientId: clientId ?? null,
        videoTypeId: dj.videoTypeId,
        title: dj.title,
        status: "draft",
        metadata: dj.metadata as unknown as object,
      },
    });
    count++;
  }
  console.log(`✓ Seeded ${count} new demo video jobs`);
}

async function seedVideoTypes() {
  // Loader is read-only; just call it so the file parses at seed time.
  const types = loadMasterVideoTypes();
  console.log(`✓ Loaded ${types.length} video types from catalog`);
}

async function main(): Promise<void> {
  console.log("\nSeeding Kwode Video Factory...\n");
  await seedTenants();
  await seedAgents();
  await seedTools();
  await seedPricingPlans();
  await seedVideoTypes();
  await seedDemoClientsAndJobs();
  console.log("\n✓ Seed complete\n");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
