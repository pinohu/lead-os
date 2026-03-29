import test from "node:test";
import assert from "node:assert/strict";
import {
  startOnboarding,
  getOnboardingState,
  advanceOnboarding,
  completeOnboarding,
  goBackOnboarding,
  getOnboardingByEmail,
  listOnboardingSessions,
  resetOnboardingStore,
  type OnboardingState,
} from "../src/lib/onboarding.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fullOnboarding(email: string): Promise<OnboardingState> {
  const state = await startOnboarding(email);
  await advanceOnboarding(state.id, { name: "Test Niche", industry: "service" });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });
  await advanceOnboarding(state.id, { name: "Test Brand", accent: "#14b8a6" });
  await advanceOnboarding(state.id, { enabledProviders: ["email"] });
  await advanceOnboarding(state.id, {});
  return completeOnboarding(state.id);
}

test.beforeEach(() => {
  resetOnboardingStore();
});

// ---------------------------------------------------------------------------
// startOnboarding
// ---------------------------------------------------------------------------

test("startOnboarding creates state with normalized email", async () => {
  const state = await startOnboarding("User@Example.COM");

  assert.ok(state.id.startsWith("onb_"));
  assert.equal(state.email, "user@example.com");
  assert.equal(state.currentStep, "niche");
  assert.deepEqual(state.completedSteps, []);
  assert.ok(state.createdAt);
  assert.ok(state.updatedAt);
});

test("startOnboarding throws on empty email", async () => {
  await assert.rejects(
    () => startOnboarding(""),
    (err: Error) => err.message.includes("email is required"),
  );
});

test("startOnboarding throws on whitespace-only email", async () => {
  await assert.rejects(
    () => startOnboarding("   "),
    (err: Error) => err.message.includes("email is required"),
  );
});

test("startOnboarding returns existing active session for same email (idempotency)", async () => {
  const first = await startOnboarding("dup@example.com");
  const second = await startOnboarding("dup@example.com");

  assert.equal(first.id, second.id);
});

test("startOnboarding creates new session if previous is complete", async () => {
  const completed = await fullOnboarding("recycled@example.com");
  assert.equal(completed.currentStep, "complete");

  // Clear memory to simulate restart (completed session won't match getOnboardingByEmail)
  resetOnboardingStore();

  const fresh = await startOnboarding("recycled@example.com");
  assert.notEqual(fresh.id, completed.id);
  assert.equal(fresh.currentStep, "niche");
});

// ---------------------------------------------------------------------------
// getOnboardingState
// ---------------------------------------------------------------------------

test("getOnboardingState returns stored state by id", async () => {
  const created = await startOnboarding("lookup@example.com");
  const fetched = await getOnboardingState(created.id);

  assert.ok(fetched);
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.email, "lookup@example.com");
});

test("getOnboardingState returns undefined for unknown id", async () => {
  const result = await getOnboardingState("onb_00000000-0000-0000-0000-000000000000");
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// getOnboardingByEmail — session recovery
// ---------------------------------------------------------------------------

test("getOnboardingByEmail returns active session for known email", async () => {
  const created = await startOnboarding("recover@example.com");
  await advanceOnboarding(created.id, { name: "Some Niche" });

  const recovered = await getOnboardingByEmail("recover@example.com");

  assert.ok(recovered);
  assert.equal(recovered.id, created.id);
  assert.equal(recovered.currentStep, "plan");
});

test("getOnboardingByEmail is case-insensitive", async () => {
  await startOnboarding("CASE@EXAMPLE.COM");
  const recovered = await getOnboardingByEmail("case@example.com");

  assert.ok(recovered);
  assert.equal(recovered.email, "case@example.com");
});

test("getOnboardingByEmail returns undefined for unknown email", async () => {
  const result = await getOnboardingByEmail("nobody@example.com");
  assert.equal(result, undefined);
});

test("getOnboardingByEmail returns undefined for completed session", async () => {
  await fullOnboarding("done@example.com");
  const result = await getOnboardingByEmail("done@example.com");
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// advanceOnboarding
// ---------------------------------------------------------------------------

test("advanceOnboarding advances through all steps in order", async () => {
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

test("advanceOnboarding validates niche step requires name", async () => {
  const state = await startOnboarding("niche@example.com");

  await assert.rejects(
    () => advanceOnboarding(state.id, {}),
    (err: Error) => err.message.includes("Niche name is required"),
  );
});

test("advanceOnboarding validates niche name too short", async () => {
  const state = await startOnboarding("niche-short@example.com");

  await assert.rejects(
    () => advanceOnboarding(state.id, { name: "x" }),
    (err: Error) => err.message.includes("2-100 characters"),
  );
});

test("advanceOnboarding validates niche name too long", async () => {
  const state = await startOnboarding("niche-long@example.com");

  await assert.rejects(
    () => advanceOnboarding(state.id, { name: "x".repeat(101) }),
    (err: Error) => err.message.includes("2-100 characters"),
  );
});

test("advanceOnboarding validates plan step requires planId", async () => {
  const state = await startOnboarding("plan@example.com");
  await advanceOnboarding(state.id, { name: "Legal Services" });

  await assert.rejects(
    () => advanceOnboarding(state.id, {}),
    (err: Error) => err.message.includes("planId is required"),
  );
});

test("advanceOnboarding validates plan step rejects unknown planId", async () => {
  const state = await startOnboarding("plan2@example.com");
  await advanceOnboarding(state.id, { name: "Plumbing Services" });

  await assert.rejects(
    () => advanceOnboarding(state.id, { planId: "nonexistent-plan" }),
    (err: Error) => err.message.includes("Unknown plan"),
  );
});

test("advanceOnboarding validates branding step requires brand name", async () => {
  const state = await startOnboarding("brand@example.com");
  await advanceOnboarding(state.id, { name: "Test Niche" });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });

  await assert.rejects(
    () => advanceOnboarding(state.id, { accent: "#ff0000" }),
    (err: Error) => err.message.includes("Brand name is required"),
  );
});

test("advanceOnboarding defaults branding accent to #14b8a6", async () => {
  const state = await startOnboarding("accent@example.com");
  await advanceOnboarding(state.id, { name: "Accent Test" });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });

  const afterBranding = await advanceOnboarding(state.id, { name: "My Brand" });
  assert.equal(afterBranding.branding?.accent, "#14b8a6");
});

test("advanceOnboarding integrations defaults to email when no providers given", async () => {
  const state = await startOnboarding("defaults@example.com");
  await advanceOnboarding(state.id, { name: "Default Test" });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });
  await advanceOnboarding(state.id, { name: "Default Brand" });

  const afterIntegrations = await advanceOnboarding(state.id, {});
  assert.deepEqual(afterIntegrations.enabledProviders, ["email"]);
});

test("cannot advance past complete", async () => {
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

test("advanceOnboarding throws on unknown session id", async () => {
  await assert.rejects(
    () => advanceOnboarding("onb_00000000-0000-0000-0000-000000000000", { name: "Test" }),
    (err: Error) => err.message.includes("not found"),
  );
});

// ---------------------------------------------------------------------------
// goBackOnboarding
// ---------------------------------------------------------------------------

test("goBackOnboarding moves from plan back to niche", async () => {
  const state = await startOnboarding("back@example.com");
  await advanceOnboarding(state.id, { name: "Back Test Niche" });
  assert.equal((await getOnboardingState(state.id))!.currentStep, "plan");

  const reverted = await goBackOnboarding(state.id);
  assert.equal(reverted.currentStep, "niche");
  assert.ok(!reverted.completedSteps.includes("niche"));
});

test("goBackOnboarding removes the last completed step entry", async () => {
  const state = await startOnboarding("backremove@example.com");
  await advanceOnboarding(state.id, { name: "Niche" });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });

  const reverted = await goBackOnboarding(state.id);
  assert.equal(reverted.currentStep, "plan");
  assert.deepEqual(reverted.completedSteps, ["niche"]);
});

test("goBackOnboarding cannot go back from the first step (niche)", async () => {
  const state = await startOnboarding("firstback@example.com");
  assert.equal(state.currentStep, "niche");

  await assert.rejects(
    () => goBackOnboarding(state.id),
    (err: Error) => err.message.includes("first step"),
  );
});

test("goBackOnboarding cannot go back from a completed session", async () => {
  const completed = await fullOnboarding("complback@example.com");
  assert.equal(completed.currentStep, "complete");

  await assert.rejects(
    () => goBackOnboarding(completed.id),
    (err: Error) => err.message.includes("completed"),
  );
});

test("goBackOnboarding throws on unknown session id", async () => {
  await assert.rejects(
    () => goBackOnboarding("onb_00000000-0000-0000-0000-000000000000"),
    (err: Error) => err.message.includes("not found"),
  );
});

// ---------------------------------------------------------------------------
// completeOnboarding
// ---------------------------------------------------------------------------

test("completeOnboarding returns provisioning result", async () => {
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

test("completeOnboarding cannot skip steps", async () => {
  const state = await startOnboarding("skip@example.com");
  assert.equal(state.currentStep, "niche");

  await assert.rejects(
    () => completeOnboarding(state.id),
    (err: Error) => err.message.includes("must be completed"),
  );
});

// ---------------------------------------------------------------------------
// listOnboardingSessions
// ---------------------------------------------------------------------------

test("listOnboardingSessions returns all sessions in memory", async () => {
  await startOnboarding("list1@example.com");
  await startOnboarding("list2@example.com");
  await startOnboarding("list3@example.com");

  const sessions = await listOnboardingSessions();
  assert.ok(sessions.length >= 3);
});

test("listOnboardingSessions filters by status active", async () => {
  await startOnboarding("active1@example.com");
  await fullOnboarding("done1@example.com");

  const active = await listOnboardingSessions({ status: "active" });
  for (const s of active) {
    assert.notEqual(s.currentStep, "complete");
  }
});

test("listOnboardingSessions filters by status complete", async () => {
  await startOnboarding("active2@example.com");
  await fullOnboarding("done2@example.com");

  const complete = await listOnboardingSessions({ status: "complete" });
  for (const s of complete) {
    assert.equal(s.currentStep, "complete");
  }
  assert.ok(complete.length >= 1);
});

test("listOnboardingSessions filters by email", async () => {
  await startOnboarding("emailfilter@example.com");
  await startOnboarding("other@example.com");

  const results = await listOnboardingSessions({ email: "emailfilter@example.com" });
  assert.equal(results.length, 1);
  assert.equal(results[0].email, "emailfilter@example.com");
});

test("listOnboardingSessions respects limit and offset", async () => {
  for (let i = 0; i < 5; i++) {
    await startOnboarding(`page${i}@example.com`);
  }

  const page1 = await listOnboardingSessions({ limit: 2, offset: 0 });
  const page2 = await listOnboardingSessions({ limit: 2, offset: 2 });

  assert.equal(page1.length, 2);
  assert.equal(page2.length, 2);
  assert.notEqual(page1[0].id, page2[0].id);
});

// ---------------------------------------------------------------------------
// Full end-to-end flow
// ---------------------------------------------------------------------------

test("full flow: start, advance all steps, complete", async () => {
  const state = await startOnboarding("e2e@example.com");
  assert.equal(state.currentStep, "niche");

  await advanceOnboarding(state.id, { name: "Roofing Leads", industry: "construction", keywords: ["roof", "repair"] });
  await advanceOnboarding(state.id, { planId: "whitelabel-starter" });
  await advanceOnboarding(state.id, { name: "Roof Pro", accent: "#cc4400", siteUrl: "https://roofpro.com", supportEmail: "support@roofpro.com" });
  await advanceOnboarding(state.id, { enabledProviders: ["email", "sms"] });
  await advanceOnboarding(state.id, {});

  const final = await completeOnboarding(state.id);

  assert.equal(final.currentStep, "complete");
  assert.equal(final.nicheInput?.name, "Roofing Leads");
  assert.equal(final.nicheSlug, "roofing-leads");
  assert.equal(final.selectedPlan, "whitelabel-starter");
  assert.equal(final.branding?.name, "Roof Pro");
  assert.deepEqual(final.enabledProviders, ["email", "sms"]);
  assert.ok(final.provisioningResult?.tenantId);
  assert.ok(final.completedSteps.includes("complete"));
});

test("go back and re-advance with different data", async () => {
  const state = await startOnboarding("redo@example.com");
  await advanceOnboarding(state.id, { name: "Original Niche" });
  assert.equal((await getOnboardingState(state.id))!.currentStep, "plan");

  // Go back to niche
  await goBackOnboarding(state.id);
  const atNiche = await getOnboardingState(state.id);
  assert.equal(atNiche!.currentStep, "niche");

  // Re-advance with different data
  await advanceOnboarding(state.id, { name: "Updated Niche" });
  const atPlan = await getOnboardingState(state.id);
  assert.equal(atPlan!.nicheInput?.name, "Updated Niche");
  assert.equal(atPlan!.nicheSlug, "updated-niche");
});
