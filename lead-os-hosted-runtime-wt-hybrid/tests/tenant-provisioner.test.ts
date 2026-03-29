import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getTenant } from "../src/lib/tenant-store.ts";
import {
  provisionTenant,
  getProvisioningStatus,
  reprovisionStep,
  generateEmbedScript,
  resetProvisioningStore,
  type ProvisionTenantInput,
  type ProvisioningResult,
  type ProvisioningStep,
} from "../src/lib/tenant-provisioner.ts";
import { resetHostedRuntimeStore } from "../src/lib/integrations/hosted-runtime-adapter.ts";
import { resetLandingPageStore } from "../src/lib/landing-page-generator.ts";

function makeInput(overrides?: Partial<ProvisionTenantInput>): ProvisionTenantInput {
  return {
    slug: `test-${Date.now()}`,
    brandName: "Test Dental Clinic",
    siteUrl: "https://test-dental.example.com",
    supportEmail: "support@test-dental.com",
    operatorEmail: "operator@test-dental.com",
    niche: "Dental Practice",
    industry: "health",
    revenueModel: "managed",
    plan: "growth",
    ...overrides,
  };
}

function resetAll() {
  resetProvisioningStore();
  resetHostedRuntimeStore();
  resetLandingPageStore();
}

function findStep(result: ProvisioningResult, name: string): ProvisioningStep {
  const step = result.steps.find((s) => s.name === name);
  if (!step) {
    throw new Error(`Step ${name} not found in result`);
  }
  return step;
}

describe("tenant-provisioner", () => {
  beforeEach(() => {
    resetAll();
    delete process.env.RESEND_API_KEY;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.POSTMARK_API_KEY;
    delete process.env.AI_API_KEY;
    delete process.env.AI_PROVIDER;
  });

  describe("provisionTenant", () => {
    it("creates a tenant record", async () => {
      const input = makeInput({ slug: "provision-create-test" });
      const result = await provisionTenant(input);

      assert.ok(result.tenantId, "tenantId should be set");
      assert.equal(result.slug, "provision-create-test");

      const tenant = await getTenant(result.tenantId);
      assert.ok(tenant, "tenant should exist in store");
      assert.equal(tenant.slug, "provision-create-test");
      assert.equal(tenant.brandName, "Test Dental Clinic");
    });

    it("produces exactly 13 provisioning steps", async () => {
      const input = makeInput({ slug: "step-count-test" });
      const result = await provisionTenant(input);

      assert.equal(result.steps.length, 13, "should have 13 total steps");

      const expectedNames = [
        "create-tenant",
        "generate-niche",
        "register-niche",
        "configure-funnels",
        "setup-creative-jobs",
        "provision-workflows",
        "configure-crm",
        "generate-embed",
        "provision-subdomain",
        "deploy-landing-page",
        "send-welcome-email",
        "create-operator",
        "send-welcome",
      ];
      const actualNames = result.steps.map((s) => s.name);
      assert.deepEqual(actualNames, expectedNames, "step names and order should match");
    });

    it("completes all critical steps including provision-subdomain", async () => {
      const input = makeInput({ slug: "critical-steps-test" });
      const result = await provisionTenant(input);

      const criticalSteps = [
        "create-tenant",
        "generate-niche",
        "register-niche",
        "generate-embed",
        "provision-subdomain",
        "create-operator",
      ];
      for (const stepName of criticalSteps) {
        const step = findStep(result, stepName);
        assert.equal(step.status, "completed", `critical step ${stepName} should be completed`);
        assert.ok(step.startedAt, `step ${stepName} should have startedAt`);
        assert.ok(step.completedAt, `step ${stepName} should have completedAt`);
      }

      assert.equal(result.success, true, "provisioning should succeed");
    });

    it("stores siteUrl and siteId from subdomain provisioning", async () => {
      const input = makeInput({ slug: "subdomain-result-test" });
      const result = await provisionTenant(input);

      assert.ok(result.siteId, "siteId should be set on result");
      assert.ok(result.siteUrl, "siteUrl should be set on result");
      assert.ok(result.siteUrl.includes("subdomain-result-test"), "siteUrl should contain the slug");

      const tenant = await getTenant(result.tenantId);
      assert.ok(tenant);
      assert.ok(tenant.metadata.siteId, "siteId should be stored in tenant metadata");
      assert.ok(tenant.metadata.siteFullUrl, "siteFullUrl should be stored in tenant metadata");
    });

    it("stores subdomain detail with fullUrl", async () => {
      const input = makeInput({ slug: "subdomain-detail-test" });
      const result = await provisionTenant(input);

      const step = findStep(result, "provision-subdomain");
      assert.equal(step.status, "completed");
      assert.ok(step.detail, "provision-subdomain step should have detail");
      assert.ok(
        step.detail.startsWith("Subdomain provisioned at "),
        "detail should mention the full URL",
      );
    });

    it("skips deploy-landing-page when no landing page exists", async () => {
      const input = makeInput({ slug: "no-lp-test" });
      const result = await provisionTenant(input);

      const step = findStep(result, "deploy-landing-page");
      assert.equal(step.status, "skipped", "deploy-landing-page should be skipped without a landing page");
      assert.ok(step.detail, "skipped step should have a detail/reason");
    });

    it("skips send-welcome-email when email provider is not configured", async () => {
      const input = makeInput({ slug: "no-email-test" });
      const result = await provisionTenant(input);

      const step = findStep(result, "send-welcome-email");
      assert.equal(step.status, "skipped", "send-welcome-email should be skipped");
      assert.equal(step.detail, "Email provider not configured");
    });

    it("generates welcome email with template when AI is not available", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      const input = makeInput({ slug: "template-email-test" });
      const result = await provisionTenant(input);

      const step = findStep(result, "send-welcome-email");
      assert.equal(step.status, "completed", "send-welcome-email should complete");
      assert.ok(step.detail, "step should have detail");
      assert.ok(
        step.detail.includes("operator@test-dental.com"),
        "detail should include operator email",
      );
      assert.ok(
        step.detail.includes("send via provider integration"),
        "detail should indicate provider integration",
      );

      const tenant = await getTenant(result.tenantId);
      assert.ok(tenant);
      const emailBody = tenant.metadata.welcomeEmailBody as string;
      assert.ok(emailBody, "welcomeEmailBody should be stored in metadata");
      assert.ok(emailBody.includes("Test Dental Clinic"), "template should include brand name");
      assert.ok(emailBody.includes("template-email-test"), "template should include slug");
      assert.ok(emailBody.includes("/dashboard"), "template should include dashboard URL");
    });

    it("activates tenant when all critical steps pass", async () => {
      const input = makeInput({ slug: "activate-test" });
      const result = await provisionTenant(input);

      assert.equal(result.success, true);

      const tenant = await getTenant(result.tenantId);
      assert.ok(tenant);
      assert.equal(tenant.status, "active", "tenant should be activated");
    });

    it("still succeeds when optional steps are skipped", async () => {
      const input = makeInput({ slug: "optional-skip-test" });
      const result = await provisionTenant(input);

      const optionalSteps = ["provision-workflows", "configure-crm", "deploy-landing-page", "send-welcome-email", "send-welcome"];
      for (const stepName of optionalSteps) {
        const step = findStep(result, stepName);
        assert.ok(
          step.status === "skipped" || step.status === "completed",
          `optional step ${stepName} should be skipped or completed`,
        );
      }

      assert.equal(result.success, true, "provisioning should succeed despite skipped optional steps");
    });
  });

  describe("step count via getProvisioningStatus", () => {
    it("returns 13 steps after provisioning", async () => {
      const input = makeInput({ slug: "status-count-test" });
      const result = await provisionTenant(input);
      const steps = await getProvisioningStatus(result.tenantId);

      assert.equal(steps.length, 13, "should have all 13 steps");

      const newStepNames = ["provision-subdomain", "deploy-landing-page", "send-welcome-email"];
      for (const name of newStepNames) {
        assert.ok(
          steps.some((s) => s.name === name),
          `should include new step: ${name}`,
        );
      }
    });
  });

  describe("reprovisionStep for new steps", () => {
    it("reprovisions provision-subdomain", async () => {
      const input = makeInput({ slug: "reprovision-subdomain-test" });
      const result = await provisionTenant(input);

      const retriedStep = await reprovisionStep(result.tenantId, "provision-subdomain");

      assert.equal(retriedStep.name, "provision-subdomain");
      assert.equal(retriedStep.status, "completed");
      assert.ok(retriedStep.detail, "retried step should have detail");
      assert.ok(
        retriedStep.detail.includes("provisioned"),
        "detail should indicate provisioning status",
      );
    });

    it("reprovisions deploy-landing-page (skips when no landing page)", async () => {
      const input = makeInput({ slug: "reprovision-lp-test" });
      const result = await provisionTenant(input);

      const retriedStep = await reprovisionStep(result.tenantId, "deploy-landing-page");

      assert.equal(retriedStep.name, "deploy-landing-page");
      assert.equal(retriedStep.status, "failed", "should fail when no landing page exists");
      assert.ok(retriedStep.detail, "failed step should have detail");
    });

    it("reprovisions send-welcome-email with template fallback", async () => {
      const input = makeInput({ slug: "reprovision-email-test" });
      const result = await provisionTenant(input);

      const retriedStep = await reprovisionStep(result.tenantId, "send-welcome-email");

      assert.equal(retriedStep.name, "send-welcome-email");
      assert.equal(retriedStep.status, "completed");
      assert.ok(retriedStep.detail, "retried step should have detail");

      const tenant = await getTenant(result.tenantId);
      assert.ok(tenant);
      const emailBody = tenant.metadata.welcomeEmailBody as string;
      assert.ok(emailBody, "should store welcome email body");
      assert.ok(emailBody.includes("Test Dental Clinic"), "template should include brand name");
    });

    it("reprovisions create-operator", async () => {
      const input = makeInput({ slug: "reprovision-operator-test" });
      const result = await provisionTenant(input);

      const retriedStep = await reprovisionStep(result.tenantId, "create-operator");

      assert.equal(retriedStep.name, "create-operator");
      assert.equal(retriedStep.status, "completed");
    });

    it("reprovisions send-welcome", async () => {
      const input = makeInput({ slug: "reprovision-welcome-test" });
      const result = await provisionTenant(input);

      const retriedStep = await reprovisionStep(result.tenantId, "send-welcome");

      assert.equal(retriedStep.name, "send-welcome");
      assert.equal(retriedStep.status, "completed");
      assert.ok(
        retriedStep.detail?.includes("re-queued"),
        "detail should indicate re-queuing",
      );
    });
  });

  describe("generateEmbedScript", () => {
    it("produces valid HTML script tag", () => {
      const tenantId = "abc-123-def";
      const siteUrl = "https://example.com";
      const script = generateEmbedScript(tenantId, siteUrl);

      assert.ok(script.startsWith("<script"), "should start with script tag");
      assert.ok(script.endsWith("</script>"), "should end with closing script tag");
      assert.ok(script.includes(`data-tenant="${tenantId}"`), "should contain tenant ID");
      assert.ok(script.includes("async"), "should have async attribute");
    });

    it("strips trailing slashes from siteUrl", () => {
      const script = generateEmbedScript("tid-1", "https://example.com///");

      assert.ok(script.includes(`src="https://example.com/embed/lead-os-embed.js"`));
      assert.ok(!script.includes("///"));
    });
  });

  describe("ProvisioningResult interface", () => {
    it("includes siteUrl and siteId fields", async () => {
      const input = makeInput({ slug: "interface-test" });
      const result = await provisionTenant(input);

      assert.ok("siteUrl" in result, "result should have siteUrl property");
      assert.ok("siteId" in result, "result should have siteId property");
    });
  });
});
