import test from "node:test";
import assert from "node:assert/strict";
import {
  generateFearTrigger,
  mapPainToFear,
  generateDesireTrigger,
  mapAspirationToDesire,
  generateIdentityMessage,
  matchIdentityToOffer,
  generateDeepObjectionResponse,
  detectHiddenObjection,
  generateEmotionalSequence,
  type FearTrigger,
  type DesireTrigger,
  type IdentityMessage,
  type ObjectionResponse,
  type EmotionalSequence,
} from "../src/lib/deep-psychology.ts";

// ---------------------------------------------------------------------------
// generateFearTrigger — known niche and pain point
// ---------------------------------------------------------------------------

test("generateFearTrigger returns pre-built trigger for known niche and pain", () => {
  const result: FearTrigger = generateFearTrigger("construction", "missed bids");
  assert.equal(result.niche, "construction");
  assert.equal(result.painPoint, "missed bids");
  assert.ok(result.message.length > 0);
  assert.ok(["low", "medium", "high"].includes(result.intensity));
});

// ---------------------------------------------------------------------------
// generateFearTrigger — fallback for unknown niche
// ---------------------------------------------------------------------------

test("generateFearTrigger returns fallback for unknown niche", () => {
  const result = generateFearTrigger("unknown-niche", "some pain");
  assert.equal(result.niche, "unknown-niche");
  assert.ok(result.message.includes("some pain"));
  assert.equal(result.intensity, "medium");
});

// ---------------------------------------------------------------------------
// generateFearTrigger — fallback for unknown pain point
// ---------------------------------------------------------------------------

test("generateFearTrigger returns fallback for unknown pain point in known niche", () => {
  const result = generateFearTrigger("legal", "unknown pain");
  assert.equal(result.niche, "legal");
  assert.ok(result.message.includes("unknown pain"));
  assert.equal(result.intensity, "medium");
});

// ---------------------------------------------------------------------------
// mapPainToFear — maps multiple pain points
// ---------------------------------------------------------------------------

test("mapPainToFear returns a fear trigger for each pain point", () => {
  const results = mapPainToFear("healthcare", ["patient no-shows", "compliance risk"]);
  assert.equal(results.length, 2);
  assert.equal(results[0].painPoint, "patient no-shows");
  assert.equal(results[1].painPoint, "compliance risk");
  assert.ok(results[0].intensity === "high");
});

// ---------------------------------------------------------------------------
// mapPainToFear — empty array
// ---------------------------------------------------------------------------

test("mapPainToFear returns empty array for empty input", () => {
  const results = mapPainToFear("legal", []);
  assert.equal(results.length, 0);
});

// ---------------------------------------------------------------------------
// generateFearTrigger — all 12 niches have at least one known pain
// ---------------------------------------------------------------------------

test("generateFearTrigger produces high-intensity trigger for each of the 12 niches", () => {
  const nicheAndPain: [string, string][] = [
    ["construction", "missed bids"],
    ["legal", "client intake"],
    ["healthcare", "patient no-shows"],
    ["real-estate", "slow follow-up"],
    ["home-services", "emergency calls"],
    ["franchise", "territory saturation"],
    ["staffing", "slow submittals"],
    ["technology", "competitor adoption"],
    ["professional-services", "utilization rate"],
    ["education", "enrollment decline"],
    ["immigration", "case deadlines"],
    ["financial", "market timing"],
  ];

  for (const [niche, pain] of nicheAndPain) {
    const result = generateFearTrigger(niche, pain);
    assert.equal(result.niche, niche, `Niche mismatch for ${niche}`);
    assert.equal(result.intensity, "high", `Expected high intensity for ${niche}/${pain}`);
  }
});

// ---------------------------------------------------------------------------
// generateDesireTrigger — produces triggers from aspirations
// ---------------------------------------------------------------------------

test("generateDesireTrigger returns desire triggers for aspirations", () => {
  const results: DesireTrigger[] = generateDesireTrigger("construction", ["grow revenue", "free up time"]);
  assert.equal(results.length, 2);
  assert.equal(results[0].niche, "construction");
  assert.ok(results[0].message.length > 0);
  assert.ok(["freedom", "status", "security", "growth", "simplicity", "belonging"].includes(results[0].theme));
});

// ---------------------------------------------------------------------------
// generateDesireTrigger — resolves theme from keyword
// ---------------------------------------------------------------------------

test("generateDesireTrigger resolves freedom theme for time-related aspiration", () => {
  const results = generateDesireTrigger("legal", ["free up time"]);
  assert.equal(results[0].theme, "freedom");
});

// ---------------------------------------------------------------------------
// mapAspirationToDesire — known niche and segment
// ---------------------------------------------------------------------------

test("mapAspirationToDesire returns themes for known niche segment", () => {
  const themes = mapAspirationToDesire("construction", "owner");
  assert.ok(themes.length > 0);
  assert.ok(themes.includes("freedom"));
});

// ---------------------------------------------------------------------------
// mapAspirationToDesire — unknown niche falls back
// ---------------------------------------------------------------------------

test("mapAspirationToDesire returns defaults for unknown niche", () => {
  const themes = mapAspirationToDesire("unknown", "owner");
  assert.deepEqual(themes, ["growth", "simplicity"]);
});

// ---------------------------------------------------------------------------
// generateIdentityMessage — produces correct structure
// ---------------------------------------------------------------------------

test("generateIdentityMessage returns message with persona and role", () => {
  const result: IdentityMessage = generateIdentityMessage("construction", "decision-maker");
  assert.equal(result.persona, "decision-maker");
  assert.equal(result.role, "contractor");
  assert.ok(result.message.includes("contractor"));
  assert.ok(result.reinforcement.length > 0);
});

// ---------------------------------------------------------------------------
// generateIdentityMessage — all persona types produce output
// ---------------------------------------------------------------------------

test("generateIdentityMessage works for all persona types", () => {
  const personas: Array<"decision-maker" | "implementer" | "researcher" | "budget-holder" | "innovator" | "pragmatist"> = [
    "decision-maker", "implementer", "researcher", "budget-holder", "innovator", "pragmatist",
  ];

  for (const persona of personas) {
    const result = generateIdentityMessage("technology", persona);
    assert.equal(result.persona, persona);
    assert.ok(result.message.length > 10, `Message too short for ${persona}`);
  }
});

// ---------------------------------------------------------------------------
// matchIdentityToOffer — matches affinity offers
// ---------------------------------------------------------------------------

test("matchIdentityToOffer returns matching offers for persona", () => {
  const offers = ["strategy-session", "free-trial", "white-paper", "roi-calculator"];
  const matched = matchIdentityToOffer("decision-maker", offers);
  assert.ok(matched.includes("strategy-session"));
});

// ---------------------------------------------------------------------------
// matchIdentityToOffer — returns first offer when no affinity matches
// ---------------------------------------------------------------------------

test("matchIdentityToOffer returns first offer when no affinity match found", () => {
  const offers = ["custom-widget", "special-thing"];
  const matched = matchIdentityToOffer("researcher", offers);
  assert.equal(matched.length, 1);
  assert.equal(matched[0], "custom-widget");
});

// ---------------------------------------------------------------------------
// generateDeepObjectionResponse — known objection
// ---------------------------------------------------------------------------

test("generateDeepObjectionResponse returns deep response for known objection", () => {
  const result: ObjectionResponse = generateDeepObjectionResponse("too expensive", "construction");
  assert.equal(result.objection, "too expensive");
  assert.ok(result.rootCause.length > 0);
  assert.ok(result.deepResponse.includes("bid") || result.deepResponse.includes("contract"));
  assert.ok(result.reframe.length > 0);
});

// ---------------------------------------------------------------------------
// generateDeepObjectionResponse — falls back to default for unknown niche
// ---------------------------------------------------------------------------

test("generateDeepObjectionResponse uses default when niche-specific entry missing", () => {
  const result = generateDeepObjectionResponse("too expensive", "staffing");
  assert.equal(result.objection, "too expensive");
  assert.ok(result.rootCause.includes("wasting money"));
});

// ---------------------------------------------------------------------------
// generateDeepObjectionResponse — unknown objection
// ---------------------------------------------------------------------------

test("generateDeepObjectionResponse handles unknown objection gracefully", () => {
  const result = generateDeepObjectionResponse("the moon is full", "legal");
  assert.equal(result.objection, "the moon is full");
  assert.ok(result.deepResponse.length > 0);
});

// ---------------------------------------------------------------------------
// generateDeepObjectionResponse — covers 20 pre-built objections
// ---------------------------------------------------------------------------

test("generateDeepObjectionResponse returns valid response for all 20 pre-built objections", () => {
  const objections = [
    "too expensive", "not the right time", "need to think about it",
    "already have a solution", "need to talk to my partner", "how do I know it works",
    "I need to see a demo first", "we tried something like this before",
    "not sure my team will use it", "let me do more research",
    "send me some information", "I am not the decision maker",
    "the contract is too long", "I do not see how this applies to my industry",
    "what if it does not work for us", "we do not have the budget right now",
    "I need to see ROI first", "it seems too good to be true",
    "we are happy with what we have", "can you just send me pricing",
  ];

  for (const obj of objections) {
    const result = generateDeepObjectionResponse(obj, "technology");
    assert.equal(result.objection, obj, `Objection mismatch for "${obj}"`);
    assert.ok(result.deepResponse.length > 0, `Empty deepResponse for "${obj}"`);
    assert.ok(result.reframe.length > 0, `Empty reframe for "${obj}"`);
  }
});

// ---------------------------------------------------------------------------
// detectHiddenObjection — detects from messages and signals
// ---------------------------------------------------------------------------

test("detectHiddenObjection detects price objection from pricing signals and messages", () => {
  const messages = ["How much does this cost?"];
  const signals = [{ type: "pricing_page_view" }];
  const result = detectHiddenObjection(messages, signals);
  assert.ok(result.includes("too expensive"));
});

// ---------------------------------------------------------------------------
// detectHiddenObjection — detects comparison objection
// ---------------------------------------------------------------------------

test("detectHiddenObjection detects solution comparison from signals and messages", () => {
  const messages = ["How do you compare to competitor X?"];
  const signals = [{ type: "comparison_page_view" }];
  const result = detectHiddenObjection(messages, signals);
  assert.ok(result.includes("already have a solution"));
});

// ---------------------------------------------------------------------------
// detectHiddenObjection — returns empty for no matches
// ---------------------------------------------------------------------------

test("detectHiddenObjection returns empty array when nothing matches", () => {
  const messages = ["I love your product"];
  const signals = [{ type: "homepage_view" }];
  const result = detectHiddenObjection(messages, signals);
  assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// generateEmotionalSequence — top of funnel
// ---------------------------------------------------------------------------

test("generateEmotionalSequence returns curiosity-interest-awareness for top funnel", () => {
  const result: EmotionalSequence = generateEmotionalSequence("legal", "top");
  assert.equal(result.stage, "top");
  assert.equal(result.niche, "legal");
  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[0].emotion, "curiosity");
  assert.equal(result.steps[1].emotion, "interest");
  assert.equal(result.steps[2].emotion, "awareness");
});

// ---------------------------------------------------------------------------
// generateEmotionalSequence — middle of funnel
// ---------------------------------------------------------------------------

test("generateEmotionalSequence returns trust-desire-urgency for middle funnel", () => {
  const result = generateEmotionalSequence("construction", "middle");
  assert.equal(result.stage, "middle");
  assert.equal(result.steps[0].emotion, "trust");
  assert.equal(result.steps[1].emotion, "desire");
  assert.equal(result.steps[2].emotion, "urgency");
});

// ---------------------------------------------------------------------------
// generateEmotionalSequence — bottom of funnel
// ---------------------------------------------------------------------------

test("generateEmotionalSequence returns fomo-identity-commitment for bottom funnel", () => {
  const result = generateEmotionalSequence("healthcare", "bottom");
  assert.equal(result.stage, "bottom");
  assert.equal(result.steps[0].emotion, "fear-of-missing-out");
  assert.equal(result.steps[1].emotion, "identity");
  assert.equal(result.steps[2].emotion, "commitment");
});

// ---------------------------------------------------------------------------
// generateEmotionalSequence — messages contain niche-specific role
// ---------------------------------------------------------------------------

test("generateEmotionalSequence messages reference the niche role", () => {
  const result = generateEmotionalSequence("real-estate", "top");
  assert.ok(result.steps.some((s) => s.message.includes("agent") || s.message.includes("real-estate")));
});

// ---------------------------------------------------------------------------
// Integration: fear + desire + identity + sequence for a single niche
// ---------------------------------------------------------------------------

test("full pipeline: fear, desire, identity, and sequence integrate for construction niche", () => {
  const fears = mapPainToFear("construction", ["missed bids", "project delays"]);
  assert.equal(fears.length, 2);

  const desires = generateDesireTrigger("construction", ["grow revenue"]);
  assert.equal(desires.length, 1);
  assert.equal(desires[0].theme, "growth");

  const identity = generateIdentityMessage("construction", "decision-maker");
  assert.equal(identity.role, "contractor");

  const sequence = generateEmotionalSequence("construction", "bottom");
  assert.equal(sequence.steps.length, 3);
});
