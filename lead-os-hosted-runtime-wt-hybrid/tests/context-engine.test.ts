import test from "node:test";
import assert from "node:assert/strict";
import {
  createContext,
  getContext,
  getContextSync,
  updateContext,
  addInteraction,
  addTouchpoint,
  getContextSnapshot,
  getContextsByTenant,
  deleteContext,
  resetContextStore,
  getContextStoreSize,
  type LeadContext,
  type Interaction,
  type Touchpoint,
} from "../src/lib/context-engine.ts";

// Reset store before each test group
function setup() {
  resetContextStore();
}

// ---------------------------------------------------------------------------
// createContext
// ---------------------------------------------------------------------------

test("createContext returns a fully initialized LeadContext", () => {
  setup();
  const ctx = createContext("lead-001", "tenant-a", { niche: "pest-control", email: "test@example.com" });

  assert.equal(ctx.leadKey, "lead-001");
  assert.equal(ctx.tenantId, "tenant-a");
  assert.equal(ctx.niche, "pest-control");
  assert.equal(ctx.email, "test@example.com");
  assert.equal(ctx.source, "direct");
  assert.equal(ctx.funnelStage, "new");
  assert.equal(ctx.currentRoute, "nurture");
  assert.equal(ctx.escalated, false);
  assert.equal(ctx.scores.composite, 0);
  assert.equal(ctx.scores.temperature, "cold");
  assert.deepEqual(ctx.interactions, []);
  assert.deepEqual(ctx.touchpoints, []);
  assert.deepEqual(ctx.offersPresented, []);
  assert.deepEqual(ctx.offersAccepted, []);
});

test("createContext uses defaults for optional fields", () => {
  setup();
  const ctx = createContext("lead-002", "tenant-a");

  assert.equal(ctx.niche, "general");
  assert.equal(ctx.source, "direct");
  assert.equal(ctx.email, undefined);
  assert.equal(ctx.phone, undefined);
  assert.equal(ctx.name, undefined);
  assert.equal(ctx.company, undefined);
});

test("createContext sets timestamps", () => {
  setup();
  const before = new Date().toISOString();
  const ctx = createContext("lead-003", "tenant-a");
  const after = new Date().toISOString();

  assert.ok(ctx.firstSeen >= before);
  assert.ok(ctx.firstSeen <= after);
  assert.equal(ctx.firstSeen, ctx.lastSeen);
  assert.equal(ctx.firstSeen, ctx.updatedAt);
});

test("createContext stores initial data fields", () => {
  setup();
  const ctx = createContext("lead-004", "tenant-a", {
    name: "John Doe",
    company: "Acme Inc",
    phone: "555-1234",
    source: "google-ads",
    designSpecId: "spec-123",
  });

  assert.equal(ctx.name, "John Doe");
  assert.equal(ctx.company, "Acme Inc");
  assert.equal(ctx.phone, "555-1234");
  assert.equal(ctx.source, "google-ads");
  assert.equal(ctx.designSpecId, "spec-123");
});

// ---------------------------------------------------------------------------
// getContext / getContextSync
// ---------------------------------------------------------------------------

test("getContext retrieves an existing context", async () => {
  setup();
  createContext("lead-get-1", "tenant-a");
  const ctx = await getContext("lead-get-1");

  assert.ok(ctx);
  assert.equal(ctx.leadKey, "lead-get-1");
});

test("getContext returns null for non-existent lead", async () => {
  setup();
  const ctx = await getContext("non-existent");
  assert.equal(ctx, null);
});

test("getContextSync retrieves from in-memory store", () => {
  setup();
  createContext("lead-sync-1", "tenant-a");
  const ctx = getContextSync("lead-sync-1");

  assert.ok(ctx);
  assert.equal(ctx.leadKey, "lead-sync-1");
});

test("getContextSync returns null for non-existent lead", () => {
  setup();
  const ctx = getContextSync("non-existent");
  assert.equal(ctx, null);
});

// ---------------------------------------------------------------------------
// updateContext
// ---------------------------------------------------------------------------

test("updateContext deep merges partial updates", () => {
  setup();
  createContext("lead-upd-1", "tenant-a", { niche: "roofing" });
  const updated = updateContext("lead-upd-1", {
    scores: { intent: 80, composite: 75, temperature: "hot" },
    funnelStage: "qualified",
  });

  assert.ok(updated);
  assert.equal(updated.scores.intent, 80);
  assert.equal(updated.scores.composite, 75);
  assert.equal(updated.scores.temperature, "hot");
  assert.equal(updated.scores.fit, 0);
  assert.equal(updated.funnelStage, "qualified");
  assert.equal(updated.niche, "roofing");
});

test("updateContext returns null for non-existent lead", () => {
  setup();
  const result = updateContext("non-existent", { funnelStage: "qualified" });
  assert.equal(result, null);
});

test("updateContext updates timestamps", () => {
  setup();
  const original = createContext("lead-upd-ts", "tenant-a");
  const originalUpdatedAt = original.updatedAt;

  const updated = updateContext("lead-upd-ts", { funnelStage: "engaged" });
  assert.ok(updated);
  assert.ok(updated.updatedAt >= originalUpdatedAt);
  assert.equal(updated.lastSeen, updated.updatedAt);
});

test("updateContext preserves leadKey and tenantId", () => {
  setup();
  createContext("lead-upd-preserve", "tenant-a");
  const updated = updateContext("lead-upd-preserve", { niche: "immigration-law" });

  assert.ok(updated);
  assert.equal(updated.leadKey, "lead-upd-preserve");
  assert.equal(updated.tenantId, "tenant-a");
});

test("updateContext handles nested psychology profile update", () => {
  setup();
  createContext("lead-upd-psych", "tenant-a");
  const updated = updateContext("lead-upd-psych", {
    psychologyProfile: {
      trustLevel: 75,
      identityType: "analytical",
    },
  });

  assert.ok(updated);
  assert.equal(updated.psychologyProfile.trustLevel, 75);
  assert.equal(updated.psychologyProfile.identityType, "analytical");
  assert.deepEqual(updated.psychologyProfile.fearTriggers, []);
  assert.equal(updated.psychologyProfile.emotionalStage, "unaware");
});

// ---------------------------------------------------------------------------
// addInteraction
// ---------------------------------------------------------------------------

test("addInteraction appends to the interactions array", () => {
  setup();
  createContext("lead-int-1", "tenant-a");

  const interaction: Interaction = {
    type: "page-view",
    timestamp: new Date().toISOString(),
    channel: "web",
    metadata: { page: "/pricing" },
  };

  const result = addInteraction("lead-int-1", interaction);
  assert.ok(result);
  assert.equal(result.interactions.length, 1);
  assert.equal(result.interactions[0].type, "page-view");
  assert.deepEqual(result.interactions[0].metadata, { page: "/pricing" });
});

test("addInteraction accumulates multiple interactions", () => {
  setup();
  createContext("lead-int-2", "tenant-a");

  addInteraction("lead-int-2", { type: "page-view", timestamp: new Date().toISOString(), channel: "web", metadata: {} });
  addInteraction("lead-int-2", { type: "form-submit", timestamp: new Date().toISOString(), channel: "web", metadata: {} });
  addInteraction("lead-int-2", { type: "chat-message", timestamp: new Date().toISOString(), channel: "chat", metadata: {} });

  const ctx = getContextSync("lead-int-2");
  assert.ok(ctx);
  assert.equal(ctx.interactions.length, 3);
});

test("addInteraction returns null for non-existent lead", () => {
  setup();
  const result = addInteraction("non-existent", { type: "test", timestamp: "", channel: "", metadata: {} });
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// addTouchpoint
// ---------------------------------------------------------------------------

test("addTouchpoint appends to the touchpoints array", () => {
  setup();
  createContext("lead-tp-1", "tenant-a");

  const touchpoint: Touchpoint = {
    channel: "google-ads",
    source: "google",
    timestamp: new Date().toISOString(),
  };

  const result = addTouchpoint("lead-tp-1", touchpoint);
  assert.ok(result);
  assert.equal(result.touchpoints.length, 1);
  assert.equal(result.touchpoints[0].channel, "google-ads");
});

test("addTouchpoint returns null for non-existent lead", () => {
  setup();
  const result = addTouchpoint("non-existent", { channel: "web", source: "direct", timestamp: "" });
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// getContextSnapshot
// ---------------------------------------------------------------------------

test("getContextSnapshot returns a frozen copy", () => {
  setup();
  createContext("lead-snap-1", "tenant-a", { niche: "roofing" });
  const snapshot = getContextSnapshot("lead-snap-1");

  assert.ok(snapshot);
  assert.equal(snapshot.leadKey, "lead-snap-1");
  assert.equal(snapshot.niche, "roofing");
  assert.ok(Object.isFrozen(snapshot));

  assert.throws(() => {
    (snapshot as LeadContext).niche = "changed";
  });
});

test("getContextSnapshot is not affected by subsequent updates", () => {
  setup();
  createContext("lead-snap-2", "tenant-a", { niche: "roofing" });
  const snapshot = getContextSnapshot("lead-snap-2");

  updateContext("lead-snap-2", { niche: "plumbing" });

  assert.ok(snapshot);
  assert.equal(snapshot.niche, "roofing");

  const current = getContextSync("lead-snap-2");
  assert.ok(current);
  assert.equal(current.niche, "plumbing");
});

test("getContextSnapshot returns null for non-existent lead", () => {
  setup();
  const result = getContextSnapshot("non-existent");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// getContextsByTenant
// ---------------------------------------------------------------------------

test("getContextsByTenant returns all contexts for a tenant", async () => {
  setup();
  createContext("lead-t1-a", "tenant-1", { niche: "pest-control" });
  createContext("lead-t1-b", "tenant-1", { niche: "roofing" });
  createContext("lead-t2-a", "tenant-2", { niche: "staffing" });

  const results = await getContextsByTenant("tenant-1");
  assert.equal(results.length, 2);
  assert.ok(results.every((c) => c.tenantId === "tenant-1"));
});

test("getContextsByTenant filters by funnelStage", async () => {
  setup();
  createContext("lead-fs-1", "tenant-3");
  createContext("lead-fs-2", "tenant-3");
  updateContext("lead-fs-1", { funnelStage: "qualified" });

  const results = await getContextsByTenant("tenant-3", { funnelStage: "qualified" });
  assert.equal(results.length, 1);
  assert.equal(results[0].leadKey, "lead-fs-1");
});

test("getContextsByTenant filters by temperature", async () => {
  setup();
  createContext("lead-temp-1", "tenant-4");
  createContext("lead-temp-2", "tenant-4");
  updateContext("lead-temp-1", { scores: { temperature: "hot" } });

  const results = await getContextsByTenant("tenant-4", { temperature: "hot" });
  assert.equal(results.length, 1);
  assert.equal(results[0].leadKey, "lead-temp-1");
});

test("getContextsByTenant filters by minCompositeScore", async () => {
  setup();
  createContext("lead-score-1", "tenant-5");
  createContext("lead-score-2", "tenant-5");
  updateContext("lead-score-1", { scores: { composite: 85 } });
  updateContext("lead-score-2", { scores: { composite: 30 } });

  const results = await getContextsByTenant("tenant-5", { minCompositeScore: 50 });
  assert.equal(results.length, 1);
  assert.equal(results[0].leadKey, "lead-score-1");
});

test("getContextsByTenant respects limit", async () => {
  setup();
  for (let i = 0; i < 5; i++) {
    createContext(`lead-lim-${i}`, "tenant-6");
  }

  const results = await getContextsByTenant("tenant-6", { limit: 3 });
  assert.equal(results.length, 3);
});

test("getContextsByTenant returns empty for unknown tenant", async () => {
  setup();
  const results = await getContextsByTenant("unknown-tenant");
  assert.equal(results.length, 0);
});

// ---------------------------------------------------------------------------
// deleteContext
// ---------------------------------------------------------------------------

test("deleteContext removes the context from the store", () => {
  setup();
  createContext("lead-del-1", "tenant-a");
  assert.equal(getContextStoreSize(), 1);

  const deleted = deleteContext("lead-del-1");
  assert.equal(deleted, true);
  assert.equal(getContextStoreSize(), 0);
  assert.equal(getContextSync("lead-del-1"), null);
});

test("deleteContext returns false for non-existent lead", () => {
  setup();
  const deleted = deleteContext("non-existent");
  assert.equal(deleted, false);
});

// ---------------------------------------------------------------------------
// resetContextStore
// ---------------------------------------------------------------------------

test("resetContextStore clears all contexts", () => {
  setup();
  createContext("lead-r1", "tenant-a");
  createContext("lead-r2", "tenant-a");
  assert.equal(getContextStoreSize(), 2);

  resetContextStore();
  assert.equal(getContextStoreSize(), 0);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("multiple updates accumulate correctly", () => {
  setup();
  createContext("lead-multi", "tenant-a");

  updateContext("lead-multi", { scores: { intent: 50 } });
  updateContext("lead-multi", { scores: { fit: 30 } });
  updateContext("lead-multi", { funnelStage: "qualified" });

  const ctx = getContextSync("lead-multi");
  assert.ok(ctx);
  assert.equal(ctx.scores.intent, 50);
  assert.equal(ctx.scores.fit, 30);
  assert.equal(ctx.funnelStage, "qualified");
});

test("createContext with all optional fields", () => {
  setup();
  const ctx = createContext("lead-full", "tenant-a", {
    niche: "immigration-law",
    email: "john@law.com",
    phone: "555-9999",
    name: "John Attorney",
    company: "Law Firm LLC",
    source: "referral",
    designSpecId: "spec-456",
  });

  assert.equal(ctx.niche, "immigration-law");
  assert.equal(ctx.email, "john@law.com");
  assert.equal(ctx.phone, "555-9999");
  assert.equal(ctx.name, "John Attorney");
  assert.equal(ctx.company, "Law Firm LLC");
  assert.equal(ctx.source, "referral");
  assert.equal(ctx.designSpecId, "spec-456");
});

test("updateContext with offers arrays", () => {
  setup();
  createContext("lead-offers", "tenant-a");

  updateContext("lead-offers", {
    offersPresented: ["offer-a", "offer-b"],
    offersAccepted: ["offer-a"],
  });

  const ctx = getContextSync("lead-offers");
  assert.ok(ctx);
  assert.deepEqual(ctx.offersPresented, ["offer-a", "offer-b"]);
  assert.deepEqual(ctx.offersAccepted, ["offer-a"]);
});

test("updateContext with escalation state", () => {
  setup();
  createContext("lead-esc", "tenant-a");

  updateContext("lead-esc", { escalated: true, assignedRep: "rep-001" });

  const ctx = getContextSync("lead-esc");
  assert.ok(ctx);
  assert.equal(ctx.escalated, true);
  assert.equal(ctx.assignedRep, "rep-001");
});

test("getContextsByTenant filters by escalated flag", async () => {
  setup();
  createContext("lead-esc-f1", "tenant-7");
  createContext("lead-esc-f2", "tenant-7");
  updateContext("lead-esc-f1", { escalated: true });

  const escalated = await getContextsByTenant("tenant-7", { escalated: true });
  assert.equal(escalated.length, 1);
  assert.equal(escalated[0].leadKey, "lead-esc-f1");

  const nonEscalated = await getContextsByTenant("tenant-7", { escalated: false });
  assert.equal(nonEscalated.length, 1);
  assert.equal(nonEscalated[0].leadKey, "lead-esc-f2");
});

test("getContextsByTenant filters by currentRoute", async () => {
  setup();
  createContext("lead-route-1", "tenant-8");
  createContext("lead-route-2", "tenant-8");
  updateContext("lead-route-1", { currentRoute: "fast-track" });

  const results = await getContextsByTenant("tenant-8", { currentRoute: "fast-track" });
  assert.equal(results.length, 1);
  assert.equal(results[0].leadKey, "lead-route-1");
});
