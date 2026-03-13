import test from "node:test";
import assert from "node:assert/strict";
import {
  automationCatalog,
  lifecycleAutomations,
  scenarioScripts,
  serviceAutomations,
  systemAutomations,
  intelligenceAutomations,
} from "../src/lib/automation-catalog.ts";

test("automation catalog exposes service, lifecycle, intelligence, and system coverage", () => {
  assert.equal(serviceAutomations.length, 16);
  assert.ok(lifecycleAutomations.some((route) => route.slug === "convert"));
  assert.ok(lifecycleAutomations.some((route) => route.slug === "intake"));
  assert.ok(intelligenceAutomations.some((route) => route.slug === "intelligence-analyze"));
  assert.ok(systemAutomations.some((route) => route.slug === "health"));
});

test("automation slugs and routes are unique", () => {
  const slugs = new Set<string>();
  const routes = new Set<string>();

  for (const automation of automationCatalog) {
    assert.equal(slugs.has(automation.slug), false, `Duplicate slug: ${automation.slug}`);
    assert.equal(routes.has(automation.route), false, `Duplicate route: ${automation.route}`);
    slugs.add(automation.slug);
    routes.add(automation.route);
  }
});

test("all automations document dependencies and descriptions", () => {
  for (const automation of automationCatalog) {
    assert.ok(automation.description.length > 10);
    assert.ok(Array.isArray(automation.dependencies));
  }
});

test("scenario scripts cover the deployed Make companions", () => {
  assert.ok(scenarioScripts.length >= 6);
  assert.ok(scenarioScripts.some((script) => script.file.endsWith("deploy-advanced-scenarios.mjs")));
  assert.ok(scenarioScripts.some((script) => script.file.endsWith("deploy-event-scenarios.mjs")));
  assert.ok(scenarioScripts.some((script) => script.file.endsWith("deploy-referral-engine.mjs")));
});
