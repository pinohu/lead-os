import test from "node:test";
import assert from "node:assert/strict";
import { automationCatalog } from "../src/lib/automation-catalog.ts";
import {
  automationSmokeFixtures,
  listSmokeRoutes,
  runAutomationSmoke,
} from "../src/lib/automation-smoke.ts";

test("automation smoke fixtures cover every service automation route", () => {
  const serviceRoutes = automationCatalog
    .filter((automation) => automation.category === "core" || automation.category === "blue-ocean")
    .map((automation) => automation.route)
    .sort();

  const fixtureRoutes = automationSmokeFixtures.map((fixture) => fixture.route).sort();

  assert.deepEqual(fixtureRoutes, serviceRoutes);
});

test("smoke coverage report marks service routes as covered", () => {
  const serviceRoutes = new Set(
    automationCatalog
      .filter((automation) => automation.category === "core" || automation.category === "blue-ocean")
      .map((automation) => automation.route),
  );

  const coverage = listSmokeRoutes();
  const uncoveredServices = coverage.filter(
    (entry) => serviceRoutes.has(entry.route) && !entry.covered,
  );

  assert.deepEqual(uncoveredServices, []);
});

test("automation smoke calls use bearer auth and no forgeable internal smoke header", async (t) => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const result = await runAutomationSmoke("https://ops.example", "smoke-secret");

  assert.equal(result.success, true);
  assert.equal(calls.length, automationSmokeFixtures.length);

  for (const call of calls) {
    const headers = new Headers(call.init?.headers);
    assert.equal(headers.get("authorization"), "Bearer smoke-secret");
    assert.equal(headers.get("x-lead-os-dry-run"), "1");
    assert.equal(headers.has("x-lead-os-internal-smoke"), false);
  }
});

test("automation smoke refuses to run without a configured automation secret", async () => {
  await assert.rejects(
    () => runAutomationSmoke("https://ops.example", ""),
    /AUTOMATION_API_SECRET must be configured/,
  );
});
