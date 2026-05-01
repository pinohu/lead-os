import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getOperatorPortal, getPortalPackage, getPortalPackages, operatorPortals } from "../src/lib/operator-portals.ts";
import { getProvisionablePackage } from "../src/lib/package-catalog.ts";
import { provisionPackageBundle } from "../src/lib/package-provisioner.ts";

describe("operator portals", () => {
  it("only expose valid subscribed package slugs", () => {
    assert.ok(operatorPortals.length >= 2);

    for (const portal of operatorPortals) {
      assert.ok(portal.subscribedPackageSlugs.length > 0, `${portal.slug} should have subscribed services`);
      assert.ok(portal.defaultSelectedSlugs.length > 0, `${portal.slug} should have default selected services`);

      for (const slug of portal.subscribedPackageSlugs) {
        assert.ok(getProvisionablePackage(slug), `${portal.slug} references unknown package ${slug}`);
      }

      for (const slug of portal.defaultSelectedSlugs) {
        assert.ok(portal.subscribedPackageSlugs.includes(slug), `${slug} should be subscribed before it is selected by default`);
      }
    }
  });

  it("keeps unsubscribed packages out of a narrower operator portal", () => {
    const portal = getOperatorPortal("erie-demand-studio");
    assert.ok(portal);

    const packages = getPortalPackages(portal);
    assert.ok(packages.length < 23);
    assert.equal(getPortalPackage(portal, "ghost-expert-course-factory"), undefined);
    assert.ok(packages.every((pkg) => portal.subscribedPackageSlugs.includes(pkg.slug)));
  });

  it("provisions white-label workspace URLs and service guidance for portal bundles", () => {
    const portal = getOperatorPortal("northstar-growth");
    assert.ok(portal);

    const bundle = provisionPackageBundle({
      packageSlugs: ["ai-opportunity-audit", "ai-receptionist-missed-call-recovery"],
      brandName: "Acme Client",
      operatorEmail: "operator@example.com",
      primaryDomain: "https://example.com",
      targetMarket: "med spas",
      primaryOffer: "Recover missed calls and identify the first AI workflows to install.",
      credentials: {
        idealCustomerProfile: "med spa owners who miss calls after hours",
        successMetric: "booked appointments and recovered call value",
        currentProcess: "Manual call handling and scattered AI ideas",
        fulfillmentConstraints: "Avoid medical guarantees and route sensitive questions to staff.",
        brandVoice: "Warm, direct, and premium.",
        avatarVoiceConsent: "not-applicable",
      },
      appUrl: `https://example.com/portal/${portal.slug}`,
      deliveryBrandName: portal.brandName,
      guidanceOptions: {
        engineRoleName: `${portal.brandName} service engine`,
        managedHandoffLabel: "service handoff",
      },
    });

    assert.equal(bundle.urls.workspaces.length, 2);
    assert.ok(bundle.urls.workspaces.every((url) => url.startsWith(`https://example.com/portal/${portal.slug}/packages/`)));

    const serialized = JSON.stringify(bundle);
    assert.match(serialized, /Northstar Growth service engine/);
    assert.doesNotMatch(serialized, /Lead OS system/);
    assert.doesNotMatch(serialized, /lead-os-hosted-runtime/);
  });
});
