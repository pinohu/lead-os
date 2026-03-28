import test from "node:test";
import assert from "node:assert/strict";
import {
  startOnboarding,
  getOnboardingState,
  advanceOnboarding,
  completeOnboarding,
  resetOnboardingStore,
} from "../src/lib/onboarding.ts";


function resetStores() {
  resetOnboardingStore();
}

test("startOnboarding creates state with email", async () => {
  resetStores();

  const state = await startOnboarding("user@example.com");

  assert.ok(state.id.startsWith("onb_"));
  assert.equal(state.email, "user@example.com");
  assert.equal(state.currentStep, "niche");
  assert.deepEqual(state.completedSteps, []);
  assert.ok(state.createdAt);
  assert.ok(state.updatedAt);
});

test("getOnboardingState returns stored state", async () => {
  resetStores();

  const created = await startOnboarding("lookup@example.com");
  const fetched = await getOnboardingState(created.id);

  assert.ok(fetched);
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.email, "lookup@example.com");
});

test("getOnboardingState returns undefined for unknown id", async () => {
  resetStores();

  const result = await getOnboardingState("onb_nonexistent");
  assert.equal(result, undefined);
});

test("advanceOnboarding validates niche step requires name", async () => {
  resetStores();

  const state = await startOnboarding("niche@example.com");

  await assert.rejects(
    () => advanceOnboarding(state.id, {}),
    (err: Error) => err.message.includes("Niche name is required"),
  );
});

test("advanceOnboarding validates niche name length", async () => {
  resetStores();

  const state = await startOnboarding("niche-short@example.com");

  await assert.rejects(
    () => advanceOnboarding(state.id, { name: "x" }),
    (err: Error) => err.message.includes("2-100 characters"),
  );
});

test("advanceOnboarding validates plan step requires valid planId", async () => {
  resetStores();

  const state = await startOnboarding("plan@example.com");
  await advanceOnboarding(state.id, { name: "Plumbing Services" });

  await assert.rejects(
    () => advanceOnboarding(state.id, { planId: "nonexistent-plan" }),
    (err: Error) => err.message.includes("Unknown plan"),
  );
});

test("advanceOnboarding validates plan step requires planId", async () => {
  resetStores();

  const state = await startOnboarding("plan2@example.com");
  await advanceOnboarding(state.id, { name: "Legal Services" });

  await assert.rejects(
    () => advanceOnboarding(state.id, {}),
    (err: Error) => err.message.includes("planId is required"),
  );
});

test("advanceOnboarding advances through all steps in order", async () => {
  resetStores();

  const state = await startOnboarding("full@example.com");

  const afterNiche = await advanceOnboarding(state.id, { name: "HVAC Services", industry: "service" });
  assert.equal(afterNiche.currentStep, "plan");
  assert.deepEqual(afterNiche.completedSteps, ["niche"]);
  assert.equal(afterNiche.nicheInput?.name, "HVAC Services");
  assert.equal(afterNiche.nicheSlug, "hvac-services");

  const afterPlan = await advanceOnboarding(state.id, { planId: "whitelabel-growth" });
  assert.equal(afterPlan.currentStep, "branding");
  assert.deepEqual(afterPlan.completedSteps, ["niche", "plan"]);
  assert.equal(afterPlan.selectedPlan, "whitelabel-growth");

  const afterBranding = await advanceOnboarding(state.id, {
    name: "CoolAir Pro",
    accent: "#ff5500",
    siteUrl: "https://coolair.com",
  });
  assert.equal(afterBranding.currentStep, "integrations");
  assert.deepEqual(afterBranding.completedSteps, ["niche", "plan", "branding"]);
  assert.equal(afterBranding.branding?.name, "CoolAir Pro");
  assert.equal(afterBranding.branding?.accent, "#ff5500");

  const afterIntegrations = await advanceOnboarding(state.id, {
    enabledProviders: ["email", "sms", "whatsapp"],
  });
  assert.equal(afterIntegrations.currentStep, "review");
  assert.deepEqual(afterIntegrations.completedSteps, ["niche", "plan", "branding", "integrations"]);
  assert.deepEqual(afterIntegrations.enabledProviders, ["email", "sms", "whatsapp"]);

  const afterReview = await advanceOnboarding(state.id, {});
  assert.equal(afterReview.currentStep, "complete");
  assert.ok(afterReview.completedSteps.includes("review"));
});

test("completeOnboarding returns provisioning result", async () => {
  resetStores();

  const state = await startOnboarding("complete@example.com");
  await advanceOnboarding(state.id, { name: "Dental Leads" });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });
  await advanceOnboarding(state.id, { name: "Bright Smile Leads", accent: "#14b8a6" });
  await advanceOnboarding(state.id, { enabledProviders: ["email"] });
  await advanceOnboarding(state.id, {});

  const completed = await completeOnboarding(state.id);

  assert.equal(completed.currentStep, "complete");
  assert.ok(completed.provisioningResult);
  assert.ok(completed.provisioningResult.tenantId);
  assert.ok(completed.provisioningResult.embedScript.includes("embed.js"));
  assert.ok(completed.provisioningResult.embedScript.includes(completed.provisioningResult.tenantId));
  assert.ok(completed.provisioningResult.dashboardUrl.includes("dashboard"));
  assert.ok(completed.tenantId);
});

test("cannot skip steps - must complete in order", async () => {
  resetStores();

  const state = await startOnboarding("skip@example.com");

  assert.equal(state.currentStep, "niche");

  await assert.rejects(
    () => completeOnboarding(state.id),
    (err: Error) => err.message.includes("must be completed"),
  );
});

test("cannot advance past complete", async () => {
  resetStores();

  const state = await startOnboarding("done@example.com");
  await advanceOnboarding(state.id, { name: "Test Niche" });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });
  await advanceOnboarding(state.id, { name: "Test Brand" });
  await advanceOnboarding(state.id, { enabledProviders: ["email"] });
  await advanceOnboarding(state.id, {});

  await completeOnboarding(state.id);

  await assert.rejects(
    () => advanceOnboarding(state.id, {}),
    (err: Error) => err.message.includes("already complete"),
  );
});

test("integrations defaults to email when no providers given", async () => {
  resetStores();

  const state = await startOnboarding("defaults@example.com");
  await advanceOnboarding(state.id, { name: "Default Test" });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });
  await advanceOnboarding(state.id, { name: "Default Brand" });

  const afterIntegrations = await advanceOnboarding(state.id, {});
  assert.deepEqual(afterIntegrations.enabledProviders, ["email"]);
});

test("branding accent defaults to #14b8a6", async () => {
  resetStores();

  const state = await startOnboarding("accent@example.com");
  await advanceOnboarding(state.id, { name: "Accent Test" });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });

  const afterBranding = await advanceOnboarding(state.id, { name: "My Brand" });
  assert.equal(afterBranding.branding?.accent, "#14b8a6");
});
