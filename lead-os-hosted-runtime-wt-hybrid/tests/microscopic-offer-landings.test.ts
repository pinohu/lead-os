import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nicheCatalog } from "../src/lib/catalog.ts";
import { GTM_USE_CASES } from "../src/config/gtm-use-cases.ts";
import { buildDefaultFunnelGraphs } from "../src/lib/funnel-library.ts";
import { liveDeliverables } from "../src/lib/live-deliverables.ts";
import { microscopicOfferLandings } from "../src/lib/microscopic-offer-landings.ts";
import { provisionablePackages } from "../src/lib/package-catalog.ts";
import { publicPlans } from "../src/lib/public-offer.ts";

describe("microscopic offer landing pages", () => {
  it("creates one landing page for every standalone package, deliverable, vertical, funnel, GTM play, and plan", () => {
    const expected =
      provisionablePackages.length +
      liveDeliverables.length +
      Object.values(nicheCatalog).length +
      Object.values(buildDefaultFunnelGraphs("test")).length +
      GTM_USE_CASES.length +
      publicPlans.length;

    assert.equal(microscopicOfferLandings.length, expected);
    assert.equal(expected, 74);
  });

  it("keeps every microscopic offer landing unambiguous and persona-specific", () => {
    const slugs = new Set<string>();

    for (const offer of microscopicOfferLandings) {
      assert.ok(!slugs.has(offer.slug), `${offer.slug} should be unique`);
      slugs.add(offer.slug);

      assert.ok(offer.title.length > 3, `${offer.slug} needs a title`);
      assert.ok(offer.persona.length > 30, `${offer.slug} needs a clear audience`);
      assert.ok(offer.decisionMaker.length > 20, `${offer.slug} needs a decision maker`);
      assert.ok(offer.endUser.length > 30, `${offer.slug} needs an end user or resident persona`);
      assert.ok(offer.message.length > 40, `${offer.slug} needs a direct message`);
      assert.ok(offer.painPoints.length >= 4, `${offer.slug} needs at least four pain points`);
      assert.ok(offer.expectedOutcome.length > 40, `${offer.slug} needs an expected result`);
      assert.ok(offer.deliveryShape.length >= 3, `${offer.slug} needs delivered shape and form`);
      assert.ok(offer.proof.length >= 3, `${offer.slug} needs proof of source or readiness`);
      assert.ok(offer.primaryCtaHref.startsWith("/"), `${offer.slug} primary CTA should be internal`);
      assert.ok(offer.secondaryCtaHref.startsWith("/"), `${offer.slug} secondary CTA should be internal`);
    }
  });
});
