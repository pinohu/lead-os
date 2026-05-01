import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aiAgencyPackageSlugs, getPackageAutomationContract, provisionablePackages, simpleOnboardingFieldKeys } from "../src/lib/package-catalog.ts";
import { provisionPackage, provisionPackageBundle } from "../src/lib/package-provisioner.ts";
import {
  _resetPackageProvisioningStoreForTests,
  getProvisionedPackage,
  saveProvisionedPackage,
} from "../src/lib/package-provisioning-store.ts";

const outcomeContext = {
  idealCustomerProfile: "Decision makers who want a complete outcome without learning new software.",
  successMetric: "qualified opportunities, finished assets, recovered revenue, and hours saved",
  currentProcess: "The customer currently handles the work manually with inconsistent follow-up and reporting.",
  fulfillmentConstraints: "Use human approval for regulated claims and avoid unsupported guarantees.",
  brandVoice: "clear, professional, helpful, and outcome-focused",
};

describe("package provisioning", () => {
  it("exposes many complete package artifacts, not only the small live deliverable examples", () => {
    const totalArtifacts = provisionablePackages.reduce((total, pkg) => total + pkg.deliverables.length, 0);

    assert.equal(provisionablePackages.length, 23);
    assert.ok(totalArtifacts >= 184);
  });

  it("keeps every package wired to credential fields and concrete created artifacts", () => {
    for (const pkg of provisionablePackages) {
      assert.ok(pkg.credentialFields.some((field) => field.required), `${pkg.slug} should require setup fields`);
      assert.ok(pkg.deliverables.length >= 8, `${pkg.slug} should launch a complete bundle`);

      for (const deliverable of pkg.deliverables) {
        assert.ok(deliverable.title.length > 3);
        assert.ok(deliverable.createdArtifact.length > 20);
      }
    }
  });

  it("includes the 2026 autonomous agency products as concrete provisionable outcomes", () => {
    const slugs = new Set(provisionablePackages.map((pkg) => pkg.slug));

    for (const slug of [
      "ai-opportunity-audit",
      "ghost-expert-course-factory",
      "ai-receptionist-missed-call-recovery",
      "lead-reactivation-engine",
      "speed-to-lead-system",
      "content-repurposing-engine",
      "ai-ugc-video-ad-studio",
      "med-spa-growth-engine",
      "webinar-lead-magnet-factory",
      "founder-ai-chief-of-staff",
      "ai-first-business-os",
    ]) {
      assert.ok(slugs.has(slug), `${slug} should be a sellable autonomous agency product`);
    }

    const flagship = provisionablePackages.find((pkg) => pkg.slug === "ghost-expert-course-factory");
    assert.ok(flagship?.pricingModel?.includes("$5,000-$40,000"));
    assert.ok(flagship?.autonomousWorkflow?.some((step) => step.includes("Knowledge Extraction Agent")));
  });

  it("provisions a launched package with URLs, embed code, automation, and acceptance tests", () => {
    const result = provisionPackage({
      packageSlug: "local-service-lead-engine",
      brandName: "Acme Roofing",
      operatorEmail: "ops@example.com",
      primaryDomain: "https://example.com",
      targetMarket: "roofing customers in Erie, PA",
      primaryOffer: "Book an emergency roofing quote",
      credentials: {
        ...outcomeContext,
        bookingUrl: "https://cal.com/acme/roofing",
        webhookUrl: "https://example.com/webhooks/leads",
      },
      appUrl: "https://lead-os.example.com",
    });

    assert.equal(result.status, "launched");
    assert.match(result.urls.workspace, /^https:\/\/lead-os\.example\.com\/packages\/local-service-lead-engine\/workspace\//);
    assert.match(result.urls.capture, /\/capture\?/);
    assert.match(result.embed.script, /api\/widgets\/boot/);
    assert.equal(result.credentials.missingRequired.length, 0);
    assert.ok(result.credentials.managedDefaults.some((field) => field.key === "crmApiKey"));
    assert.equal(result.automationContract.requiresAdditionalConfiguration, false);
    assert.equal(result.automationContract.deliveryMode, "complete-solution");
    assert.equal(result.solutionBrief.successMetric, outcomeContext.successMetric);
    assert.equal(result.artifacts.length, 9);
    assert.ok(result.automationRuns.length >= 5);
    assert.ok(result.acceptanceTests.every((test) => test.status === "passed"));
  });

  it("provisions a new AI agency product with its required consent field", () => {
    const result = provisionPackage({
      packageSlug: "ghost-expert-course-factory",
      brandName: "Brian Expert Course",
      operatorEmail: "ops@example.com",
      primaryDomain: "https://example.com",
      targetMarket: "camera-shy experts with premium knowledge",
      primaryOffer: "Turn your expertise into a finished branded course",
      credentials: {
        ...outcomeContext,
        avatarVoiceConsent: "approved",
        sourceAssetUrl: "https://example.com/source-notes",
        brandAssetsUrl: "https://example.com/brand",
      },
      appUrl: "https://lead-os.example.com",
    });

    assert.equal(result.credentials.missingRequired.length, 0);
    assert.equal(result.artifacts.length, 8);
    assert.match(result.urls.workspace, /ghost-expert-course-factory/);
    assert.ok(result.artifacts.some((artifact) => artifact.title === "Polished lesson scripts"));
  });

  it("keeps every AI agency offer fully automated, modular, and multi-niche", () => {
    for (const slug of aiAgencyPackageSlugs) {
      const pkg = provisionablePackages.find((item) => item.slug === slug);
      assert.ok(pkg, `${slug} should exist`);
      const contract = getPackageAutomationContract(pkg);

      assert.equal(contract.modular, true, `${slug} should be modular`);
      assert.equal(contract.fullyAutomated, true, `${slug} should have a complete autonomous workflow`);
      assert.equal(contract.requiresAdditionalConfiguration, false, `${slug} should not require post-form setup for delivery`);
      assert.equal(contract.deliveryMode, "complete-solution", `${slug} should be sold as a complete solution`);
      assert.ok(contract.nicheExamples.length >= 3, `${slug} should apply to multiple niches`);
      for (const key of ["idealCustomerProfile", "successMetric", "currentProcess", "fulfillmentConstraints", "brandVoice"]) {
        assert.ok(simpleOnboardingFieldKeys.includes(key as never), `${key} should be collected by the simple intake`);
      }
      assert.ok(pkg.deliverables.every((deliverable) => deliverable.launchSurface), `${slug} deliverables should have launch surfaces`);
    }
  });

  it("keeps AI agency offer language focused on complete solutions instead of customer-operated tools", () => {
    for (const slug of aiAgencyPackageSlugs) {
      const pkg = provisionablePackages.find((item) => item.slug === slug);
      assert.ok(pkg);
      const publicCopy = [
        pkg.title,
        pkg.customerOutcome,
        pkg.buyerPersona,
        pkg.launchPromise,
        ...pkg.deliverables.flatMap((deliverable) => [deliverable.title, deliverable.createdArtifact]),
      ].join(" ");

      assert.doesNotMatch(publicCopy, /\btools?\b/i, `${slug} should not sell tools in customer-facing copy`);
    }
  });

  it("provisions all AI agency offers from one simple onboarding form", () => {
    const bundle = provisionPackageBundle({
      packageSlugs: [...aiAgencyPackageSlugs],
      brandName: "Acme AI Agency Bundle",
      operatorEmail: "ops@example.com",
      primaryDomain: "https://example.com",
      targetMarket: "med spas, home services, ecommerce, B2B experts, and SMB operators",
      primaryOffer: "Launch a modular AI agency operating system with outcome-based offers",
      credentials: {
        ...outcomeContext,
        avatarVoiceConsent: "approved",
        complianceRules: "Use human approval for regulated claims.",
      },
      appUrl: "https://lead-os.example.com",
    });

    assert.equal(bundle.status, "launched");
    assert.equal(bundle.packageSlugs.length, aiAgencyPackageSlugs.length);
    assert.equal(bundle.packages.every((pkg) => pkg.status === "launched"), true);
    assert.equal(bundle.packages.every((pkg) => pkg.credentials.missingRequired.length === 0), true);
    assert.equal(bundle.packages.every((pkg) => pkg.automationContract.requiresAdditionalConfiguration === false), true);
    assert.equal(bundle.packages.every((pkg) => pkg.solutionBrief.successMetric === outcomeContext.successMetric), true);
    assert.ok(bundle.totalArtifacts >= aiAgencyPackageSlugs.length * 8);
    assert.equal(bundle.acceptanceTests.every((test) => test.status === "passed"), true);
    assert.equal(
      bundle.automationRuns.every((run) => !/\bpackage workspace|package selected|package count\b/i.test(`${run.step} ${run.detail}`)),
      true,
    );
  });

  it("fails clearly when a client tries to launch without choosing a solution", () => {
    assert.throws(
      () =>
        provisionPackageBundle({
          packageSlugs: [],
          brandName: "Acme Empty Bundle",
          operatorEmail: "ops@example.com",
          primaryDomain: "https://example.com",
          targetMarket: "SMB operators",
          primaryOffer: "Launch a complete AI solution",
          credentials: outcomeContext,
          appUrl: "https://lead-os.example.com",
        }),
      /At least one solution is required/,
    );
  });

  it("persists provisioned package records for later customer/operator retrieval", async () => {
    _resetPackageProvisioningStoreForTests();
    const provisioned = provisionPackage({
      packageSlug: "agency-client-workspace",
      brandName: "Northstar Agency",
      operatorEmail: "ops@northstar.example",
      primaryDomain: "northstar.example",
      targetMarket: "local service clients",
      primaryOffer: "Launch client lead systems",
      credentials: outcomeContext,
      appUrl: "https://lead-os.example.com",
    });

    const saved = await saveProvisionedPackage(provisioned, "tenant-test");
    const fetched = await getProvisionedPackage(provisioned.launchId, "tenant-test");

    assert.equal(saved.persisted, false);
    assert.ok(fetched);
    assert.equal(fetched.launchId, provisioned.launchId);
    assert.equal(fetched.packageSlug, "agency-client-workspace");
    assert.equal(fetched.tenantId, "tenant-test");
  });
});
