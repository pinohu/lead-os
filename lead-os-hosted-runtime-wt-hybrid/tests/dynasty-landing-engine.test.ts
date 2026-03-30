import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  seedAllPresetConfigs,
  generateSiteJsonLd,
  generateSiteMeta,
  saveDynastySite,
  getDynastySite,
  listDynastySites,
  updateDynastySite,
  deleteDynastySite,
  resetDynastySiteStore,
  type DynastyLandingConfig,
  type PersonaType,
  type RevenueModel,
  type IndustryCategory,
  type SiteCategory,
} from "../src/lib/dynasty-landing-engine.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PERSONA_SLUGS: PersonaType[] = [
  "agency",
  "saas-entrepreneur",
  "lead-gen-company",
  "consultant",
  "franchise-network",
];

const REVENUE_MODELS: RevenueModel[] = [
  "managed-service",
  "white-label",
  "implementation",
  "marketplace",
];

const INDUSTRIES: IndustryCategory[] = [
  "service",
  "legal",
  "health",
  "tech",
  "construction",
  "real-estate",
  "education",
  "finance",
  "franchise",
  "staffing",
  "faith",
  "creative",
  "general",
];

const ACTION_VERBS = [
  "get",
  "start",
  "launch",
  "build",
  "grow",
  "boost",
  "unlock",
  "claim",
  "book",
  "schedule",
  "try",
  "join",
  "see",
  "discover",
  "create",
  "scale",
  "transform",
  "automate",
  "dominate",
  "request",
  "activate",
  "explore",
  "accelerate",
  "supercharge",
  "double",
  "triple",
  "crush",
  "own",
  "take",
  "secure",
  "reserve",
  "access",
  "download",
  "watch",
  "learn",
  "sign",
  "apply",
  "grab",
  "deploy",
  "connect",
  "find",
  "generate",
  "capture",
  "convert",
  "leverage",
  "maximize",
  "optimize",
  "streamline",
  "eliminate",
  "stop",
  "end",
  "let",
  "make",
  "put",
  "turn",
  "go",
  "power",
  "fuel",
  "drive",
  "master",
  "win",
  "land",
  "close",
  "add",
  "set",
  "run",
  "open",
  "upgrade",
  "use",
  "plug",
  "flip",
  "drop",
  "pick",
  "choose",
  "shop",
  "view",
];

function makeSampleConfig(overrides?: Partial<DynastyLandingConfig>): DynastyLandingConfig {
  return {
    slug: "test-site",
    category: "persona" as SiteCategory,
    categorySlug: "agency",
    meta: {
      title: "Test Site Title",
      description: "A short description for testing purposes.",
    },
    theme: {
      variant: "dark",
      accent: "#6366f1",
      accentHover: "#818cf8",
    },
    hero: {
      eyebrow: "Now available",
      headline: "Generate Leads on Autopilot",
      subheadline: "The AI-powered platform that fills your pipeline.",
      primaryCta: { text: "Start Free Trial", url: "/signup" },
      secondaryCta: { text: "Watch Demo", url: "/demo" },
      trustBar: [
        { type: "stat", value: "500+", label: "Clients served" },
        { type: "badge", value: "SOC 2", label: "Certified" },
      ],
    },
    problem: {
      headline: "Tired of chasing leads?",
      painPoints: [
        { scenario: "You spend hours cold-calling with no results", emotion: "Frustrated" },
        { scenario: "Your pipeline dries up every quarter", emotion: "Anxious" },
      ],
      agitation: "Every day without a system costs you revenue.",
    },
    solution: {
      headline: "There is a better way",
      description: "Our AI finds, qualifies, and nurtures leads for you.",
      transformation: "From empty pipeline to booked calendar in 30 days.",
    },
    howItWorks: {
      headline: "Three simple steps",
      steps: [
        { number: 1, title: "Connect", description: "Link your CRM", icon: "🔗" },
        { number: 2, title: "Configure", description: "Set your ICP", icon: "⚙️" },
        { number: 3, title: "Convert", description: "Watch leads flow in", icon: "🚀" },
      ],
    },
    features: [
      { title: "AI Scoring", benefit: "Focus on the hottest leads", icon: "🎯" },
      { title: "Auto Nurture", benefit: "Never drop the ball", icon: "🤖" },
      { title: "Analytics", benefit: "See what is working", icon: "📊" },
    ],
    socialProof: {
      headline: "Trusted by growth teams",
      testimonials: [
        { quote: "Doubled our pipeline.", name: "Jane Doe", title: "CEO, Acme", rating: 5 },
        { quote: "Best ROI tool we have.", name: "John Smith", title: "VP Sales", rating: 5 },
        { quote: "Setup was painless.", name: "Sara Lee", title: "CMO", rating: 4 },
      ],
      stats: [
        { type: "number", value: "10,000+", label: "Leads generated" },
        { type: "percentage", value: "35%", label: "Conversion lift" },
      ],
    },
    objections: {
      headline: "Common questions",
      faq: [
        { question: "Is there a free trial?", answer: "Yes, 14 days no credit card." },
        { question: "Can I cancel anytime?", answer: "Absolutely, no lock-in." },
        { question: "Does it integrate with my CRM?", answer: "We support all major CRMs." },
      ],
    },
    finalCta: {
      headline: "Ready to grow?",
      subheadline: "Join 500+ companies already using LeadOS.",
      primaryCta: { text: "Start Free Trial", url: "/signup" },
      urgency: "Only 3 onboarding slots left this week.",
      guarantee: "30-day money-back guarantee.",
    },
    footer: {
      badges: ["SSL Secured", "SOC 2", "GDPR Compliant"],
      copyright: "© 2026 LeadOS Inc.",
      brandName: "LeadOS",
    },
    status: "published",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Seed & Config Generation
// ---------------------------------------------------------------------------

describe("DynastyLandingEngine — Seed & Config Generation", () => {
  let allConfigs: DynastyLandingConfig[];

  beforeEach(() => {
    allConfigs = seedAllPresetConfigs();
  });

  it("seedAllPresetConfigs returns exactly 22 configs", () => {
    assert.equal(allConfigs.length, 22);
  });

  it("all 5 persona configs are present", () => {
    const personaSlugs = allConfigs
      .filter((c) => c.category === "persona")
      .map((c) => c.categorySlug);
    for (const slug of PERSONA_SLUGS) {
      assert.ok(personaSlugs.includes(slug), `Missing persona: ${slug}`);
    }
  });

  it("all 4 revenue model configs are present", () => {
    const revenueSlugs = allConfigs
      .filter((c) => c.category === "revenue-model")
      .map((c) => c.categorySlug);
    for (const model of REVENUE_MODELS) {
      assert.ok(revenueSlugs.includes(model), `Missing revenue model: ${model}`);
    }
  });

  it("all 13 industry configs are present", () => {
    const industrySlugs = allConfigs
      .filter((c) => c.category === "industry")
      .map((c) => c.categorySlug);
    for (const industry of INDUSTRIES) {
      assert.ok(industrySlugs.includes(industry), `Missing industry: ${industry}`);
    }
  });

  it("every config has a unique slug", () => {
    const slugs = allConfigs.map((c) => c.slug);
    const uniqueSlugs = new Set(slugs);
    assert.equal(uniqueSlugs.size, slugs.length, "Duplicate slugs detected");
  });

  it("every config has required sections", () => {
    const requiredKeys: Array<keyof DynastyLandingConfig> = [
      "hero",
      "problem",
      "solution",
      "howItWorks",
      "features",
      "socialProof",
      "objections",
      "finalCta",
    ];
    for (const config of allConfigs) {
      for (const key of requiredKeys) {
        assert.ok(
          config[key] !== undefined && config[key] !== null,
          `Config "${config.slug}" missing required section: ${key}`,
        );
      }
    }
  });

  it("every hero headline is under 80 chars", () => {
    for (const config of allConfigs) {
      assert.ok(
        config.hero.headline.length < 80,
        `Config "${config.slug}" hero headline too long (${config.hero.headline.length}): "${config.hero.headline}"`,
      );
    }
  });

  it("every meta.title is under 60 chars", () => {
    for (const config of allConfigs) {
      assert.ok(
        config.meta.title.length < 60,
        `Config "${config.slug}" meta.title too long (${config.meta.title.length}): "${config.meta.title}"`,
      );
    }
  });

  it("every meta.description is under 160 chars", () => {
    for (const config of allConfigs) {
      assert.ok(
        config.meta.description.length < 160,
        `Config "${config.slug}" meta.description too long (${config.meta.description.length})`,
      );
    }
  });

  it("every howItWorks has exactly 3 steps", () => {
    for (const config of allConfigs) {
      assert.equal(
        config.howItWorks.steps.length,
        3,
        `Config "${config.slug}" has ${config.howItWorks.steps.length} steps instead of 3`,
      );
    }
  });

  it("every features array has 3-6 items", () => {
    for (const config of allConfigs) {
      const count = config.features.length;
      assert.ok(
        count >= 3 && count <= 6,
        `Config "${config.slug}" has ${count} features (expected 3-6)`,
      );
    }
  });

  it("every socialProof has at least 3 testimonials", () => {
    for (const config of allConfigs) {
      assert.ok(
        config.socialProof.testimonials.length >= 3,
        `Config "${config.slug}" has ${config.socialProof.testimonials.length} testimonials (need >= 3)`,
      );
    }
  });

  it("every objections has at least 3 FAQs", () => {
    for (const config of allConfigs) {
      assert.ok(
        config.objections.faq.length >= 3,
        `Config "${config.slug}" has ${config.objections.faq.length} FAQs (need >= 3)`,
      );
    }
  });

  it("every config has a valid theme with accent color", () => {
    for (const config of allConfigs) {
      assert.ok(
        config.theme.variant === "dark" || config.theme.variant === "light",
        `Config "${config.slug}" has invalid theme variant: ${config.theme.variant}`,
      );
      assert.ok(
        typeof config.theme.accent === "string" && config.theme.accent.length > 0,
        `Config "${config.slug}" missing accent color`,
      );
      assert.ok(
        typeof config.theme.accentHover === "string" && config.theme.accentHover.length > 0,
        `Config "${config.slug}" missing accentHover color`,
      );
    }
  });

  it("every CTA text starts with a verb", () => {
    for (const config of allConfigs) {
      const ctaTexts = [
        config.hero.primaryCta.text,
        config.finalCta.primaryCta.text,
      ];
      if (config.hero.secondaryCta) {
        ctaTexts.push(config.hero.secondaryCta.text);
      }

      for (const text of ctaTexts) {
        const firstWord = text.split(" ")[0].toLowerCase();
        assert.ok(
          ACTION_VERBS.includes(firstWord),
          `CTA "${text}" in config "${config.slug}" does not start with a recognized verb ("${firstWord}")`,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Store CRUD
// ---------------------------------------------------------------------------

describe("DynastyLandingEngine — Store CRUD", () => {
  beforeEach(() => {
    resetDynastySiteStore();
  });

  it("saveDynastySite stores a config and getDynastySite retrieves it", async () => {
    const config = makeSampleConfig();
    await saveDynastySite(config);
    const retrieved = await getDynastySite("test-site");
    assert.ok(retrieved);
    assert.equal(retrieved.slug, "test-site");
    assert.equal(retrieved.hero.headline, config.hero.headline);
  });

  it("getDynastySite returns null for nonexistent slug", async () => {
    const result = await getDynastySite("nonexistent-slug");
    assert.equal(result, null);
  });

  it("listDynastySites returns all saved sites", async () => {
    await saveDynastySite(makeSampleConfig({ slug: "site-a" }));
    await saveDynastySite(makeSampleConfig({ slug: "site-b" }));
    await saveDynastySite(makeSampleConfig({ slug: "site-c" }));
    const all = await listDynastySites();
    assert.equal(all.length, 3);
  });

  it("listDynastySites filters by category", async () => {
    await saveDynastySite(makeSampleConfig({ slug: "p1", category: "persona" }));
    await saveDynastySite(makeSampleConfig({ slug: "r1", category: "revenue-model" }));
    await saveDynastySite(makeSampleConfig({ slug: "i1", category: "industry" }));
    const personas = await listDynastySites({ category: "persona" });
    assert.equal(personas.length, 1);
    assert.equal(personas[0].slug, "p1");
  });

  it("listDynastySites filters by status", async () => {
    await saveDynastySite(makeSampleConfig({ slug: "pub1", status: "published" }));
    await saveDynastySite(makeSampleConfig({ slug: "draft1", status: "draft" }));
    await saveDynastySite(makeSampleConfig({ slug: "pub2", status: "published" }));
    const published = await listDynastySites({ status: "published" });
    assert.equal(published.length, 2);
  });

  it("listDynastySites filters by tenantId", async () => {
    await saveDynastySite(makeSampleConfig({ slug: "t1", tenantId: "tenant-abc" }));
    await saveDynastySite(makeSampleConfig({ slug: "t2", tenantId: "tenant-xyz" }));
    await saveDynastySite(makeSampleConfig({ slug: "t3", tenantId: "tenant-abc" }));
    const tenantSites = await listDynastySites({ tenantId: "tenant-abc" });
    assert.equal(tenantSites.length, 2);
  });

  it("updateDynastySite updates fields and returns updated config", async () => {
    await saveDynastySite(makeSampleConfig({ slug: "update-me" }));
    const updated = await updateDynastySite("update-me", {
      status: "archived",
      meta: { title: "Updated Title", description: "Updated description." },
    });
    assert.ok(updated);
    assert.equal(updated.status, "archived");
    assert.equal(updated.meta.title, "Updated Title");
    assert.equal(updated.slug, "update-me");
  });

  it("updateDynastySite returns null for nonexistent slug", async () => {
    const result = await updateDynastySite("no-such-slug", { status: "draft" });
    assert.equal(result, null);
  });

  it("deleteDynastySite removes a config and returns true", async () => {
    await saveDynastySite(makeSampleConfig({ slug: "delete-me" }));
    const deleted = await deleteDynastySite("delete-me");
    assert.equal(deleted, true);
    const afterDelete = await getDynastySite("delete-me");
    assert.equal(afterDelete, null);
  });

  it("deleteDynastySite returns false for nonexistent slug", async () => {
    const result = await deleteDynastySite("ghost-slug");
    assert.equal(result, false);
  });

  it("resetDynastySiteStore clears all configs", async () => {
    await saveDynastySite(makeSampleConfig({ slug: "a" }));
    await saveDynastySite(makeSampleConfig({ slug: "b" }));
    resetDynastySiteStore();
    const all = await listDynastySites();
    assert.equal(all.length, 0);
  });

  it("saveDynastySite overwrites existing config with same slug", async () => {
    await saveDynastySite(makeSampleConfig({ slug: "overwrite", status: "draft" }));
    await saveDynastySite(makeSampleConfig({ slug: "overwrite", status: "published" }));
    const retrieved = await getDynastySite("overwrite");
    assert.ok(retrieved);
    assert.equal(retrieved.status, "published");
    const all = await listDynastySites();
    assert.equal(all.length, 1);
  });
});

// ---------------------------------------------------------------------------
// 3. JSON-LD Generation
// ---------------------------------------------------------------------------

describe("DynastyLandingEngine — JSON-LD Generation", () => {
  const config = makeSampleConfig({ slug: "jsonld-test" });

  it("returns @context https://schema.org", () => {
    const jsonLd = generateSiteJsonLd(config);
    assert.equal(jsonLd["@context"], "https://schema.org");
  });

  it("returns @type WebPage", () => {
    const jsonLd = generateSiteJsonLd(config);
    assert.equal(jsonLd["@type"], "WebPage");
  });

  it("includes name from config", () => {
    const jsonLd = generateSiteJsonLd(config);
    assert.ok(typeof jsonLd["name"] === "string");
    assert.ok((jsonLd["name"] as string).length > 0);
  });

  it("includes description from meta", () => {
    const jsonLd = generateSiteJsonLd(config);
    assert.equal(jsonLd["description"], config.meta.description);
  });

  it("includes url with /d/ prefix", () => {
    const jsonLd = generateSiteJsonLd(config);
    const url = jsonLd["url"] as string;
    assert.ok(url.includes("/d/"), `URL "${url}" should contain /d/`);
    assert.ok(url.includes(config.slug), `URL "${url}" should contain slug "${config.slug}"`);
  });

  it("includes publisher with Organization type", () => {
    const jsonLd = generateSiteJsonLd(config);
    const publisher = jsonLd["publisher"] as Record<string, unknown>;
    assert.ok(publisher, "JSON-LD should include publisher");
    assert.equal(publisher["@type"], "Organization");
  });

  it("includes breadcrumb list", () => {
    const jsonLd = generateSiteJsonLd(config);
    const breadcrumb = jsonLd["breadcrumb"] as Record<string, unknown>;
    assert.ok(breadcrumb, "JSON-LD should include breadcrumb");
    assert.equal(breadcrumb["@type"], "BreadcrumbList");
  });

  it("is valid JSON (serializable)", () => {
    const jsonLd = generateSiteJsonLd(config);
    const serialized = JSON.stringify(jsonLd);
    const parsed = JSON.parse(serialized);
    assert.deepEqual(parsed, jsonLd);
  });
});

// ---------------------------------------------------------------------------
// 4. Meta Generation
// ---------------------------------------------------------------------------

describe("DynastyLandingEngine — Meta Generation", () => {
  const config = makeSampleConfig({ slug: "meta-test" });

  it("returns title from config", () => {
    const meta = generateSiteMeta(config);
    assert.equal(meta.title, config.meta.title);
  });

  it("returns description from config", () => {
    const meta = generateSiteMeta(config);
    assert.equal(meta.description, config.meta.description);
  });

  it("returns canonical URL with /d/ prefix", () => {
    const meta = generateSiteMeta(config);
    assert.ok(
      meta.canonical.includes("/d/"),
      `Canonical "${meta.canonical}" should contain /d/`,
    );
    assert.ok(
      meta.canonical.includes(config.slug),
      `Canonical "${meta.canonical}" should contain slug`,
    );
  });

  it("returns openGraph title", () => {
    const meta = generateSiteMeta(config);
    assert.ok(typeof meta.openGraph.title === "string");
    assert.ok(meta.openGraph.title.length > 0);
  });

  it("returns openGraph description", () => {
    const meta = generateSiteMeta(config);
    assert.ok(typeof meta.openGraph.description === "string");
    assert.ok(meta.openGraph.description.length > 0);
  });

  it("meta description is not truncated if under 155 chars", () => {
    const shortDesc = "A short description under the limit.";
    const shortConfig = makeSampleConfig({
      slug: "short-desc",
      meta: { title: "Short", description: shortDesc },
    });
    const meta = generateSiteMeta(shortConfig);
    assert.equal(meta.description, shortDesc);
  });
});

// ---------------------------------------------------------------------------
// 5. Config Quality Validation
// ---------------------------------------------------------------------------

describe("DynastyLandingEngine — Config Quality Validation", () => {
  let allConfigs: DynastyLandingConfig[];

  beforeEach(() => {
    allConfigs = seedAllPresetConfigs();
  });

  it("all persona configs have 'persona' category", () => {
    const personaConfigs = allConfigs.filter((c) =>
      PERSONA_SLUGS.includes(c.categorySlug as PersonaType),
    );
    for (const config of personaConfigs) {
      assert.equal(
        config.category,
        "persona",
        `Config "${config.slug}" with categorySlug "${config.categorySlug}" should have category "persona"`,
      );
    }
  });

  it("all revenue model configs have 'revenue-model' category", () => {
    const revenueConfigs = allConfigs.filter((c) =>
      REVENUE_MODELS.includes(c.categorySlug as RevenueModel),
    );
    for (const config of revenueConfigs) {
      assert.equal(
        config.category,
        "revenue-model",
        `Config "${config.slug}" with categorySlug "${config.categorySlug}" should have category "revenue-model"`,
      );
    }
  });

  it("all industry configs have 'industry' category", () => {
    const industryConfigs = allConfigs.filter((c) =>
      INDUSTRIES.includes(c.categorySlug as IndustryCategory),
    );
    for (const config of industryConfigs) {
      assert.equal(
        config.category,
        "industry",
        `Config "${config.slug}" with categorySlug "${config.categorySlug}" should have category "industry"`,
      );
    }
  });

  it("no config has empty headline", () => {
    for (const config of allConfigs) {
      assert.ok(
        config.hero.headline.trim().length > 0,
        `Config "${config.slug}" has empty hero headline`,
      );
      assert.ok(
        config.problem.headline.trim().length > 0,
        `Config "${config.slug}" has empty problem headline`,
      );
      assert.ok(
        config.solution.headline.trim().length > 0,
        `Config "${config.slug}" has empty solution headline`,
      );
    }
  });

  it("no config has empty CTA text", () => {
    for (const config of allConfigs) {
      assert.ok(
        config.hero.primaryCta.text.trim().length > 0,
        `Config "${config.slug}" has empty hero CTA text`,
      );
      assert.ok(
        config.finalCta.primaryCta.text.trim().length > 0,
        `Config "${config.slug}" has empty final CTA text`,
      );
    }
  });

  it("all testimonial ratings are between 1 and 5", () => {
    for (const config of allConfigs) {
      for (const testimonial of config.socialProof.testimonials) {
        assert.ok(
          testimonial.rating >= 1 && testimonial.rating <= 5,
          `Config "${config.slug}" has testimonial with rating ${testimonial.rating} (expected 1-5)`,
        );
      }
    }
  });

  it("all pain points have both scenario and emotion", () => {
    for (const config of allConfigs) {
      for (const point of config.problem.painPoints) {
        assert.ok(
          typeof point.scenario === "string" && point.scenario.trim().length > 0,
          `Config "${config.slug}" has pain point with empty scenario`,
        );
        assert.ok(
          typeof point.emotion === "string" && point.emotion.trim().length > 0,
          `Config "${config.slug}" has pain point with empty emotion`,
        );
      }
    }
  });

  it("all steps have sequential numbers (1, 2, 3)", () => {
    for (const config of allConfigs) {
      const numbers = config.howItWorks.steps.map((s: { number: number }) => s.number);
      assert.deepEqual(
        numbers,
        [1, 2, 3],
        `Config "${config.slug}" has non-sequential step numbers: [${numbers.join(", ")}]`,
      );
    }
  });

  it("all trust bar items have type, value, and label", () => {
    for (const config of allConfigs) {
      for (const item of config.hero.trustBar) {
        assert.ok(
          typeof item.type === "string" && item.type.length > 0,
          `Config "${config.slug}" has trust bar item with empty type`,
        );
        assert.ok(
          typeof item.value === "string" && item.value.length > 0,
          `Config "${config.slug}" has trust bar item with empty value`,
        );
        assert.ok(
          typeof item.label === "string" && item.label.length > 0,
          `Config "${config.slug}" has trust bar item with empty label`,
        );
      }
    }
  });

  it("footer has non-empty brandName and copyright", () => {
    for (const config of allConfigs) {
      assert.ok(
        config.footer.brandName.trim().length > 0,
        `Config "${config.slug}" has empty footer brandName`,
      );
      assert.ok(
        config.footer.copyright.trim().length > 0,
        `Config "${config.slug}" has empty footer copyright`,
      );
    }
  });
});
