import test from "node:test";
import assert from "node:assert/strict";
import { getTenant } from "../src/lib/tenant-store.ts";
import {
  provisionTenant,
  getProvisioningStatus,
  reprovisionStep,
  generateEmbedScript,
  resetProvisioningStore,
  type ProvisionTenantInput,
} from "../src/lib/tenant-provisioner.ts";

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
}

test("provisionTenant creates a tenant record", async () => {
  resetAll();

  const input = makeInput({ slug: "provision-create-test" });
  const result = await provisionTenant(input);

  assert.ok(result.tenantId, "tenantId should be set");
  assert.equal(result.slug, "provision-create-test");

  const tenant = await getTenant(result.tenantId);
  assert.ok(tenant, "tenant should exist in store");
  assert.equal(tenant.slug, "provision-create-test");
  assert.equal(tenant.brandName, "Test Dental Clinic");
});

test("provisionTenant generates niche config", async () => {
  resetAll();

  const input = makeInput({ slug: "provision-niche-test" });
  const result = await provisionTenant(input);

  assert.ok(result.nicheConfig, "nicheConfig should be present");
  assert.equal(result.nicheConfig.name, "Dental Practice");
  assert.equal(result.nicheConfig.industry, "health");
  assert.ok(result.nicheConfig.painPoints.length > 0, "should have pain points");
  assert.ok(result.nicheConfig.assessmentQuestions.length > 0, "should have assessment questions");
});

test("provisionTenant generates embed script with correct tenant ID", async () => {
  resetAll();

  const input = makeInput({ slug: "provision-embed-test", siteUrl: "https://my-site.com" });
  const result = await provisionTenant(input);

  assert.ok(result.embedScript, "embedScript should be present");
  assert.ok(result.embedScript.includes(result.tenantId), "embed script should contain tenant ID");
  assert.ok(result.embedScript.includes("https://my-site.com/embed/lead-os-embed.js"), "embed script should reference embed JS");
  assert.ok(result.embedScript.includes(`data-boot="https://my-site.com/api/widgets/boot?tenant=${result.tenantId}"`), "embed script should contain boot URL");
  assert.ok(result.embedScript.startsWith("<script"), "embed script should be a script tag");
  assert.ok(result.embedScript.includes("async"), "embed script should be async");
});

test("provisionTenant marks all critical steps as completed", async () => {
  resetAll();

  const input = makeInput({ slug: "provision-steps-test" });
  const result = await provisionTenant(input);

  const criticalSteps = ["create-tenant", "generate-niche", "register-niche", "configure-funnels", "generate-embed", "create-operator"];
  for (const stepName of criticalSteps) {
    const step = result.steps.find((s) => s.name === stepName);
    assert.ok(step, `step ${stepName} should exist`);
    assert.equal(step.status, "completed", `step ${stepName} should be completed`);
    assert.ok(step.startedAt, `step ${stepName} should have startedAt`);
    assert.ok(step.completedAt, `step ${stepName} should have completedAt`);
  }

  assert.equal(result.success, true, "provisioning should succeed");
});

test("provisionTenant skips optional steps when services are not configured", async () => {
  resetAll();

  const input = makeInput({ slug: "provision-skip-test" });
  const result = await provisionTenant(input);

  const workflowStep = result.steps.find((s) => s.name === "provision-workflows");
  assert.ok(workflowStep, "provision-workflows step should exist");
  assert.ok(
    workflowStep.status === "skipped" || workflowStep.status === "completed",
    "provision-workflows should be skipped or completed",
  );

  const crmStep = result.steps.find((s) => s.name === "configure-crm");
  assert.ok(crmStep, "configure-crm step should exist");
  assert.ok(
    crmStep.status === "skipped" || crmStep.status === "completed",
    "configure-crm should be skipped or completed",
  );

  const welcomeStep = result.steps.find((s) => s.name === "send-welcome");
  assert.ok(welcomeStep, "send-welcome step should exist");
  assert.ok(
    welcomeStep.status === "skipped" || welcomeStep.status === "completed",
    "send-welcome should be skipped or completed",
  );
});

test("provisionTenant handles niche generation for various industries", async () => {
  resetAll();

  const industries = [
    { niche: "Personal Injury Attorney", industry: "legal" },
    { niche: "HVAC Contractor", industry: "construction" },
    { niche: "SaaS Platform", industry: "tech" },
    { niche: "Commercial Real Estate", industry: "real-estate" },
  ];

  for (const { niche, industry } of industries) {
    resetAll();
    const input = makeInput({
      slug: `industry-${industry}-test`,
      niche,
      industry,
    });
    const result = await provisionTenant(input);

    assert.ok(result.success, `provisioning for ${industry} should succeed`);
    assert.equal(result.nicheConfig.industry, industry, `industry should be ${industry}`);
    assert.equal(result.nicheConfig.name, niche, `niche name should be ${niche}`);
  }
});

test("generateEmbedScript produces valid HTML script tag", () => {
  const tenantId = "abc-123-def";
  const siteUrl = "https://example.com";
  const script = generateEmbedScript(tenantId, siteUrl);

  assert.ok(script.startsWith("<script"), "should start with script tag");
  assert.ok(script.endsWith("</script>"), "should end with closing script tag");
  assert.ok(script.includes(`data-tenant="${tenantId}"`), "should contain tenant ID");
  assert.ok(script.includes(`src="https://example.com/embed/lead-os-embed.js"`), "should contain embed script URL");
  assert.ok(script.includes(`data-boot="https://example.com/api/widgets/boot?tenant=abc-123-def"`), "should contain boot URL");
  assert.ok(script.includes("async"), "should have async attribute");
});

test("generateEmbedScript strips trailing slashes from siteUrl", () => {
  const script = generateEmbedScript("tid-1", "https://example.com///");

  assert.ok(script.includes(`src="https://example.com/embed/lead-os-embed.js"`), "should normalize URL");
  assert.ok(!script.includes("///"), "should not contain triple slashes");
});

test("getProvisioningStatus returns step details after provisioning", async () => {
  resetAll();

  const input = makeInput({ slug: "status-test" });
  const result = await provisionTenant(input);
  const steps = await getProvisioningStatus(result.tenantId);

  assert.ok(steps.length > 0, "should have steps");
  assert.equal(steps.length, 10, "should have all 10 steps");

  const stepNames = steps.map((s) => s.name);
  assert.ok(stepNames.includes("create-tenant"), "should include create-tenant");
  assert.ok(stepNames.includes("generate-niche"), "should include generate-niche");
  assert.ok(stepNames.includes("generate-embed"), "should include generate-embed");
});

test("getProvisioningStatus returns empty array for unknown tenant", async () => {
  resetAll();

  const steps = await getProvisioningStatus("nonexistent-tenant-id");
  assert.equal(steps.length, 0, "should return empty array");
});

test("reprovisionStep retries a specific step", async () => {
  resetAll();

  const input = makeInput({ slug: "reprovision-test" });
  const result = await provisionTenant(input);

  const retriedStep = await reprovisionStep(result.tenantId, "generate-embed");

  assert.equal(retriedStep.name, "generate-embed");
  assert.equal(retriedStep.status, "completed");
  assert.ok(retriedStep.detail, "retried step should have detail");
  assert.ok(retriedStep.completedAt, "retried step should have completedAt");
});

test("reprovisionStep throws for unknown step name", async () => {
  resetAll();

  const input = makeInput({ slug: "reprovision-unknown-test" });
  const result = await provisionTenant(input);

  await assert.rejects(
    () => reprovisionStep(result.tenantId, "nonexistent-step"),
    { message: "Unknown step: nonexistent-step" },
  );
});

test("reprovisionStep throws for unknown tenant", async () => {
  resetAll();

  await assert.rejects(
    () => reprovisionStep("nonexistent-tenant", "generate-embed"),
    { message: "Tenant not found: nonexistent-tenant" },
  );
});

test("provisionTenant sets correct dashboard and widget boot URLs", async () => {
  resetAll();

  const input = makeInput({ slug: "urls-test", siteUrl: "https://my-app.example.com" });
  const result = await provisionTenant(input);

  assert.equal(result.dashboardUrl, "https://my-app.example.com/dashboard");
  assert.equal(result.widgetBootUrl, `https://my-app.example.com/api/widgets/boot?tenant=${result.tenantId}`);
});

test("provisionTenant stores operator email", async () => {
  resetAll();

  const input = makeInput({
    slug: "operator-test",
    operatorEmail: "admin@clinic.com",
  });
  const result = await provisionTenant(input);

  assert.equal(result.operatorEmail, "admin@clinic.com");

  const tenant = await getTenant(result.tenantId);
  assert.ok(tenant);
  assert.ok(tenant.operatorEmails.includes("admin@clinic.com"), "operator email should be in tenant record");
});

test("provisionTenant activates tenant when all critical steps pass", async () => {
  resetAll();

  const input = makeInput({ slug: "activate-test" });
  const result = await provisionTenant(input);

  assert.equal(result.success, true);

  const tenant = await getTenant(result.tenantId);
  assert.ok(tenant);
  assert.equal(tenant.status, "active", "tenant should be activated after successful provisioning");
});

test("provisionTenant applies custom accent and channels", async () => {
  resetAll();

  const input = makeInput({
    slug: "custom-config-test",
    accent: "#ff6600",
    channels: { email: true, whatsapp: true, sms: false, chat: true, voice: false },
  });
  const result = await provisionTenant(input);

  const tenant = await getTenant(result.tenantId);
  assert.ok(tenant);
  assert.equal(tenant.accent, "#ff6600");
  assert.equal(tenant.channels.whatsapp, true);
  assert.equal(tenant.channels.chat, true);
});
