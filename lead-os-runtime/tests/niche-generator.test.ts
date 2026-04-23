import test from "node:test";
import assert from "node:assert/strict";
import {
  detectIndustryCategory,
  generateNicheConfig,
  generateAssessmentQuestions,
  generateNurtureContent,
  selectFunnelsForNiche,
  matchLeadMagnetsForNiche,
  type GeneratedNicheConfig,
} from "../src/lib/niche-generator.ts";
import type { IndustryCategory } from "../src/lib/niche-templates.ts";
import type { LeadMagnet } from "../src/lib/lead-magnet-engine.ts";

// ---------------------------------------------------------------------------
// detectIndustryCategory
// ---------------------------------------------------------------------------

test("detectIndustryCategory maps legal keywords correctly", () => {
  assert.equal(detectIndustryCategory("Personal Injury Law"), "legal");
  assert.equal(detectIndustryCategory("Immigration Attorney"), "legal");
  assert.equal(detectIndustryCategory("Family Legal Services"), "legal");
});

test("detectIndustryCategory maps construction keywords correctly", () => {
  assert.equal(detectIndustryCategory("General Contractor"), "construction");
  assert.equal(detectIndustryCategory("Roofing Company"), "construction");
  assert.equal(detectIndustryCategory("Plumbing Services"), "construction");
  assert.equal(detectIndustryCategory("Electrical Contractor"), "construction");
});

test("detectIndustryCategory maps health keywords correctly", () => {
  assert.equal(detectIndustryCategory("Dental Practice"), "health");
  assert.equal(detectIndustryCategory("Medical Clinic"), "health");
  assert.equal(detectIndustryCategory("Wellness Center"), "health");
  assert.equal(detectIndustryCategory("Chiropractic Office"), "health");
});

test("detectIndustryCategory maps real-estate keywords correctly", () => {
  assert.equal(detectIndustryCategory("Real Estate Team"), "real-estate");
  assert.equal(detectIndustryCategory("Luxury Realtor"), "real-estate");
  assert.equal(detectIndustryCategory("Property Management"), "real-estate");
});

test("detectIndustryCategory maps tech keywords correctly", () => {
  assert.equal(detectIndustryCategory("SaaS Platform"), "tech");
  assert.equal(detectIndustryCategory("Software Development"), "tech");
  assert.equal(detectIndustryCategory("Cybersecurity Firm"), "tech");
});

test("detectIndustryCategory maps education keywords correctly", () => {
  assert.equal(detectIndustryCategory("Online Academy"), "education");
  assert.equal(detectIndustryCategory("Tutoring Service"), "education");
  assert.equal(detectIndustryCategory("Coding Certification"), "education");
});

test("detectIndustryCategory maps finance keywords correctly", () => {
  assert.equal(detectIndustryCategory("Financial Planning"), "finance");
  assert.equal(detectIndustryCategory("Tax Preparation"), "finance");
  assert.equal(detectIndustryCategory("Accounting Firm"), "finance");
});

test("detectIndustryCategory maps franchise keywords correctly", () => {
  assert.equal(detectIndustryCategory("Pizza Franchise"), "franchise");
  assert.equal(detectIndustryCategory("Multi-location Business"), "franchise");
});

test("detectIndustryCategory maps staffing keywords correctly", () => {
  assert.equal(detectIndustryCategory("IT Staffing Agency"), "staffing");
  assert.equal(detectIndustryCategory("Recruiting Firm"), "staffing");
});

test("detectIndustryCategory maps faith keywords correctly", () => {
  assert.equal(detectIndustryCategory("Community Church"), "faith");
  assert.equal(detectIndustryCategory("Youth Ministry"), "faith");
});

test("detectIndustryCategory maps creative keywords correctly", () => {
  assert.equal(detectIndustryCategory("Graphic Design Studio"), "creative");
  assert.equal(detectIndustryCategory("Photography Business"), "creative");
});

test("detectIndustryCategory maps service keywords correctly", () => {
  assert.equal(detectIndustryCategory("House Cleaning Service"), "service");
  assert.equal(detectIndustryCategory("Landscaping Business"), "service");
});

test("detectIndustryCategory uses keywords array for additional context", () => {
  assert.equal(detectIndustryCategory("Acme Corp", ["legal", "compliance"]), "legal");
  assert.equal(detectIndustryCategory("Bright Co", ["dental", "patients"]), "health");
});

test("detectIndustryCategory falls back to general for unknown niches", () => {
  assert.equal(detectIndustryCategory("Quantum Widgets"), "general");
  assert.equal(detectIndustryCategory("Abstract Innovations"), "general");
});

// ---------------------------------------------------------------------------
// generateNicheConfig — required fields
// ---------------------------------------------------------------------------

test("generateNicheConfig returns all required fields", () => {
  const config = generateNicheConfig({ name: "Dental Practice" });

  assert.ok(config.slug);
  assert.ok(config.name);
  assert.ok(config.industry);
  assert.ok(config.definition);
  assert.ok(config.definition.label);
  assert.ok(config.definition.shortDescription);
  assert.ok(config.definition.category);
  assert.ok(Array.isArray(config.painPoints));
  assert.ok(Array.isArray(config.urgencySignals));
  assert.ok(Array.isArray(config.offers));
  assert.ok(Array.isArray(config.keywords));
  assert.ok(Array.isArray(config.assessmentQuestions));
  assert.ok(config.scoringWeights);
  assert.ok(config.personalizationContent);
  assert.ok(config.personalizationContent.cold);
  assert.ok(config.personalizationContent.warm);
  assert.ok(config.personalizationContent.hot);
  assert.ok(config.personalizationContent.burning);
  assert.ok(Array.isArray(config.recommendedMagnets));
  assert.ok(Array.isArray(config.recommendedFunnels));
  assert.ok(Array.isArray(config.nurtureSequence));
  assert.ok(Array.isArray(config.n8nWorkflowSlugs));
  assert.ok(config.createdAt);
});

test("generateNicheConfig detects industry from name", () => {
  const config = generateNicheConfig({ name: "Personal Injury Law" });
  assert.equal(config.industry, "legal");
});

test("generateNicheConfig uses explicit industry override", () => {
  const config = generateNicheConfig({ name: "Acme Corp", industry: "construction" });
  assert.equal(config.industry, "construction");
});

test("generateNicheConfig replaces placeholders in pain points", () => {
  const config = generateNicheConfig({ name: "Dental Practice" });
  for (const painPoint of config.painPoints) {
    assert.ok(!painPoint.includes("{{niche}}"), `Unreplaced placeholder in: ${painPoint}`);
    assert.ok(!painPoint.includes("{{industry}}"), `Unreplaced placeholder in: ${painPoint}`);
  }
});

test("generateNicheConfig replaces placeholders in personalization content", () => {
  const config = generateNicheConfig({ name: "Roofing Company" });
  const temps: Array<"cold" | "warm" | "hot" | "burning"> = ["cold", "warm", "hot", "burning"];
  for (const temp of temps) {
    const content = config.personalizationContent[temp];
    assert.ok(!content.headline.includes("{{niche}}"), `Unreplaced placeholder in ${temp} headline`);
    assert.ok(!content.subheadline.includes("{{niche}}"), `Unreplaced placeholder in ${temp} subheadline`);
  }
});

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

test("slug generation produces URL-safe strings", () => {
  const config = generateNicheConfig({ name: "Personal Injury Law Firm" });
  assert.equal(config.slug, "personal-injury-law-firm");
  assert.match(config.slug, /^[a-z0-9-]+$/);
});

test("slug generation handles leading/trailing spaces", () => {
  const config = generateNicheConfig({ name: "  My Business  " });
  assert.equal(config.slug, "my-business");
});

// ---------------------------------------------------------------------------
// Assessment questions
// ---------------------------------------------------------------------------

test("generateAssessmentQuestions returns 5-7 questions", () => {
  const categories: IndustryCategory[] = [
    "service", "legal", "health", "tech", "construction",
    "real-estate", "education", "finance", "franchise",
    "staffing", "faith", "creative", "general",
  ];

  for (const category of categories) {
    const questions = generateAssessmentQuestions("Test Niche", category);
    assert.ok(
      questions.length >= 5 && questions.length <= 7,
      `${category} has ${questions.length} questions, expected 5-7`,
    );
  }
});

test("generateAssessmentQuestions replaces niche placeholder in questions", () => {
  const questions = generateAssessmentQuestions("Dental Practice", "health");
  for (const q of questions) {
    assert.ok(!q.question.includes("{{niche}}"), `Unreplaced placeholder in: ${q.question}`);
  }
});

test("assessment questions have unique IDs", () => {
  const questions = generateAssessmentQuestions("Test", "general");
  const ids = questions.map((q) => q.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size);
});

test("assessment questions have options with scoreImpact", () => {
  const questions = generateAssessmentQuestions("Test", "legal");
  for (const q of questions) {
    assert.ok(q.options.length >= 2, `Question ${q.id} has fewer than 2 options`);
    for (const opt of q.options) {
      assert.equal(typeof opt.scoreImpact, "number");
      assert.ok(opt.scoreImpact >= 0 && opt.scoreImpact <= 100);
    }
  }
});

// ---------------------------------------------------------------------------
// Nurture sequence
// ---------------------------------------------------------------------------

test("generateNurtureContent returns 7 stages", () => {
  const categories: IndustryCategory[] = [
    "service", "legal", "health", "tech", "construction",
    "real-estate", "education", "finance", "franchise",
    "staffing", "faith", "creative", "general",
  ];

  for (const category of categories) {
    const stages = generateNurtureContent("Test Niche", category);
    assert.equal(stages.length, 7, `${category} has ${stages.length} nurture stages, expected 7`);
  }
});

test("nurture stages have increasing day offsets", () => {
  const stages = generateNurtureContent("Test", "general");
  for (let i = 1; i < stages.length; i++) {
    assert.ok(
      stages[i].dayOffset > stages[i - 1].dayOffset,
      `Stage ${i} day offset (${stages[i].dayOffset}) should be greater than stage ${i - 1} (${stages[i - 1].dayOffset})`,
    );
  }
});

test("nurture stages have non-empty subjects and body templates", () => {
  const stages = generateNurtureContent("Test", "service");
  for (const stage of stages) {
    assert.ok(stage.subject.length > 0, "Subject should not be empty");
    assert.ok(stage.bodyTemplate.length > 0, "Body template should not be empty");
    assert.ok(stage.stageId.length > 0, "Stage ID should not be empty");
  }
});

test("nurture content replaces niche placeholder in subjects", () => {
  const stages = generateNurtureContent("Dental Practice", "health");
  for (const stage of stages) {
    assert.ok(!stage.subject.includes("{{niche}}"), `Unreplaced placeholder in subject: ${stage.subject}`);
  }
});

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

test("scoring weights sum to 1.0 for all industries", () => {
  const categories: IndustryCategory[] = [
    "service", "legal", "health", "tech", "construction",
    "real-estate", "education", "finance", "franchise",
    "staffing", "faith", "creative", "general",
  ];

  for (const category of categories) {
    const config = generateNicheConfig({ name: "Test", industry: category });
    const weights = config.scoringWeights;
    const sum = weights.intentWeight + weights.fitWeight + weights.engagementWeight + weights.urgencyWeight;
    assert.ok(
      Math.abs(sum - 1.0) < 0.001,
      `${category} scoring weights sum to ${sum}, expected 1.0`,
    );
  }
});

// ---------------------------------------------------------------------------
// Funnel selection
// ---------------------------------------------------------------------------

test("selectFunnelsForNiche returns at least 2 families", () => {
  const categories: IndustryCategory[] = [
    "service", "legal", "health", "tech", "construction",
    "real-estate", "education", "finance", "franchise",
    "staffing", "faith", "creative", "general",
  ];

  for (const category of categories) {
    const funnels = selectFunnelsForNiche(category);
    assert.ok(
      funnels.length >= 2,
      `${category} has ${funnels.length} funnels, expected at least 2`,
    );
  }
});

test("selectFunnelsForNiche returns strings", () => {
  const funnels = selectFunnelsForNiche("legal");
  for (const funnel of funnels) {
    assert.equal(typeof funnel, "string");
    assert.ok(funnel.length > 0);
  }
});

// ---------------------------------------------------------------------------
// matchLeadMagnetsForNiche
// ---------------------------------------------------------------------------

test("matchLeadMagnetsForNiche returns slugs from catalog", () => {
  const fakeCatalog: LeadMagnet[] = [
    {
      id: "m1",
      slug: "m1-test-magnet",
      category: "lead-gen",
      title: "Test Magnet",
      description: "A test magnet",
      deliveryType: "pdf",
      formFields: [],
      funnelFamily: "lead-magnet",
      niche: "general",
      tags: [],
      status: "active",
      metadata: { nicheApplicability: ["general"] },
    },
    {
      id: "m2",
      slug: "m2-legal-intake",
      category: "intake",
      title: "Legal Intake Checklist",
      description: "Intake checklist",
      deliveryType: "checklist",
      formFields: [],
      funnelFamily: "qualification",
      niche: "legal",
      tags: [],
      status: "active",
      metadata: { nicheApplicability: ["legal"] },
    },
  ];

  const results = matchLeadMagnetsForNiche("legal", "legal", fakeCatalog);
  assert.ok(Array.isArray(results));
  assert.ok(results.includes("m2-legal-intake"));
});

test("matchLeadMagnetsForNiche returns empty array for empty catalog", () => {
  const results = matchLeadMagnetsForNiche("test", "general", []);
  assert.deepEqual(results, []);
});

// ---------------------------------------------------------------------------
// Unknown niches fall back to general
// ---------------------------------------------------------------------------

test("unknown niches produce valid config with general industry", () => {
  const config = generateNicheConfig({ name: "Quantum Widget Factory" });
  assert.equal(config.industry, "general");
  assert.ok(config.painPoints.length > 0);
  assert.ok(config.assessmentQuestions.length >= 5);
  assert.ok(config.nurtureSequence.length === 7);
});

// ---------------------------------------------------------------------------
// Full config integrity
// ---------------------------------------------------------------------------

test("generated config has valid n8n workflow slugs", () => {
  const config = generateNicheConfig({ name: "Dental Practice" });
  assert.ok(config.n8nWorkflowSlugs.length >= 2);
  for (const slug of config.n8nWorkflowSlugs) {
    assert.ok(slug.startsWith("dental-practice-"), `Workflow slug should start with niche slug: ${slug}`);
  }
});

test("generated config has personalization content for all temperatures", () => {
  const config = generateNicheConfig({ name: "Roofing Company" });
  const temps: Array<"cold" | "warm" | "hot" | "burning"> = ["cold", "warm", "hot", "burning"];
  for (const temp of temps) {
    const content = config.personalizationContent[temp];
    assert.ok(content.headline.length > 0);
    assert.ok(content.subheadline.length > 0);
    assert.ok(content.ctaText.length > 0);
    assert.ok(content.ctaUrl.length > 0);
    assert.ok(content.socialProof.length > 0);
    assert.ok(content.trustBadge.length > 0);
  }
});

test("generated config includes user-provided keywords", () => {
  const config = generateNicheConfig({
    name: "Test Business",
    keywords: ["custom-keyword", "special-term"],
  });
  assert.ok(config.keywords.includes("custom-keyword"));
  assert.ok(config.keywords.includes("special-term"));
});

test("generated config has valid ISO timestamp", () => {
  const config = generateNicheConfig({ name: "Test" });
  const date = new Date(config.createdAt);
  assert.ok(!isNaN(date.getTime()), "createdAt should be a valid ISO date");
});
