import test from "node:test";
import assert from "node:assert/strict";
import {
  generateCopy,
  generateNurtureSequence,
  generateAssessmentQuestions,
  improveHeadline,
  generateSocialProof,
  type CopyRequest,
} from "../src/lib/ai-copywriter.ts";

// ---------------------------------------------------------------------------
// generateCopy (dry-run mode)
// ---------------------------------------------------------------------------

test("generateCopy returns content with alternatives for email-subject in dry-run", async () => {
  const request: CopyRequest = {
    type: "email-subject",
    niche: "dental",
    brandName: "SmileCo",
    context: {},
  };
  const result = await generateCopy(request);
  assert.ok(result.content.length > 0);
  assert.ok(result.alternatives.length >= 1);
  assert.equal(result.model, "template");
  assert.ok(result.confidence > 0);
  assert.ok(result.content.includes("dental") || result.content.includes("growing"));
});

test("generateCopy returns content for landing-headline in dry-run", async () => {
  const request: CopyRequest = {
    type: "landing-headline",
    niche: "plumbing",
    brandName: "PipePro",
    context: {},
    tone: "professional",
  };
  const result = await generateCopy(request);
  assert.ok(result.content.length > 0);
  assert.ok(result.content.toLowerCase().includes("plumbing"));
});

test("generateCopy returns content for all valid types", async () => {
  const types: CopyRequest["type"][] = [
    "email-subject", "email-body", "landing-headline", "cta",
    "assessment-question", "nurture-sequence", "social-proof", "ad-copy",
  ];

  for (const type of types) {
    const result = await generateCopy({
      type,
      niche: "legal",
      brandName: "LawFirm",
      context: {},
    });
    assert.ok(result.content.length > 0, `${type} should return content`);
    assert.equal(result.model, "template");
  }
});

// ---------------------------------------------------------------------------
// generateNurtureSequence (dry-run mode)
// ---------------------------------------------------------------------------

test("generateNurtureSequence returns 7 stages in dry-run", async () => {
  const stages = await generateNurtureSequence("dental", "SmileCo");
  assert.equal(stages.length, 7);

  for (const stage of stages) {
    assert.ok(stage.stageId.length > 0);
    assert.ok(typeof stage.dayOffset === "number");
    assert.ok(stage.subject.length > 0);
    assert.ok(stage.previewText.length > 0);
    assert.ok(stage.bodyTemplate.length > 0);
  }
});

test("generateNurtureSequence stages have correct day offsets", async () => {
  const stages = await generateNurtureSequence("plumbing", "PipePro");
  const expectedDays = [0, 2, 5, 10, 14, 21, 30];
  for (let i = 0; i < stages.length; i++) {
    assert.equal(stages[i].dayOffset, expectedDays[i]);
  }
});

test("generateNurtureSequence uses brand name in templates", async () => {
  const stages = await generateNurtureSequence("legal", "LawPartners");
  const allBodies = stages.map((s) => s.bodyTemplate).join("");
  assert.ok(allBodies.includes("{{brandName}}") || allBodies.includes("LawPartners"));
});

// ---------------------------------------------------------------------------
// generateAssessmentQuestions (dry-run mode)
// ---------------------------------------------------------------------------

test("generateAssessmentQuestions returns 5-7 questions in dry-run", async () => {
  const questions = await generateAssessmentQuestions("dental");
  assert.ok(questions.length >= 5);
  assert.ok(questions.length <= 7);

  for (const q of questions) {
    assert.ok(q.id.length > 0);
    assert.ok(q.question.length > 0);
    assert.ok(["single-choice", "multi-choice", "scale"].includes(q.type));
    assert.ok(q.options.length >= 2);
    assert.ok(typeof q.weight === "number");
    assert.ok(q.weight > 0);
  }
});

test("generateAssessmentQuestions options have score impacts", async () => {
  const questions = await generateAssessmentQuestions("plumbing");
  for (const q of questions) {
    for (const opt of q.options) {
      assert.ok(typeof opt.scoreImpact === "number");
      assert.ok(opt.label.length > 0);
      assert.ok(opt.value.length > 0);
    }
  }
});

// ---------------------------------------------------------------------------
// improveHeadline (dry-run mode)
// ---------------------------------------------------------------------------

test("improveHeadline returns alternatives in dry-run", async () => {
  const result = await improveHeadline("Grow your business", "dental");
  assert.ok(result.content.length > 0);
  assert.ok(result.alternatives.length >= 0);
  assert.equal(result.model, "template");
});

// ---------------------------------------------------------------------------
// generateSocialProof (dry-run mode)
// ---------------------------------------------------------------------------

test("generateSocialProof returns niche-specific text in dry-run", async () => {
  const proof = await generateSocialProof("dental", "practice");
  assert.ok(proof.length > 0);
  assert.ok(proof.includes("dental"));
});

test("generateSocialProof works without customer type", async () => {
  const proof = await generateSocialProof("legal");
  assert.ok(proof.length > 0);
  assert.ok(proof.includes("legal"));
});
