import { describe, expect, it } from "vitest";
import { niches } from "../niches";
import {
  TIER_BENEFITS,
  TIER_ORDER,
  type ProviderTier,
} from "../premium-rewards";
import {
  PROVIDER_FULFILLMENT_PROMISES,
  buildProviderFulfillmentPlan,
  getProviderFulfillmentReadiness,
  getProviderTierPromiseIds,
  getProviderTierPromises,
} from "../provider-fulfillment";

const EXPECTED_PROMISES: Record<ProviderTier, string[]> = {
  standard: [
    "exclusive-leads",
    "branded-landing-page",
    "ai-lead-scoring",
    "seven-stage-nurture",
    "monthly-performance-snapshot",
  ],
  premium: [
    "exclusive-leads",
    "branded-landing-page",
    "ai-lead-scoring",
    "seven-stage-nurture",
    "monthly-performance-snapshot",
    "featured-badge",
    "national-directory-listing",
    "review-automation",
    "monthly-pdf-report",
    "social-media-mentions",
    "priority-placement",
    "gbp-optimization",
  ],
  elite: [
    "exclusive-leads",
    "branded-landing-page",
    "ai-lead-scoring",
    "seven-stage-nurture",
    "monthly-performance-snapshot",
    "featured-badge",
    "national-directory-listing",
    "review-automation",
    "monthly-pdf-report",
    "social-media-mentions",
    "priority-placement",
    "gbp-optimization",
    "elite-certified-badge",
    "branded-content",
    "competitor-intelligence",
    "dedicated-account-manager",
    "custom-marketing-materials",
    "first-access-new-cities",
  ],
};

describe("provider fulfillment contract", () => {
  it("covers every public tier promise exactly once", () => {
    for (const tier of TIER_ORDER) {
      expect(getProviderTierPromiseIds(tier)).toEqual(EXPECTED_PROMISES[tier]);
    }
  });

  it("keeps tier benefits aligned with fulfillment promises", () => {
    expect(TIER_BENEFITS.standard.benefits).toEqual([
      "Exclusive leads in your niche",
      "Branded landing page",
      "AI-powered lead scoring",
      "7-stage nurture sequence",
      "Monthly performance snapshot",
    ]);

    expect(getProviderTierPromiseIds("premium")).toEqual(
      expect.arrayContaining([
        "featured-badge",
        "national-directory-listing",
        "review-automation",
        "monthly-pdf-report",
        "social-media-mentions",
        "priority-placement",
        "gbp-optimization",
      ])
    );
    expect(getProviderTierPromiseIds("elite")).toEqual(
      expect.arrayContaining([
        "elite-certified-badge",
        "branded-content",
        "competitor-intelligence",
        "dedicated-account-manager",
        "custom-marketing-materials",
        "first-access-new-cities",
      ])
    );
  });

  it("provisions every niche and tier with non-empty automation, evidence, and acceptance checks", () => {
    for (const niche of niches) {
      for (const tier of TIER_ORDER) {
        const plan = buildProviderFulfillmentPlan(
          {
            providerId: "provider_123",
            providerName: "Test Provider",
            providerEmail: "owner@example.com",
            niche: niche.slug,
            city: "erie",
            serviceTier: tier,
            monthlyFee: niche.monthlyFee,
          },
          new Date("2026-05-06T12:00:00.000Z")
        );

        expect(plan.planId).toBe(`provider_123:erie:${niche.slug}:${tier}`);
        expect(plan.nicheLabel).toBe(niche.label);
        expect(plan.deliverables.map((d) => d.id)).toEqual(EXPECTED_PROMISES[tier]);

        for (const deliverable of plan.deliverables) {
          expect(deliverable.status).toBe("provisioned");
          expect(deliverable.automatedSteps.length).toBeGreaterThan(0);
          expect(deliverable.evidence.length).toBeGreaterThan(0);
          expect(deliverable.acceptanceCriteria.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps premium and elite monthly social mention commitments explicit", () => {
    const premium = getProviderTierPromises("premium").find((p) => p.id === "social-media-mentions");
    const elite = getProviderTierPromises("elite").find((p) => p.id === "social-media-mentions");

    expect(TIER_BENEFITS.premium.socialMediaMentions).toBe(2);
    expect(TIER_BENEFITS.elite.socialMediaMentions).toBe(4);
    expect(premium?.acceptanceCriteria.join(" ")).toContain("2 social mentions");
    expect(elite?.acceptanceCriteria.join(" ")).toContain("4 social mentions");
  });

  it("keeps exclusive lead delivery universal across all service tiers", () => {
    for (const tier of TIER_ORDER) {
      expect(getProviderTierPromiseIds(tier)[0]).toBe("exclusive-leads");
    }
  });

  it("publishes a complete readiness matrix for all niche and tier combinations", () => {
    const readiness = getProviderFulfillmentReadiness();

    expect(readiness.nicheCount).toBe(niches.length);
    expect(readiness.tierCount).toBe(TIER_ORDER.length);
    expect(readiness.promiseCount).toBe(PROVIDER_FULFILLMENT_PROMISES.length);
    expect(readiness.matrixRows).toHaveLength(niches.length * TIER_ORDER.length);
    expect(readiness.matrixRows.every((row) => row.promiseCount >= 5)).toBe(true);
  });
});
