import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateIntelligenceNurtureSequence,
  getAllIntelligenceNurtureSequences,
  getNurtureEmailForStage,
  getNurtureStrategy,
} from "../src/lib/intelligence-driven-nurture.ts";

describe("Intelligence-Driven Nurture Sequences", () => {
  it("generates sequences for all 13 niches", () => {
    const all = getAllIntelligenceNurtureSequences();
    assert.ok(Object.keys(all).length >= 13, `Expected 13+ niches, got ${Object.keys(all).length}`);
  });

  it("every sequence has exactly 7 emails over 30 days", () => {
    const all = getAllIntelligenceNurtureSequences();
    for (const [niche, seq] of Object.entries(all)) {
      assert.equal(seq.totalEmails, 7, `${niche} should have 7 emails`);
      assert.equal(seq.totalDays, 30, `${niche} should span 30 days`);
      assert.equal(seq.emails.length, 7, `${niche} email array should have 7 entries`);
    }
  });

  it("emails have correct day offsets (0, 2, 5, 10, 14, 21, 30)", () => {
    const expected = [0, 2, 5, 10, 14, 21, 30];
    const all = getAllIntelligenceNurtureSequences();
    for (const [niche, seq] of Object.entries(all)) {
      const offsets = seq.emails.map((e) => e.dayOffset);
      assert.deepEqual(offsets, expected, `${niche} day offsets should be ${expected.join(",")}`);
    }
  });

  it("every email has a purpose and intelligence source", () => {
    const all = getAllIntelligenceNurtureSequences();
    for (const [niche, seq] of Object.entries(all)) {
      for (const email of seq.emails) {
        assert.ok(email.purpose, `${niche} stage ${email.stage} missing purpose`);
        assert.ok(email.intelligenceSource, `${niche} stage ${email.stage} missing intelligenceSource`);
        assert.ok(email.subject, `${niche} stage ${email.stage} missing subject`);
        assert.ok(email.previewText, `${niche} stage ${email.stage} missing previewText`);
        assert.ok(email.bodyTemplate, `${niche} stage ${email.stage} missing bodyTemplate`);
      }
    }
  });

  it("email purposes match the intelligence-driven strategy", () => {
    const seq = generateIntelligenceNurtureSequence("legal");
    assert.ok(seq.emails[0]!.purpose.includes("buying trigger"), "Stage 1 should address buying trigger");
    assert.ok(seq.emails[1]!.purpose.includes("objection"), "Stage 2 should address objection");
    assert.ok(seq.emails[2]!.purpose.includes("trust"), "Stage 3 should build trust");
    assert.ok(seq.emails[3]!.purpose.includes("journey"), "Stage 4 should show decision journey");
    assert.ok(seq.emails[4]!.purpose.includes("fear"), "Stage 5 should address underlying fear");
    assert.ok(seq.emails[5]!.purpose.includes("Differentiate"), "Stage 6 should differentiate from competitors");
    assert.ok(seq.emails[6]!.purpose.includes("conversion"), "Stage 7 should push final conversion");
  });

  it("body templates contain expected placeholders", () => {
    const all = getAllIntelligenceNurtureSequences();
    for (const [niche, seq] of Object.entries(all)) {
      for (const email of seq.emails) {
        assert.ok(
          email.bodyTemplate.includes("{{firstName}}") || email.bodyTemplate.includes("{{brandName}}") || email.bodyTemplate.includes("{{niche}}"),
          `${niche} stage ${email.stage} body should contain at least one placeholder`,
        );
      }
    }
  });

  it("getNurtureEmailForStage returns the correct stage", () => {
    const email = getNurtureEmailForStage("construction", 3);
    assert.ok(email, "Should return stage 3 email");
    assert.equal(email.stage, 3);
    assert.equal(email.dayOffset, 5);
  });

  it("getNurtureEmailForStage returns undefined for invalid stage", () => {
    const email = getNurtureEmailForStage("construction", 99);
    assert.equal(email, undefined);
  });

  it("getNurtureStrategy returns a non-empty string", () => {
    const strategy = getNurtureStrategy("legal");
    assert.ok(strategy.length > 50, "Strategy should be a substantial description");
    assert.ok(strategy.includes("buying trigger"), "Strategy should mention buying trigger");
    assert.ok(strategy.includes("objection"), "Strategy should mention objections");
  });

  it("strategy references actual intelligence data for each niche", () => {
    const all = getAllIntelligenceNurtureSequences();
    for (const [niche, seq] of Object.entries(all)) {
      assert.ok(seq.strategy.includes("buying trigger"), `${niche} strategy should reference buying triggers`);
      assert.ok(seq.strategy.includes("motivation"), `${niche} strategy should reference motivation`);
    }
  });

  it("different niches produce different email content", () => {
    const legal = generateIntelligenceNurtureSequence("legal");
    const construction = generateIntelligenceNurtureSequence("construction");
    assert.notEqual(legal.emails[0]!.bodyTemplate, construction.emails[0]!.bodyTemplate, "Different niches should have different Stage 1 content");
    assert.notEqual(legal.emails[1]!.subject, construction.emails[1]!.subject, "Different niches should have different Stage 2 subjects");
  });
});
