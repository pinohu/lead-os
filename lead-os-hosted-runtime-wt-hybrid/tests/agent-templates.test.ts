import test from "node:test";
import assert from "node:assert/strict";
import {
  deployProspectingTeam,
  deployContentTeam,
  deployOutreachTeam,
  deployFullStackTeam,
  listAvailableTemplates,
} from "../src/lib/agent-templates.ts";
import { resetPaperclipStores } from "../src/lib/paperclip-orchestrator.ts";

// ---------------------------------------------------------------------------
// Template listing
// ---------------------------------------------------------------------------

test("listAvailableTemplates returns 4 templates", () => {
  const templates = listAvailableTemplates();
  assert.equal(templates.length, 4);

  const ids = templates.map((t) => t.id);
  assert.ok(ids.includes("prospecting-team"));
  assert.ok(ids.includes("content-team"));
  assert.ok(ids.includes("outreach-team"));
  assert.ok(ids.includes("full-stack-team"));
});

test("each template has roles with required fields", () => {
  const templates = listAvailableTemplates();
  for (const template of templates) {
    assert.ok(template.name.length > 0);
    assert.ok(template.description.length > 0);
    assert.ok(template.roles.length > 0);
    assert.ok(template.maxBudgetPerDay > 0);
    assert.ok(template.maxConcurrentTasks > 0);

    for (const role of template.roles) {
      assert.ok(role.name.length > 0);
      assert.ok(role.role.length > 0);
      assert.ok(role.tools.length > 0);
      assert.ok(role.model.length > 0);
      assert.ok(role.systemPrompt.length > 0);
      assert.ok(role.maxTokensPerTask > 0);
      assert.ok(role.budgetPerDay > 0);
    }
  }
});

// ---------------------------------------------------------------------------
// Template deployment
// ---------------------------------------------------------------------------

test("deployProspectingTeam creates team with 3 agents", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await deployProspectingTeam(tenantId, "construction");

  assert.ok(team.id);
  assert.equal(team.tenantId, tenantId);
  assert.ok(team.name.includes("Prospecting Team"));
  assert.ok(team.name.includes("construction"));
  assert.equal(team.agents.length, 3);
  assert.equal(team.status, "active");

  const roles = team.agents.map((a) => a.role);
  assert.ok(roles.includes("prospector"));
  assert.ok(roles.includes("enricher"));
  assert.ok(roles.includes("qualifier"));
});

test("deployContentTeam creates team with 3 agents", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await deployContentTeam(tenantId, "dental");

  assert.equal(team.agents.length, 3);
  const roles = team.agents.map((a) => a.role);
  assert.ok(roles.every((r) => r === "content-creator"));
});

test("deployFullStackTeam creates team with all roles", async () => {
  resetPaperclipStores();
  const tenantId = `tenant-${Date.now()}`;
  const team = await deployFullStackTeam(tenantId, "solar");

  assert.ok(team.agents.length >= 10);

  const roles = new Set(team.agents.map((a) => a.role));
  assert.ok(roles.has("prospector"));
  assert.ok(roles.has("enricher"));
  assert.ok(roles.has("content-creator"));
  assert.ok(roles.has("outreach-manager"));
  assert.ok(roles.has("analytics-reporter"));
  assert.ok(roles.has("nurture-manager"));
});
