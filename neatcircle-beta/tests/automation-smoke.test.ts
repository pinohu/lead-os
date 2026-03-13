import test from "node:test";
import assert from "node:assert/strict";
import { automationCatalog } from "../src/lib/automation-catalog.ts";
import { automationSmokeFixtures, listSmokeRoutes } from "../src/lib/automation-smoke.ts";

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
