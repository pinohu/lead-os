import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAllPackageClientExamples,
  getAllPackageDeliverableClientExamples,
  getPackageClientExample,
  getPackageDeliverableClientExample,
} from "../src/lib/package-client-examples.ts";
import { provisionablePackages } from "../src/lib/package-catalog.ts";

describe("package client example websites", () => {
  it("creates one standalone client example for every provisionable package", () => {
    const examples = getAllPackageClientExamples();

    assert.equal(examples.length, provisionablePackages.length);

    for (const pkg of provisionablePackages) {
      const example = getPackageClientExample(pkg.slug);
      assert.ok(example, `${pkg.slug} is missing a client example`);
      assert.equal(example.visibleDeliverables.length, pkg.deliverables.length);
      assert.ok(example.shortUrl.endsWith(pkg.slug));
      assert.ok(example.photoUrl.startsWith("https://images.unsplash.com/"), `${pkg.slug} needs a real photo URL`);
    }
  });

  it("keeps client examples simple, specific, and usable", () => {
    for (const example of getAllPackageClientExamples()) {
      assert.ok(example.clientName.length > 5, `${example.pkg.slug} needs a client name`);
      assert.ok(example.domain.endsWith(".example"), `${example.pkg.slug} should look like a sample client domain`);
      assert.ok(example.mainPain.length > 40, `${example.pkg.slug} needs a clear pain`);
      assert.ok(example.plainPromise.length > 40, `${example.pkg.slug} needs a clear promise`);
      assert.ok(example.exampleResult.length > 50, `${example.pkg.slug} needs a clear result`);
      assert.equal(example.processMap.length, 5, `${example.pkg.slug} needs the five-step process map`);
      assert.ok(example.tutorial.length >= 5, `${example.pkg.slug} needs a step-by-step tutorial`);

      for (const deliverable of example.visibleDeliverables) {
        assert.ok(deliverable.plainUse.length > 35, `${example.pkg.slug}/${deliverable.id} needs a plain use note`);
        assert.equal(
          deliverable.clientLandingPath,
          `/client-examples/${example.pkg.slug}/deliverables/${deliverable.id}`,
          `${example.pkg.slug}/${deliverable.id} needs a client landing page path`,
        );
      }
    }
  });

  it("creates a client-facing landing page model for every package deliverable", () => {
    const expectedCount = provisionablePackages.reduce((total, pkg) => total + pkg.deliverables.length, 0);
    const deliverableExamples = getAllPackageDeliverableClientExamples();

    assert.equal(deliverableExamples.length, expectedCount);

    for (const pkg of provisionablePackages) {
      for (const deliverable of pkg.deliverables) {
        const example = getPackageDeliverableClientExample(pkg.slug, deliverable.id);
        assert.ok(example, `${pkg.slug}/${deliverable.id} is missing a client-facing deliverable page`);
        assert.ok(example.headline.includes(deliverable.title), `${pkg.slug}/${deliverable.id} headline should name the deliverable`);
        assert.ok(example.plainResult.length > 50, `${pkg.slug}/${deliverable.id} needs a plain result`);
        assert.equal(
          example.automatedProcessFlow.length,
          5,
          `${pkg.slug}/${deliverable.id} needs a five-step automated process flowchart`,
        );
        assert.equal(
          example.solutionDeliveryFlow.length,
          5,
          `${pkg.slug}/${deliverable.id} needs a five-step solution delivery flowchart`,
        );
        assert.ok(
          example.automatedProcessFlow.every((step) => step.title.length > 3 && step.description.length > 35),
          `${pkg.slug}/${deliverable.id} needs clear automated process flow steps`,
        );
        assert.ok(
          example.solutionDeliveryFlow.every((step) => step.title.length > 3 && step.description.length > 35),
          `${pkg.slug}/${deliverable.id} needs clear solution delivery flow steps`,
        );
        assert.equal(example.processMap.length, 5, `${pkg.slug}/${deliverable.id} needs a five-step process map`);
        assert.ok(example.tutorial.length >= 5, `${pkg.slug}/${deliverable.id} needs a tutorial`);
        assert.ok(example.acceptanceChecks.length >= 5, `${pkg.slug}/${deliverable.id} needs acceptance checks`);
      }
    }
  });
});
