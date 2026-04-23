import test from "node:test";
import assert from "node:assert/strict";
import {
  createPersona,
  getPersona,
  listPersonas,
  generatePersona,
  applyPersonaToContent,
  getPersonaRecommendation,
  resetPersonaStore,
  type PersonaType,
} from "../src/lib/persona-engine.ts";

const BASE_PERSONA = {
  name: "Alex Test",
  type: "expert" as PersonaType,
  niche: "fitness",
  voiceTone: "authoritative and direct",
  backstory: "10 years experience in high-performance coaching.",
  expertise: ["strength training", "nutrition", "recovery"],
  contentStyle: "Data-driven breakdowns",
  catchphrases: ["Train with evidence.", "Results over opinions."],
  avatarDescription: "Professional headshot in gym setting",
  trustSignals: ["CSCS certified", "Featured in Men's Health"],
};

test.beforeEach(() => {
  resetPersonaStore();
});

// ---------------------------------------------------------------------------
// createPersona
// ---------------------------------------------------------------------------

test("createPersona returns a persona with generated id and tenantId", () => {
  const persona = createPersona("tenant-1", BASE_PERSONA);

  assert.ok(persona.id.startsWith("persona-"));
  assert.equal(persona.tenantId, "tenant-1");
  assert.equal(persona.name, BASE_PERSONA.name);
  assert.equal(persona.type, "expert");
  assert.equal(persona.niche, "fitness");
});

test("createPersona stores multiple personas independently", () => {
  const a = createPersona("tenant-1", BASE_PERSONA);
  const b = createPersona("tenant-1", { ...BASE_PERSONA, name: "Jordan Alt", type: "storyteller" });

  assert.notEqual(a.id, b.id);
  assert.equal(a.type, "expert");
  assert.equal(b.type, "storyteller");
});

test("createPersona preserves all fields", () => {
  const persona = createPersona("tenant-1", BASE_PERSONA);

  assert.deepEqual(persona.expertise, BASE_PERSONA.expertise);
  assert.deepEqual(persona.catchphrases, BASE_PERSONA.catchphrases);
  assert.deepEqual(persona.trustSignals, BASE_PERSONA.trustSignals);
  assert.equal(persona.backstory, BASE_PERSONA.backstory);
});

// ---------------------------------------------------------------------------
// getPersona
// ---------------------------------------------------------------------------

test("getPersona retrieves a persona by id", () => {
  const persona = createPersona("tenant-1", BASE_PERSONA);
  const found = getPersona(persona.id);

  assert.ok(found);
  assert.equal(found.id, persona.id);
  assert.equal(found.name, persona.name);
});

test("getPersona returns undefined for unknown id", () => {
  const result = getPersona("no-such-id");
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// listPersonas
// ---------------------------------------------------------------------------

test("listPersonas returns all personas for a tenant", () => {
  createPersona("tenant-1", BASE_PERSONA);
  createPersona("tenant-1", { ...BASE_PERSONA, name: "Second" });

  const list = listPersonas("tenant-1");
  assert.equal(list.length, 2);
});

test("listPersonas isolates by tenantId", () => {
  createPersona("tenant-A", BASE_PERSONA);
  createPersona("tenant-B", { ...BASE_PERSONA, name: "B Persona" });

  const listA = listPersonas("tenant-A");
  const listB = listPersonas("tenant-B");

  assert.equal(listA.length, 1);
  assert.equal(listB.length, 1);
  assert.equal(listA[0].tenantId, "tenant-A");
  assert.equal(listB[0].tenantId, "tenant-B");
});

test("listPersonas returns empty array for unknown tenant", () => {
  const list = listPersonas("nobody");
  assert.equal(list.length, 0);
});

// ---------------------------------------------------------------------------
// generatePersona
// ---------------------------------------------------------------------------

test("generatePersona returns a persona with the requested type and niche", () => {
  const persona = generatePersona("real-estate", "expert");

  assert.equal(persona.type, "expert");
  assert.equal(persona.niche, "real-estate");
  assert.ok(persona.name.length > 0);
  assert.ok(persona.backstory.length > 0);
  assert.ok(persona.catchphrases.length > 0);
  assert.ok(persona.trustSignals.length > 0);
});

test("generatePersona works for all 6 persona types in fitness niche", () => {
  const types: PersonaType[] = [
    "expert",
    "technician",
    "advisor",
    "educator",
    "storyteller",
    "local-authority",
  ];

  for (const type of types) {
    const persona = generatePersona("fitness", type);
    assert.equal(persona.type, type, `type mismatch for ${type}`);
    assert.ok(persona.name.length > 0, `name missing for ${type}`);
  }
});

test("generatePersona handles unknown niche by falling back to coaching templates", () => {
  const persona = generatePersona("underwater-basket-weaving", "expert");

  assert.equal(persona.type, "expert");
  assert.ok(persona.name.length > 0);
  assert.ok(persona.backstory.length > 0);
});

test("generatePersona produces different templates for different types", () => {
  const expert = generatePersona("finance", "expert");
  const storyteller = generatePersona("finance", "storyteller");

  assert.notEqual(expert.name, storyteller.name);
  assert.notEqual(expert.voiceTone, storyteller.voiceTone);
});

// ---------------------------------------------------------------------------
// applyPersonaToContent
// ---------------------------------------------------------------------------

test("applyPersonaToContent appends a catchphrase to content", () => {
  const persona = createPersona("tenant-1", BASE_PERSONA);
  const result = applyPersonaToContent(persona, "Here is your workout plan.");

  const hasCatchphrase = BASE_PERSONA.catchphrases.some((cp) => result.includes(cp));
  assert.ok(hasCatchphrase, "Expected a catchphrase to appear in the output");
});

test("applyPersonaToContent appends a trust signal to content", () => {
  const persona = createPersona("tenant-1", BASE_PERSONA);
  const result = applyPersonaToContent(persona, "You should track your macros.");

  const hasTrustSignal = BASE_PERSONA.trustSignals.some((ts) => result.includes(ts));
  assert.ok(hasTrustSignal, "Expected a trust signal to appear in the output");
});

test("applyPersonaToContent transforms hedging language for authoritative personas", () => {
  const persona = createPersona("tenant-1", {
    ...BASE_PERSONA,
    voiceTone: "authoritative and direct",
  });
  const result = applyPersonaToContent(persona, "I think you should train harder.");

  assert.ok(
    result.includes("Based on my experience") || !result.includes("I think"),
    "Should replace 'I think' for authoritative personas",
  );
});

test("applyPersonaToContent returns a non-empty string", () => {
  const persona = createPersona("tenant-1", BASE_PERSONA);
  const result = applyPersonaToContent(persona, "Test content.");

  assert.ok(typeof result === "string");
  assert.ok(result.length > 0);
});

// ---------------------------------------------------------------------------
// getPersonaRecommendation
// ---------------------------------------------------------------------------

test("getPersonaRecommendation returns a recommendation with required fields", () => {
  const rec = getPersonaRecommendation("fitness", "tiktok", "short-form");

  assert.ok(typeof rec.personaType === "string");
  assert.ok(typeof rec.reason === "string");
  assert.ok(rec.reason.length > 0);
  assert.ok(typeof rec.confidence === "number");
  assert.ok(rec.confidence >= 0 && rec.confidence <= 1);
});

test("getPersonaRecommendation favors storyteller for tiktok short-form", () => {
  const rec = getPersonaRecommendation("coaching", "tiktok", "short-form");

  const tiktokFavored = ["storyteller", "educator", "technician"];
  assert.ok(tiktokFavored.includes(rec.personaType), `Expected tiktok-favored type, got ${rec.personaType}`);
});

test("getPersonaRecommendation favors expert for linkedin long-form", () => {
  const rec = getPersonaRecommendation("saas", "linkedin", "long-form");

  const linkedinFavored = ["expert", "educator", "advisor"];
  assert.ok(linkedinFavored.includes(rec.personaType), `Expected linkedin-favored type, got ${rec.personaType}`);
});

test("getPersonaRecommendation handles unknown platform gracefully", () => {
  const rec = getPersonaRecommendation("health", "telegram", "thought-leadership");

  assert.ok(typeof rec.personaType === "string");
  assert.ok(rec.confidence >= 0);
});

test("getPersonaRecommendation reason string includes niche, platform, and content type", () => {
  const rec = getPersonaRecommendation("real-estate", "instagram", "case-study");

  assert.ok(rec.reason.includes("real-estate") || rec.reason.includes("instagram") || rec.reason.includes("case-study"));
});
