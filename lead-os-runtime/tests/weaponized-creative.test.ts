import test from "node:test";
import assert from "node:assert/strict";
import {
  selectCreativeStrategy,
  personalizeHeroSection,
  generateAdaptiveCreative,
  generateDynamicEmailSequence,
  generateAdaptiveAd,
  type CreativeStrategy,
  type AdaptiveCreativePackage,
} from "../src/lib/weaponized-creative.ts";
import {
  createContext,
  updateContext,
  resetContextStore,
  type LeadContext,
  type LeadContextScores,
} from "../src/lib/context-engine.ts";
import { getNiche } from "../src/lib/catalog.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(): void {
  resetContextStore();
}

function createLeadWithProfile(overrides: {
  temperature?: LeadContextScores["temperature"];
  trustLevel?: number;
  urgency?: number;
  composite?: number;
  fearTriggers?: string[];
  desireTriggers?: string[];
  objections?: string[];
  identityType?: string;
  emotionalStage?: string;
}): LeadContext {
  const ctx = createContext("lead-creative-test", "tenant-a", { niche: "legal" });
  const updated = updateContext("lead-creative-test", {
    scores: {
      temperature: overrides.temperature ?? "warm",
      urgency: overrides.urgency ?? 50,
      composite: overrides.composite ?? 50,
      intent: 50,
      fit: 50,
      engagement: 50,
    },
    psychologyProfile: {
      trustLevel: overrides.trustLevel ?? 60,
      fearTriggers: overrides.fearTriggers ?? [],
      desireTriggers: overrides.desireTriggers ?? [],
      objections: overrides.objections ?? [],
      identityType: overrides.identityType ?? "decision-maker",
      emotionalStage: overrides.emotionalStage ?? "curiosity",
    },
  });
  return updated!;
}

// ---------------------------------------------------------------------------
// selectCreativeStrategy
// ---------------------------------------------------------------------------

test("selectCreativeStrategy returns educational for cold temperature", () => {
  const scores: LeadContextScores = { intent: 10, fit: 10, engagement: 10, urgency: 10, composite: 10, temperature: "cold" };
  const strategy = selectCreativeStrategy(scores);
  assert.equal(strategy.name, "educational");
  assert.equal(strategy.temperature, "cold");
  assert.ok(strategy.trustEmphasis > strategy.ctaStrength);
});

test("selectCreativeStrategy returns benefit for warm temperature", () => {
  const scores: LeadContextScores = { intent: 40, fit: 40, engagement: 40, urgency: 40, composite: 40, temperature: "warm" };
  const strategy = selectCreativeStrategy(scores);
  assert.equal(strategy.name, "benefit");
  assert.equal(strategy.temperature, "warm");
});

test("selectCreativeStrategy returns direct for hot temperature", () => {
  const scores: LeadContextScores = { intent: 70, fit: 70, engagement: 70, urgency: 70, composite: 70, temperature: "hot" };
  const strategy = selectCreativeStrategy(scores);
  assert.equal(strategy.name, "direct");
  assert.ok(strategy.urgencyLevel > 50);
});

test("selectCreativeStrategy returns immediate for burning temperature", () => {
  const scores: LeadContextScores = { intent: 90, fit: 90, engagement: 90, urgency: 90, composite: 90, temperature: "burning" };
  const strategy = selectCreativeStrategy(scores);
  assert.equal(strategy.name, "immediate");
  assert.ok(strategy.ctaStrength > 90);
  assert.ok(strategy.urgencyLevel > 90);
});

test("selectCreativeStrategy accepts temperature override", () => {
  const scores: LeadContextScores = { intent: 10, fit: 10, engagement: 10, urgency: 10, composite: 10, temperature: "cold" };
  const strategy = selectCreativeStrategy(scores, "hot");
  assert.equal(strategy.name, "direct");
  assert.equal(strategy.temperature, "hot");
});

// ---------------------------------------------------------------------------
// personalizeHeroSection
// ---------------------------------------------------------------------------

test("personalizeHeroSection shows trust badges when trust is low", () => {
  setup();
  const nicheConfig = getNiche("legal");
  const strategy = selectCreativeStrategy({ intent: 10, fit: 10, engagement: 10, urgency: 10, composite: 10, temperature: "cold" });
  const psychology = {
    trustLevel: 20,
    fearTriggers: [],
    desireTriggers: [],
    objections: [],
    identityType: "decision-maker",
    emotionalStage: "curiosity",
  };

  const hero = personalizeHeroSection(nicheConfig, strategy, psychology);
  assert.ok(hero.trustBadges.length >= 3);
  assert.ok(hero.trustBadges.includes("verified-reviews"));
  assert.ok(hero.trustBadges.includes("money-back-guarantee"));
});

test("personalizeHeroSection shows countdown when urgency is high", () => {
  setup();
  const nicheConfig = getNiche("legal");
  const strategy = selectCreativeStrategy({ intent: 90, fit: 90, engagement: 90, urgency: 90, composite: 90, temperature: "burning" });
  const psychology = {
    trustLevel: 80,
    fearTriggers: [],
    desireTriggers: [],
    objections: [],
    identityType: "decision-maker",
    emotionalStage: "commitment",
  };

  const hero = personalizeHeroSection(nicheConfig, strategy, psychology);
  assert.equal(hero.showCountdown, true);
  assert.ok(hero.countdownLabel.length > 0);
});

test("personalizeHeroSection uses fear trigger for headline when urgency is high", () => {
  setup();
  const nicheConfig = getNiche("legal");
  const strategy = selectCreativeStrategy({ intent: 80, fit: 80, engagement: 80, urgency: 80, composite: 80, temperature: "hot" });
  const psychology = {
    trustLevel: 60,
    fearTriggers: ["client intake"],
    desireTriggers: [],
    objections: [],
    identityType: "decision-maker",
    emotionalStage: "evaluation",
  };

  const hero = personalizeHeroSection(nicheConfig, strategy, psychology);
  assert.ok(hero.headline.length > 0);
});

test("personalizeHeroSection adapts CTA text to identity type", () => {
  setup();
  const nicheConfig = getNiche("legal");
  const strategy = selectCreativeStrategy({ intent: 50, fit: 50, engagement: 50, urgency: 50, composite: 50, temperature: "warm" });

  const researcherPsych = {
    trustLevel: 60,
    fearTriggers: [],
    desireTriggers: [],
    objections: [],
    identityType: "researcher",
    emotionalStage: "curiosity",
  };

  const decisionMakerPsych = {
    ...researcherPsych,
    identityType: "decision-maker",
  };

  const researcherHero = personalizeHeroSection(nicheConfig, strategy, researcherPsych);
  const dmHero = personalizeHeroSection(nicheConfig, strategy, decisionMakerPsych);

  assert.notEqual(researcherHero.ctaText, dmHero.ctaText);
});

test("personalizeHeroSection adapts image suggestion to emotional stage", () => {
  setup();
  const nicheConfig = getNiche("legal");
  const strategy = selectCreativeStrategy({ intent: 50, fit: 50, engagement: 50, urgency: 50, composite: 50, temperature: "warm" });
  const psychology = {
    trustLevel: 60,
    fearTriggers: [],
    desireTriggers: [],
    objections: [],
    identityType: "decision-maker",
    emotionalStage: "curiosity",
  };

  const hero = personalizeHeroSection(nicheConfig, strategy, psychology);
  assert.equal(hero.imageSuggestion, "educational-infographic");
});

// ---------------------------------------------------------------------------
// generateAdaptiveCreative
// ---------------------------------------------------------------------------

test("generateAdaptiveCreative returns full package for cold lead", () => {
  setup();
  const lead = createLeadWithProfile({ temperature: "cold", trustLevel: 30 });
  const nicheConfig = getNiche("legal");

  const pkg = generateAdaptiveCreative(lead, nicheConfig);

  assert.equal(pkg.strategy.name, "educational");
  assert.ok(pkg.landingPage.hero.trustBadges.length > 0);
  assert.ok(pkg.emailSubject.length > 0);
  assert.ok(pkg.emailBody.length > 0);
  assert.ok(pkg.smsMessage.length > 0);
  assert.equal(pkg.adHeadlines.length, 3);
  assert.ok(pkg.ctaText.length > 0);
  assert.ok(pkg.socialPost.length > 0);
});

test("generateAdaptiveCreative returns urgency-driven package for hot lead", () => {
  setup();
  const lead = createLeadWithProfile({
    temperature: "hot",
    urgency: 85,
    composite: 80,
    fearTriggers: ["client intake"],
    identityType: "decision-maker",
  });
  const nicheConfig = getNiche("legal");

  const pkg = generateAdaptiveCreative(lead, nicheConfig);

  assert.equal(pkg.strategy.name, "direct");
  assert.ok(pkg.landingPage.hero.showCountdown);
});

test("generateAdaptiveCreative includes social proof for low-trust lead", () => {
  setup();
  const lead = createLeadWithProfile({ temperature: "warm", trustLevel: 20 });
  const nicheConfig = getNiche("legal");

  const pkg = generateAdaptiveCreative(lead, nicheConfig);
  assert.ok(pkg.landingPage.socialProof.length >= 3);
});

test("generateAdaptiveCreative generates desire-driven content for desire triggers", () => {
  setup();
  const lead = createLeadWithProfile({
    temperature: "warm",
    desireTriggers: ["growth", "efficiency"],
  });
  const nicheConfig = getNiche("legal");

  const pkg = generateAdaptiveCreative(lead, nicheConfig);
  assert.ok(pkg.socialPost.includes("growth") || pkg.socialPost.includes("efficiency"));
});

test("generateAdaptiveCreative handles researcher identity type", () => {
  setup();
  const lead = createLeadWithProfile({
    temperature: "warm",
    identityType: "researcher",
  });
  const nicheConfig = getNiche("legal");

  const pkg = generateAdaptiveCreative(lead, nicheConfig);
  assert.ok(pkg.ctaText.toLowerCase().includes("compare") || pkg.ctaText.toLowerCase().includes("comparison") || pkg.ctaText.toLowerCase().includes("option"));
});

// ---------------------------------------------------------------------------
// generateDynamicEmailSequence
// ---------------------------------------------------------------------------

test("generateDynamicEmailSequence returns 5 emails by default", () => {
  setup();
  const lead = createLeadWithProfile({ temperature: "warm" });
  const nicheConfig = getNiche("legal");

  const emails = generateDynamicEmailSequence(lead, nicheConfig);
  assert.equal(emails.length, 5);
});

test("generateDynamicEmailSequence uses correct day schedule", () => {
  setup();
  const lead = createLeadWithProfile({ temperature: "warm" });
  const nicheConfig = getNiche("legal");

  const emails = generateDynamicEmailSequence(lead, nicheConfig);
  assert.equal(emails[0].day, 0);
  assert.equal(emails[1].day, 2);
  assert.equal(emails[2].day, 5);
  assert.equal(emails[3].day, 7);
  assert.equal(emails[4].day, 10);
});

test("generateDynamicEmailSequence adapts to objections", () => {
  setup();
  const lead = createLeadWithProfile({
    temperature: "warm",
    objections: ["too expensive", "not enough time"],
  });
  const nicheConfig = getNiche("legal");

  const emails = generateDynamicEmailSequence(lead, nicheConfig);
  const objectionEmail = emails.find((e) => e.stage === "objection");
  assert.ok(objectionEmail);
  assert.ok(objectionEmail.body.includes("too expensive") || objectionEmail.subject.includes("too expensive"));
});

test("generateDynamicEmailSequence adapts to fear triggers in final email", () => {
  setup();
  const lead = createLeadWithProfile({
    temperature: "hot",
    fearTriggers: ["client intake"],
  });
  const nicheConfig = getNiche("legal");

  const emails = generateDynamicEmailSequence(lead, nicheConfig);
  const finalEmail = emails.find((e) => e.stage === "final");
  assert.ok(finalEmail);
  assert.ok(finalEmail.subject.includes("client intake") || finalEmail.body.length > 0);
});

test("generateDynamicEmailSequence accepts custom stages", () => {
  setup();
  const lead = createLeadWithProfile({ temperature: "warm" });
  const nicheConfig = getNiche("legal");

  const emails = generateDynamicEmailSequence(lead, nicheConfig, ["awareness", "proof"]);
  assert.equal(emails.length, 2);
  assert.equal(emails[0].stage, "awareness");
  assert.equal(emails[1].stage, "proof");
});

test("generateDynamicEmailSequence includes send conditions", () => {
  setup();
  const lead = createLeadWithProfile({ temperature: "warm" });
  const nicheConfig = getNiche("legal");

  const emails = generateDynamicEmailSequence(lead, nicheConfig);
  for (const email of emails) {
    assert.ok(email.sendCondition.length > 0);
    assert.ok(email.ctaUrl.length > 0);
    assert.ok(email.ctaText.length > 0);
  }
});

// ---------------------------------------------------------------------------
// generateAdaptiveAd
// ---------------------------------------------------------------------------

test("generateAdaptiveAd generates Google ad with correct constraints", () => {
  setup();
  const lead = createLeadWithProfile({ temperature: "warm", fearTriggers: ["client intake"] });
  const nicheConfig = getNiche("legal");

  const ad = generateAdaptiveAd(lead, nicheConfig, "google");
  assert.equal(ad.platform, "google");
  assert.ok(ad.headline.length <= 30);
  assert.ok(ad.description.length <= 90);
  assert.ok(ad.displayUrl);
});

test("generateAdaptiveAd generates Facebook ad with primary text", () => {
  setup();
  const lead = createLeadWithProfile({ temperature: "hot", desireTriggers: ["growth"] });
  const nicheConfig = getNiche("legal");

  const ad = generateAdaptiveAd(lead, nicheConfig, "facebook");
  assert.equal(ad.platform, "facebook");
  assert.ok(ad.primaryText);
  assert.ok(ad.primaryText!.length <= 125);
});

test("generateAdaptiveAd generates LinkedIn ad with intro text", () => {
  setup();
  const lead = createLeadWithProfile({ temperature: "warm", identityType: "decision-maker" });
  const nicheConfig = getNiche("legal");

  const ad = generateAdaptiveAd(lead, nicheConfig, "linkedin");
  assert.equal(ad.platform, "linkedin");
  assert.ok(ad.introText);
  assert.ok(ad.headline.includes("Leaders"));
});
