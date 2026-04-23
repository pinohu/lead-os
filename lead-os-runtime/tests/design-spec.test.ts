import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDesignSpec,
  validateDesignSpec,
  generateSystemConfig,
  generateDesignSpecTemplate,
  diffSpecs,
  type DesignSpec,
} from "../src/lib/design-spec.ts";

function buildValidSpec(overrides?: Partial<DesignSpec>): DesignSpec {
  return {
    niche: {
      name: "Plumbing Services",
      industry: "construction",
      icp: {
        painPoints: ["Slow response times losing customers"],
        urgencyTriggers: ["Emergency calls going unanswered"],
        demographics: "Small business owners",
      },
    },
    ingress: {
      channels: [
        {
          type: "seo",
          intentLevel: "high",
          funnelType: "direct-conversion",
          keywords: ["plumber near me", "emergency plumbing"],
        },
        {
          type: "paid-search",
          intentLevel: "high",
          funnelType: "direct-conversion",
          budget: 500,
        },
      ],
      defaultFunnel: "main-qual",
    },
    funnels: [
      {
        id: "main-qual",
        name: "Plumbing Qualification",
        type: "direct-conversion",
        steps: [
          { id: "landing", type: "landing_page", content: "Plumbing landing" },
          { id: "assess", type: "assessment_node" },
          { id: "offer", type: "offer_page", action: "present-offer" },
        ],
        conversionGoal: "consultation-booked",
      },
    ],
    psychology: {
      urgencyTriggers: [
        { type: "limited-slots", message: "Only 3 slots left this week", threshold: 3 },
      ],
      trustBuilders: [
        { type: "guarantee", content: "100% satisfaction guarantee" },
      ],
      objectionHandlers: [
        { objection: "Too expensive", response: "ROI within 30 days" },
      ],
      microCommitments: [
        { type: "quiz-step", label: "Answer first question" },
      ],
    },
    offers: {
      core: {
        name: "Plumbing Growth Package",
        price: 997,
        description: "Complete automation for plumbing businesses",
        deliverables: ["Lead capture", "Follow-up automation"],
      },
    },
    automation: {
      email: {
        enabled: true,
        sequences: [
          {
            name: "Main Nurture",
            stages: [
              { day: 0, subject: "Welcome", goal: "deliver-value" },
              { day: 5, subject: "Case study", goal: "social-proof" },
            ],
          },
        ],
      },
      sms: {
        enabled: false,
        timing: [],
      },
    },
    kpis: {
      targetConversionRate: 0.05,
      targetCAC: 150,
      targetLTV: 4000,
    },
    scoring: {
      intentWeight: 0.35,
      fitWeight: 0.25,
      engagementWeight: 0.2,
      urgencyWeight: 0.2,
      hotThreshold: 80,
      qualifiedThreshold: 55,
    },
    ...overrides,
  } as DesignSpec;
}

test("parseDesignSpec validates valid JSON input", () => {
  const spec = buildValidSpec();
  const json = JSON.stringify(spec);
  const parsed = parseDesignSpec(json);

  assert.equal(parsed.niche.name, "Plumbing Services");
  assert.equal(parsed.niche.industry, "construction");
  assert.equal(parsed.funnels.length, 1);
  assert.equal(parsed.offers.core.price, 997);
  assert.equal(parsed.scoring?.intentWeight, 0.35);
});

test("parseDesignSpec extracts spec from markdown code block", () => {
  const spec = buildValidSpec();
  const markdown = `# DESIGN.md - Plumbing

Some intro text.

\`\`\`json
${JSON.stringify(spec, null, 2)}
\`\`\`

## Footer text
`;
  const parsed = parseDesignSpec(markdown);
  assert.equal(parsed.niche.name, "Plumbing Services");
  assert.equal(parsed.funnels[0].id, "main-qual");
});

test("parseDesignSpec rejects invalid spec with clear error", () => {
  const invalid = JSON.stringify({ niche: { name: "X" } });
  assert.throws(
    () => parseDesignSpec(invalid),
    (err: Error) => err.message.includes("validation failed"),
  );
});

test("parseDesignSpec rejects non-JSON markdown", () => {
  assert.throws(
    () => parseDesignSpec("# Just a plain markdown file\n\nNo code blocks here."),
    (err: Error) => err.message.includes("no JSON code block"),
  );
});

test("parseDesignSpec rejects niche name shorter than 2 chars", () => {
  const spec = buildValidSpec();
  spec.niche.name = "X";
  assert.throws(
    () => parseDesignSpec(JSON.stringify(spec)),
    (err: Error) => err.message.includes("validation failed"),
  );
});

test("parseDesignSpec rejects empty painPoints array", () => {
  const spec = buildValidSpec();
  spec.niche.icp.painPoints = [];
  assert.throws(
    () => parseDesignSpec(JSON.stringify(spec)),
    (err: Error) => err.message.includes("validation failed"),
  );
});

test("validateDesignSpec returns errors without throwing", () => {
  const result = validateDesignSpec({ niche: { name: "A" } });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test("validateDesignSpec passes for valid input", () => {
  const spec = buildValidSpec();
  const result = validateDesignSpec(spec);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("generateSystemConfig produces all required outputs", () => {
  const spec = buildValidSpec();
  const config = generateSystemConfig(spec);

  assert.ok(config.nicheConfig);
  assert.equal(config.nicheConfig.name, "Plumbing Services");
  assert.equal(config.nicheConfig.industry, "construction");
  assert.equal(config.nicheConfig.slug, "plumbing-services");
  assert.ok(config.nicheConfig.painPoints.length > 0);
  assert.ok(config.nicheConfig.keywords.length > 0);

  assert.ok(config.scoringWeights);
  assert.equal(config.scoringWeights.intentWeight, 0.35);
  assert.equal(config.scoringWeights.hotThreshold, 80);

  assert.ok(config.personalizationContent);
  assert.equal(config.personalizationContent.urgencyTriggers.length, 1);
  assert.equal(config.personalizationContent.trustBuilders.length, 1);

  assert.ok(config.funnelGraphs);
  assert.equal(config.funnelGraphs.length, 1);
  assert.equal(config.funnelGraphs[0].id, "main-qual");

  assert.ok(config.automationRecipes);
  assert.equal(config.automationRecipes.email?.enabled, true);
  assert.equal(config.automationRecipes.sms?.enabled, false);

  assert.ok(config.ingressRules);
  assert.equal(config.ingressRules.length, 2);
  assert.equal(config.ingressRules[0].channel, "seo");

  assert.ok(config.psychologyConfig);
  assert.ok(config.kpiTargets);
  assert.equal(config.kpiTargets.targetConversionRate, 0.05);
});

test("generateSystemConfig uses default scoring when scoring is omitted", () => {
  const spec = buildValidSpec();
  delete (spec as Record<string, unknown>).scoring;
  const config = generateSystemConfig(spec);

  assert.equal(config.scoringWeights.intentWeight, 0.3);
  assert.equal(config.scoringWeights.fitWeight, 0.25);
  assert.equal(config.scoringWeights.hotThreshold, 75);
});

test("generateDesignSpecTemplate produces valid parseable markdown", () => {
  const markdown = generateDesignSpecTemplate("Dental Clinics", "health");

  assert.ok(markdown.includes("# DESIGN.md - Dental Clinics"));
  assert.ok(markdown.includes("```json"));

  const parsed = parseDesignSpec(markdown);
  assert.equal(parsed.niche.name, "Dental Clinics");
  assert.equal(parsed.niche.industry, "health");
  assert.ok(parsed.funnels.length >= 1);
  assert.ok(parsed.psychology.urgencyTriggers.length >= 1);
  assert.ok(parsed.offers.core.deliverables.length >= 1);
});

test("generateDesignSpecTemplate uses general industry as fallback", () => {
  const markdown = generateDesignSpecTemplate("Widget Makers");
  const parsed = parseDesignSpec(markdown);
  assert.equal(parsed.niche.industry, "general");
});

test("diffSpecs detects niche name change", () => {
  const oldSpec = buildValidSpec();
  const newSpec = buildValidSpec({ niche: { ...oldSpec.niche, name: "HVAC Services" } });

  const changes = diffSpecs(oldSpec, newSpec);
  assert.ok(changes.some((c) => c.includes("Niche name changed")));
});

test("diffSpecs detects price change", () => {
  const oldSpec = buildValidSpec();
  const newSpec = buildValidSpec();
  newSpec.offers.core.price = 1497;

  const changes = diffSpecs(oldSpec, newSpec);
  assert.ok(changes.some((c) => c.includes("Core offer price changed")));
});

test("diffSpecs detects funnel count change", () => {
  const oldSpec = buildValidSpec();
  const newSpec = buildValidSpec();
  newSpec.funnels.push({
    id: "extra",
    name: "Extra Funnel",
    type: "nurture",
    steps: [{ id: "s1", type: "landing_page" }],
    conversionGoal: "email-capture",
  });

  const changes = diffSpecs(oldSpec, newSpec);
  assert.ok(changes.some((c) => c.includes("Funnel count changed")));
});

test("diffSpecs detects scoring weight changes", () => {
  const oldSpec = buildValidSpec();
  const newSpec = buildValidSpec();
  newSpec.scoring = {
    intentWeight: 0.4,
    fitWeight: 0.2,
    engagementWeight: 0.2,
    urgencyWeight: 0.2,
    hotThreshold: 80,
    qualifiedThreshold: 55,
  };

  const changes = diffSpecs(oldSpec, newSpec);
  assert.ok(changes.some((c) => c.includes("Scoring weights updated")));
});

test("diffSpecs detects conversion rate change", () => {
  const oldSpec = buildValidSpec();
  const newSpec = buildValidSpec();
  newSpec.kpis.targetConversionRate = 0.1;

  const changes = diffSpecs(oldSpec, newSpec);
  assert.ok(changes.some((c) => c.includes("Target conversion rate changed")));
});

test("diffSpecs returns empty array for identical specs", () => {
  const spec = buildValidSpec();
  const changes = diffSpecs(spec, spec);
  assert.equal(changes.length, 0);
});
