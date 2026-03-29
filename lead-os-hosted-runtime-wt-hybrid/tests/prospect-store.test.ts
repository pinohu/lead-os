import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  addProspect,
  getProspect,
  updateProspect,
  listProspects,
  removeProspect,
  getProspectStats,
  resetProspectStore,
  createProspectFromClassification,
  generateProspectRecordId,
  type Prospect,
} from "../src/lib/prospect-store.ts";
import { classifyBusiness } from "../src/lib/opportunity-classifier.ts";
import { scoreBusiness, type DiscoveredBusiness } from "../src/lib/discovery-scout.ts";

function makeProspect(overrides: Partial<Prospect> = {}): Prospect {
  const now = new Date().toISOString();
  return {
    id: generateProspectRecordId(),
    tenantId: "test-tenant",
    businessId: "biz_1",
    businessName: "Test Plumbing Co",
    niche: "plumbing",
    geo: "Austin TX",
    opportunityType: "managed-service",
    priority: "hot",
    confidence: 75,
    opportunityScore: 80,
    digitalGapScore: 90,
    affiliatePotential: 20,
    partnerPotential: 30,
    estimatedMonthlyValue: 3000,
    suggestedAction: "Outreach with digital audit",
    outreachTemplate: "Subject: ...",
    reasoning: ["No website", "High reviews"],
    status: "new",
    contactAttempts: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

describe("prospect store CRUD", () => {
  beforeEach(() => {
    resetProspectStore();
  });

  test("add and get prospect", async () => {
    const p = makeProspect();
    await addProspect(p);
    const fetched = await getProspect(p.id);
    assert.ok(fetched);
    assert.equal(fetched!.businessName, "Test Plumbing Co");
    assert.equal(fetched!.status, "new");
  });

  test("get returns undefined for unknown id", async () => {
    const result = await getProspect("nonexistent");
    assert.equal(result, undefined);
  });

  test("update prospect changes fields", async () => {
    const p = makeProspect();
    await addProspect(p);

    p.status = "contacted";
    p.contactAttempts = 1;
    p.lastContactedAt = new Date().toISOString();
    const updated = await updateProspect(p);

    assert.equal(updated.status, "contacted");
    assert.equal(updated.contactAttempts, 1);
    assert.ok(updated.lastContactedAt);

    const fetched = await getProspect(p.id);
    assert.equal(fetched!.status, "contacted");
  });

  test("remove prospect deletes it", async () => {
    const p = makeProspect();
    await addProspect(p);
    await removeProspect(p.id);
    const fetched = await getProspect(p.id);
    assert.equal(fetched, undefined);
  });

  test("remove nonexistent id does not throw", async () => {
    await assert.doesNotReject(() => removeProspect("ghost"));
  });
});

// ---------------------------------------------------------------------------
// listProspects with filters
// ---------------------------------------------------------------------------

describe("listProspects", () => {
  beforeEach(() => {
    resetProspectStore();
  });

  test("filters by tenant", async () => {
    await addProspect(makeProspect({ tenantId: "t1" }));
    await addProspect(makeProspect({ tenantId: "t2" }));

    const t1 = await listProspects({ tenantId: "t1" });
    assert.equal(t1.length, 1);
  });

  test("filters by status", async () => {
    await addProspect(makeProspect({ status: "new" }));
    await addProspect(makeProspect({ status: "contacted" }));

    const newOnes = await listProspects({ tenantId: "test-tenant", status: "new" });
    assert.equal(newOnes.length, 1);
    assert.equal(newOnes[0].status, "new");
  });

  test("filters by priority", async () => {
    await addProspect(makeProspect({ priority: "hot", confidence: 90 }));
    await addProspect(makeProspect({ priority: "cold", confidence: 10 }));

    const hot = await listProspects({ tenantId: "test-tenant", priority: "hot" });
    assert.equal(hot.length, 1);
    assert.equal(hot[0].priority, "hot");
  });

  test("filters by niche", async () => {
    await addProspect(makeProspect({ niche: "dental" }));
    await addProspect(makeProspect({ niche: "plumbing" }));

    const dental = await listProspects({ tenantId: "test-tenant", niche: "dental" });
    assert.equal(dental.length, 1);
    assert.equal(dental[0].niche, "dental");
  });

  test("filters by minConfidence", async () => {
    await addProspect(makeProspect({ confidence: 80 }));
    await addProspect(makeProspect({ confidence: 20 }));

    const high = await listProspects({ tenantId: "test-tenant", minConfidence: 50 });
    assert.equal(high.length, 1);
    assert.ok(high[0].confidence >= 50);
  });

  test("respects limit", async () => {
    for (let i = 0; i < 10; i++) {
      await addProspect(makeProspect({ confidence: i * 10 }));
    }

    const limited = await listProspects({ tenantId: "test-tenant", limit: 3 });
    assert.equal(limited.length, 3);
  });

  test("sorts by confidence descending", async () => {
    await addProspect(makeProspect({ confidence: 30 }));
    await addProspect(makeProspect({ confidence: 90 }));
    await addProspect(makeProspect({ confidence: 60 }));

    const sorted = await listProspects({ tenantId: "test-tenant" });
    assert.ok(sorted[0].confidence >= sorted[1].confidence);
    assert.ok(sorted[1].confidence >= sorted[2].confidence);
  });
});

// ---------------------------------------------------------------------------
// getProspectStats
// ---------------------------------------------------------------------------

describe("getProspectStats", () => {
  beforeEach(() => {
    resetProspectStore();
  });

  test("returns zeroes for empty store", async () => {
    const stats = await getProspectStats("test-tenant");
    assert.equal(stats.total, 0);
    assert.equal(stats.totalEstimatedValue, 0);
    assert.deepEqual(stats.byStatus, {});
  });

  test("aggregates correctly", async () => {
    await addProspect(makeProspect({ status: "new", priority: "hot", opportunityType: "managed-service", estimatedMonthlyValue: 3000 }));
    await addProspect(makeProspect({ status: "contacted", priority: "warm", opportunityType: "white-label", estimatedMonthlyValue: 500 }));
    await addProspect(makeProspect({ status: "new", priority: "hot", opportunityType: "managed-service", estimatedMonthlyValue: 5000 }));

    const stats = await getProspectStats("test-tenant");
    assert.equal(stats.total, 3);
    assert.equal(stats.byStatus["new"], 2);
    assert.equal(stats.byStatus["contacted"], 1);
    assert.equal(stats.byPriority["hot"], 2);
    assert.equal(stats.byPriority["warm"], 1);
    assert.equal(stats.byType["managed-service"], 2);
    assert.equal(stats.totalEstimatedValue, 8500);
  });

  test("only counts specified tenant", async () => {
    await addProspect(makeProspect({ tenantId: "t1" }));
    await addProspect(makeProspect({ tenantId: "t2" }));

    const stats = await getProspectStats("t1");
    assert.equal(stats.total, 1);
  });
});

// ---------------------------------------------------------------------------
// createProspectFromClassification
// ---------------------------------------------------------------------------

describe("createProspectFromClassification", () => {
  test("maps all fields from classification", () => {
    const biz: DiscoveredBusiness = {
      name: "Classification Target",
      address: "789 Elm",
      phone: "555-9999",
      email: "test@example.com",
      website: undefined,
      rating: 4.5,
      reviewCount: 80,
      niche: "hvac",
      geo: "Dallas TX",
      discoveredAt: new Date().toISOString(),
    };

    const scored = scoreBusiness(biz);
    const classification = classifyBusiness(scored);
    const prospect = createProspectFromClassification("my-tenant", classification);

    assert.ok(prospect.id.startsWith("prec_"));
    assert.equal(prospect.tenantId, "my-tenant");
    assert.equal(prospect.businessName, "Classification Target");
    assert.equal(prospect.niche, "hvac");
    assert.equal(prospect.geo, "Dallas TX");
    assert.equal(prospect.phone, "555-9999");
    assert.equal(prospect.email, "test@example.com");
    assert.equal(prospect.status, "new");
    assert.equal(prospect.contactAttempts, 0);
    assert.equal(prospect.opportunityType, classification.primaryOpportunity.type);
    assert.equal(prospect.confidence, classification.primaryOpportunity.confidence);
    assert.ok(prospect.reasoning.length > 0);
    assert.ok(prospect.createdAt);
  });
});

// ---------------------------------------------------------------------------
// generateProspectRecordId
// ---------------------------------------------------------------------------

describe("generateProspectRecordId", () => {
  test("produces unique ids", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateProspectRecordId());
    }
    assert.equal(ids.size, 100);
  });

  test("has prec_ prefix", () => {
    assert.ok(generateProspectRecordId().startsWith("prec_"));
  });
});
