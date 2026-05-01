import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPlanDeliverables,
  liveDeliverables,
  type DeliverableSlug,
} from "../src/lib/live-deliverables.ts";
import { publicPlans } from "../src/lib/public-offer.ts";

const interactiveSlugs: DeliverableSlug[] = [
  "lead-capture-workspace",
  "lead-scoring-routing",
  "embed-capture-script",
  "support-lane",
];

describe("live deliverables catalog", () => {
  it("keeps every sold deliverable mapped to a public live path", () => {
    assert.equal(liveDeliverables.length, 12);

    for (const deliverable of liveDeliverables) {
      assert.match(deliverable.livePath, /^\/deliverables\/[a-z0-9-]+$/);
      assert.ok(deliverable.buyerOutcome.length > 20);
      assert.ok(deliverable.deliveredArtifact.length > 20);
      assert.ok(deliverable.backendReality.length > 20);
      assert.ok(deliverable.acceptanceCriteria.length >= 3);
    }
  });

  it("has at least one deliverable for each public plan", () => {
    for (const plan of publicPlans) {
      assert.ok(getPlanDeliverables(plan.id).length > 0, `${plan.id} should expose deliverables`);
    }
  });

  it("keeps interactive examples for the artifacts customers must understand first", () => {
    const slugs = new Set(liveDeliverables.map((deliverable) => deliverable.slug));

    for (const slug of interactiveSlugs) {
      assert.ok(slugs.has(slug), `${slug} must stay present`);
    }
  });
});
