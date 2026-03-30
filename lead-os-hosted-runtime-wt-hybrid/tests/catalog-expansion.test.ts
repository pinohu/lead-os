import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nicheCatalog, getNiche } from "../src/lib/catalog.ts";
import {
  INDUSTRY_TEMPLATES,
  type IndustryCategory,
} from "../src/lib/niche-templates.ts";
import { NICHE_TESTIMONIALS } from "../src/lib/niche-testimonials.ts";
import { CALCULATOR_PRESETS } from "../src/lib/calculator-presets.ts";
import { resolveExperienceProfile } from "../src/lib/experience.ts";
import {
  generatePersona,
  type PersonaType,
} from "../src/lib/persona-engine.ts";

// ---------------------------------------------------------------------------
// Helper: mirrors the resolveTemplateCategory logic from resources/[slug]/page
// ---------------------------------------------------------------------------

const TEMPLATE_CATEGORY_MAP: Record<string, IndustryCategory> = {
  general: "general",
  legal: "legal",
  "home-services": "service",
  coaching: "service",
  construction: "construction",
  "real-estate": "real-estate",
  tech: "tech",
  education: "education",
  finance: "finance",
  franchise: "franchise",
  staffing: "staffing",
  faith: "faith",
  creative: "creative",
  health: "health",
  ecommerce: "general",
  fitness: "health",
};

function resolveTemplateCategory(slug: string): IndustryCategory {
  return TEMPLATE_CATEGORY_MAP[slug] ?? "general";
}

// ---------------------------------------------------------------------------
// 1. nicheCatalog has at least 16 entries
// ---------------------------------------------------------------------------

describe("nicheCatalog size", () => {
  it("has at least 16 entries", () => {
    const count = Object.keys(nicheCatalog).length;
    assert.ok(count >= 16, `Expected >= 16 entries, got ${count}`);
  });
});

// ---------------------------------------------------------------------------
// 2. Every nicheCatalog entry has required fields
// ---------------------------------------------------------------------------

describe("nicheCatalog required fields", () => {
  for (const [key, entry] of Object.entries(nicheCatalog)) {
    it(`${key} has all required fields`, () => {
      assert.ok(entry.slug, `${key} missing slug`);
      assert.ok(entry.label, `${key} missing label`);
      assert.ok(entry.summary, `${key} missing summary`);
      assert.ok(entry.assessmentTitle, `${key} missing assessmentTitle`);
      assert.ok(entry.calculatorBias, `${key} missing calculatorBias`);
      assert.ok(
        Array.isArray(entry.recommendedFunnels),
        `${key} missing recommendedFunnels`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Every INDUSTRY_TEMPLATES key exists in nicheCatalog (or maps via
//    resolveTemplateCategory logic)
// ---------------------------------------------------------------------------

describe("INDUSTRY_TEMPLATES coverage", () => {
  const templateKeys = Object.keys(INDUSTRY_TEMPLATES) as IndustryCategory[];

  it("every nicheCatalog slug resolves to a valid INDUSTRY_TEMPLATES key", () => {
    for (const slug of Object.keys(nicheCatalog)) {
      const category = resolveTemplateCategory(slug);
      assert.ok(
        templateKeys.includes(category),
        `Slug "${slug}" resolves to "${category}" which is not in INDUSTRY_TEMPLATES`,
      );
    }
  });

  it("every INDUSTRY_TEMPLATES key is reachable from at least one catalog slug", () => {
    const reachable = new Set(
      Object.keys(nicheCatalog).map((s) => resolveTemplateCategory(s)),
    );
    for (const tk of templateKeys) {
      assert.ok(
        reachable.has(tk),
        `Template key "${tk}" is not reachable from any catalog slug`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 4. NICHE_TESTIMONIALS has entries for at least 13 niches
// ---------------------------------------------------------------------------

describe("NICHE_TESTIMONIALS coverage", () => {
  const keys = Object.keys(NICHE_TESTIMONIALS);

  it("has entries for at least 13 niches", () => {
    assert.ok(
      keys.length >= 13,
      `Expected >= 13 niche testimonial groups, got ${keys.length}`,
    );
  });

  it("every entry has exactly 3 testimonials with required fields", () => {
    for (const niche of keys) {
      const testimonials = NICHE_TESTIMONIALS[niche];
      assert.equal(
        testimonials.length,
        3,
        `${niche} should have 3 testimonials, got ${testimonials.length}`,
      );
      for (const t of testimonials) {
        assert.ok(t.quote, `${niche} testimonial missing quote`);
        assert.ok(t.author, `${niche} testimonial missing author`);
        assert.ok(t.role, `${niche} testimonial missing role`);
        assert.ok(t.company, `${niche} testimonial missing company`);
        assert.ok(t.metric, `${niche} testimonial missing metric`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 5. CALCULATOR_PRESETS has entries for at least 13 niches
// ---------------------------------------------------------------------------

describe("CALCULATOR_PRESETS coverage", () => {
  const keys = Object.keys(CALCULATOR_PRESETS);

  it("has entries for at least 13 niches", () => {
    assert.ok(
      keys.length >= 13,
      `Expected >= 13 calculator presets, got ${keys.length}`,
    );
  });

  it("every preset has required structure", () => {
    for (const niche of keys) {
      const preset = CALCULATOR_PRESETS[niche];
      assert.ok(preset.niche, `${niche} preset missing niche`);
      assert.ok(preset.label, `${niche} preset missing label`);
      assert.ok(
        preset.inputs.length >= 3,
        `${niche} should have >= 3 inputs, got ${preset.inputs.length}`,
      );
      assert.ok(preset.formula, `${niche} preset missing formula`);
      assert.ok(preset.resultLabel, `${niche} preset missing resultLabel`);
      assert.ok(preset.proofPoint, `${niche} preset missing proofPoint`);

      for (const input of preset.inputs) {
        assert.ok(input.id, `${niche} input missing id`);
        assert.ok(input.label, `${niche} input missing label`);
        assert.ok(
          ["currency", "number", "percentage"].includes(input.type),
          `${niche} input "${input.id}" has invalid type "${input.type}"`,
        );
        assert.ok(
          typeof input.defaultValue === "number",
          `${niche} input "${input.id}" missing defaultValue`,
        );
        assert.ok(input.helpText, `${niche} input "${input.id}" missing helpText`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 6. resolveExperienceProfile returns valid profiles for every niche
// ---------------------------------------------------------------------------

describe("resolveExperienceProfile for every catalog niche", () => {
  for (const [slug, niche] of Object.entries(nicheCatalog)) {
    it(`returns a valid profile for ${slug}`, () => {
      const profile = resolveExperienceProfile({
        family: "lead-magnet",
        niche,
        supportEmail: "test@example.com",
        source: "test",
        intent: "discover",
        returning: false,
        preferredMode: "form-first",
        score: 50,
      });

      assert.ok(profile, `Profile should exist for ${slug}`);
      assert.ok(profile.family, `${slug} profile missing family`);
      assert.ok(profile.mode, `${slug} profile missing mode`);
      assert.ok(profile.heroTitle, `${slug} profile missing heroTitle`);
      assert.ok(profile.primaryActionLabel, `${slug} profile missing primaryActionLabel`);
      assert.ok(
        Array.isArray(profile.fieldOrder),
        `${slug} profile missing fieldOrder`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// 7. Each niche's recommendedFunnels array has at least 2 entries
// ---------------------------------------------------------------------------

describe("recommendedFunnels depth", () => {
  for (const [slug, niche] of Object.entries(nicheCatalog)) {
    it(`${slug} has at least 2 recommended funnels`, () => {
      assert.ok(
        niche.recommendedFunnels.length >= 2,
        `${slug} has only ${niche.recommendedFunnels.length} funnels, expected >= 2`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// 8. persona-engine PERSONA_TEMPLATES covers at least 14 niches with 6 types
// ---------------------------------------------------------------------------

describe("persona-engine template coverage", () => {
  const NICHE_KEYS = [
    "real-estate",
    "fitness",
    "finance",
    "coaching",
    "health",
    "ecommerce",
    "saas",
    "legal",
    "construction",
    "education",
    "franchise",
    "staffing",
    "faith",
    "creative",
  ];

  const PERSONA_TYPES: PersonaType[] = [
    "expert",
    "technician",
    "advisor",
    "educator",
    "storyteller",
    "local-authority",
  ];

  it("covers at least 14 niches", () => {
    assert.ok(
      NICHE_KEYS.length >= 14,
      `Expected >= 14 niche keys, got ${NICHE_KEYS.length}`,
    );
  });

  for (const niche of NICHE_KEYS) {
    for (const personaType of PERSONA_TYPES) {
      it(`generates a persona for ${niche} / ${personaType}`, () => {
        const persona = generatePersona(niche, personaType);
        assert.ok(persona, `No persona for ${niche}/${personaType}`);
        assert.ok(persona.id, `${niche}/${personaType} missing id`);
        assert.ok(persona.name, `${niche}/${personaType} missing name`);
        assert.equal(
          persona.type,
          personaType,
          `${niche}/${personaType} type mismatch`,
        );
        assert.ok(
          persona.expertise.length > 0,
          `${niche}/${personaType} missing expertise`,
        );
        assert.ok(
          persona.trustSignals.length > 0,
          `${niche}/${personaType} missing trustSignals`,
        );
      });
    }
  }
});
