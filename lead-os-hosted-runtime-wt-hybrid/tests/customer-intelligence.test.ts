import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOMER_INTELLIGENCE,
  getCustomerIntelligenceOrDefault,
  getAllIntelligenceNiches,
  getBuyingTriggers,
  getObjections,
  getTrustSignals,
  getConversionPsychology,
  getContentMap,
  getDecisionJourney,
  getCompetitors,
} from "../src/lib/customer-intelligence.ts";

describe("Customer Intelligence Engine", () => {
  it("has profiles for at least 13 niches", () => {
    assert.ok(getAllIntelligenceNiches().length >= 13);
  });

  it("every profile has all required sections", () => {
    for (const [niche, profile] of Object.entries(CUSTOMER_INTELLIGENCE)) {
      assert.ok(profile.icp, `${niche} missing ICP`);
      assert.ok(profile.buyingTriggers.length >= 3, `${niche} needs at least 3 buying triggers`);
      assert.ok(profile.decisionJourney.stages.length >= 3, `${niche} needs at least 3 journey stages`);
      assert.ok(profile.objections.length >= 2, `${niche} needs at least 2 objections`);
      assert.ok(profile.trustSignals.primary.length >= 2, `${niche} needs at least 2 primary trust signals`);
      assert.ok(profile.trustSignals.dealbreakers.length >= 2, `${niche} needs at least 2 dealbreakers`);
      assert.ok(profile.conversionPsychology.primaryMotivation, `${niche} missing primary motivation`);
      assert.ok(profile.competitors.alternatives.length >= 3, `${niche} needs at least 3 competitor alternatives`);
      assert.ok(profile.competitors.differentiators.length >= 2, `${niche} needs at least 2 differentiators`);
      assert.ok(profile.contentMap.length >= 3, `${niche} needs at least 3 content map entries`);
    }
  });

  it("ICP has complete fields for every niche", () => {
    for (const [niche, profile] of Object.entries(CUSTOMER_INTELLIGENCE)) {
      assert.ok(profile.icp.title, `${niche} ICP missing title`);
      assert.ok(profile.icp.role, `${niche} ICP missing role`);
      assert.ok(profile.icp.companySize, `${niche} ICP missing companySize`);
      assert.ok(profile.icp.revenueRange, `${niche} ICP missing revenueRange`);
      assert.ok(profile.icp.techStack.length >= 2, `${niche} ICP needs at least 2 tech stack items`);
      assert.ok(["sole-decider", "influences-decision", "committee"].includes(profile.icp.buyingAuthority), `${niche} ICP invalid buyingAuthority`);
    }
  });

  it("buying triggers have urgency and emotional state", () => {
    for (const [niche, profile] of Object.entries(CUSTOMER_INTELLIGENCE)) {
      for (const trigger of profile.buyingTriggers) {
        assert.ok(trigger.event, `${niche} trigger missing event`);
        assert.ok(["immediate", "this-quarter", "this-year"].includes(trigger.urgency), `${niche} trigger invalid urgency`);
        assert.ok(trigger.emotionalState, `${niche} trigger missing emotionalState`);
        assert.ok(trigger.searchBehavior, `${niche} trigger missing searchBehavior`);
      }
    }
  });

  it("objections have underlying fears and evidence-based responses", () => {
    for (const [niche, profile] of Object.entries(CUSTOMER_INTELLIGENCE)) {
      for (const obj of profile.objections) {
        assert.ok(obj.objection, `${niche} objection missing text`);
        assert.ok(obj.underlyingFear, `${niche} objection missing underlyingFear`);
        assert.ok(obj.evidenceBasedResponse, `${niche} objection missing evidenceBasedResponse`);
        assert.ok(["case-study", "statistic", "guarantee", "demo", "testimonial"].includes(obj.proofType), `${niche} objection invalid proofType`);
      }
    }
  });

  it("decision journeys have valid stage data", () => {
    for (const [niche, profile] of Object.entries(CUSTOMER_INTELLIGENCE)) {
      assert.ok(profile.decisionJourney.totalDays > 0, `${niche} journey needs positive totalDays`);
      assert.ok(profile.decisionJourney.touchpointsNeeded > 0, `${niche} journey needs positive touchpoints`);
      assert.ok(profile.decisionJourney.stakeholders > 0, `${niche} journey needs positive stakeholders`);
      for (const stage of profile.decisionJourney.stages) {
        assert.ok(stage.name, `${niche} stage missing name`);
        assert.ok(stage.primaryAction, `${niche} stage missing primaryAction`);
        assert.ok(stage.contentNeeded, `${niche} stage missing contentNeeded`);
        assert.ok(stage.dropOffRisk, `${niche} stage missing dropOffRisk`);
      }
    }
  });

  it("accessor functions return valid data", () => {
    const triggers = getBuyingTriggers("legal");
    assert.ok(triggers.length >= 3);

    const objections = getObjections("construction");
    assert.ok(objections.length >= 2);

    const trust = getTrustSignals("health");
    assert.ok(trust.primary.length >= 2);

    const psychology = getConversionPsychology("tech");
    assert.ok(psychology.primaryMotivation);

    const content = getContentMap("franchise");
    assert.ok(content.length >= 3);

    const journey = getDecisionJourney("staffing");
    assert.ok(journey.totalDays > 0);

    const competitors = getCompetitors("creative");
    assert.ok(competitors.alternatives.length >= 3);
  });

  it("getCustomerIntelligenceOrDefault falls back to general for unknown niches", () => {
    const result = getCustomerIntelligenceOrDefault("nonexistent-niche");
    assert.equal(result.niche, "general");
  });

  it("content map entries have valid conversion goals and expected CVR", () => {
    for (const [niche, profile] of Object.entries(CUSTOMER_INTELLIGENCE)) {
      for (const entry of profile.contentMap) {
        assert.ok(entry.stage, `${niche} content entry missing stage`);
        assert.ok(entry.contentType, `${niche} content entry missing contentType`);
        assert.ok(entry.topic, `${niche} content entry missing topic`);
        assert.ok(entry.conversionGoal, `${niche} content entry missing conversionGoal`);
        assert.ok(entry.expectedCvr, `${niche} content entry missing expectedCvr`);
      }
    }
  });

  it("does not expose placeholder trust or malformed anxiety copy", () => {
    const disallowed = /Used by X|No no|LeadOS shifts/i;

    for (const [niche, profile] of Object.entries(CUSTOMER_INTELLIGENCE)) {
      const visibleTrustCopy = [
        ...profile.trustSignals.primary,
        ...profile.trustSignals.secondary,
        ...profile.trustSignals.dealbreakers,
        ...profile.contentMap.map((entry) => entry.topic),
      ].join("\n");

      assert.doesNotMatch(visibleTrustCopy, disallowed, `${niche} exposes placeholder trust copy`);
    }
  });
});
