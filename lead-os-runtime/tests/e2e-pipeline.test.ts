import { describe, it } from "node:test";
import assert from "node:assert/strict";

// This test simulates the full lead pipeline without network calls.
// It verifies that all components can be imported and produce valid output
// when composed together — the closest thing to E2E without a running server.

describe("End-to-End Pipeline Smoke Test", () => {
  it("full pipeline: niche config → experience → intake → scoring → nurture → joy", async () => {
    // Step 1: Generate niche config for an arbitrary niche
    const { generateNicheConfig } = await import("../src/lib/niche-generator.ts");
    const config = generateNicheConfig({ name: "Plumbing" });
    assert.ok(config.slug, "Niche config should have a slug");
    assert.ok(config.assessmentQuestions.length >= 5, "Should generate assessment questions");
    assert.ok(config.nurtureSequence.length >= 5, "Should generate nurture sequence");

    // Step 2: Resolve experience profile for a visitor
    const { resolveExperienceProfile } = await import("../src/lib/experience.ts");
    const { getNiche } = await import("../src/lib/catalog.ts");
    const niche = getNiche(config.industry);
    const profile = resolveExperienceProfile({
      niche,
      source: "assessment",
      intent: "solve-now",
      score: 85,
    });
    assert.ok(profile.family, "Profile should have a funnel family");
    assert.ok(profile.mode, "Profile should have a mode");
    assert.ok(profile.heroTitle, "Profile should have a hero title");
    assert.ok(profile.trustPromise, "Trust promise should be populated");
    assert.ok(profile.proofSignals.length >= 2, "Should have proof signals");
    assert.ok(profile.objectionBlocks.length >= 2, "Should have objection blocks");

    // Step 3: Get customer intelligence
    const { getIntelligenceForAnyNiche } = await import("../src/lib/dynamic-intelligence.ts");
    const intel = getIntelligenceForAnyNiche("Plumbing");
    assert.ok(intel.buyingTriggers.length >= 3, "Should have buying triggers");
    assert.ok(intel.objections.length >= 2, "Should have objections");
    assert.ok(intel.decisionJourney.totalDays > 0, "Should have decision journey");

    // Step 4: Generate intelligence-driven nurture sequence
    const { generateIntelligenceNurtureSequence } = await import("../src/lib/intelligence-driven-nurture.ts");
    const nurture = generateIntelligenceNurtureSequence(intel.niche);
    assert.equal(nurture.totalEmails, 7, "Should have 7 nurture emails");
    assert.ok(nurture.strategy.includes("buying trigger"), "Strategy should reference intelligence");

    // Step 5: Simulate lead intake
    const { processLeadIntake } = await import("../src/lib/intake.ts");
    const intakeResult = await processLeadIntake({
      source: "assessment",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@test-pipeline.example.com",
      niche: config.slug,
    });
    assert.ok(intakeResult.success, "Intake should succeed");
    assert.ok(intakeResult.leadKey, "Should return a lead key");

    // Step 6: Score the lead
    const { computeCompositeScore, classifyLeadTemperature } = await import("../src/lib/scoring-engine.ts");
    const scoreResult = computeCompositeScore({
      source: "assessment",
      niche: config.slug,
      pagesViewed: 5,
      timeOnSite: 180,
      assessmentCompleted: true,
      assessmentScore: 85,
      returnVisits: 2,
      hasPhone: true,
    });
    assert.ok(scoreResult.score >= 0 && scoreResult.score <= 100, "Score should be 0-100");
    const temperature = classifyLeadTemperature(scoreResult.score);
    assert.ok(["cold", "warm", "hot", "burning"].includes(temperature), "Should have a valid temperature");

    // Step 7: Generate joy metrics
    const { calculateTimeSaved } = await import("../src/lib/joy-engine.ts");
    const timeSaved = await calculateTimeSaved("test-tenant", 30);
    assert.ok(typeof timeSaved.totalHoursSaved === "number", "Time saved should be a number");
    assert.ok(typeof timeSaved.equivalentValue === "number", "Equivalent value should be a number");
    assert.ok(typeof timeSaved.personalMessage === "string" && timeSaved.personalMessage.length > 0, "Should have a personal message");

    // Step 8: Verify all components produced consistent niche-aware output
    assert.ok(
      profile.heroTitle.includes(niche.label) || profile.heroTitle.includes("momentum"),
      "Experience profile should reference the niche",
    );
  });

  it("dynamic niche pipeline: unknown niche → full system generation", async () => {
    const { getIntelligenceForAnyNiche } = await import("../src/lib/dynamic-intelligence.ts");
    const { generateIntelligenceNurtureSequence } = await import("../src/lib/intelligence-driven-nurture.ts");
    const { resolveExperienceProfile } = await import("../src/lib/experience.ts");
    const { getNiche } = await import("../src/lib/catalog.ts");

    // Use a niche that definitely doesn't exist in pre-built profiles
    const intel = getIntelligenceForAnyNiche("underwater basket weaving academy");
    assert.ok(intel.niche, "Should generate a niche slug");
    assert.ok(intel.buyingTriggers.length >= 3, "Should have buying triggers");

    const nurture = generateIntelligenceNurtureSequence(intel.niche);
    assert.equal(nurture.totalEmails, 7, "Should have 7 nurture emails");

    // Experience profile uses the closest catalog niche
    const niche = getNiche("general"); // unknown maps to general
    const profile = resolveExperienceProfile({ niche, intent: "discover" });
    assert.ok(profile.family, "Should have a family");
    assert.ok(profile.mode, "Should have a mode");
  });
});
