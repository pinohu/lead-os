import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

const node = process.execPath;

function runScript(script: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(node, [script, ...args], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ...env,
    },
    encoding: "utf8",
  });
}

describe("delivery scripts", () => {
  it("fails production env validation when required vault groups are missing", () => {
    const result = runScript("scripts/detect-env-presence.mjs", ["--production", "--json"], {
      LEAD_OS_BILLING_ENFORCE: "true",
    });

    assert.equal(result.status, 1);
    const output = JSON.parse(result.stdout);
    assert.equal(output.productionStrict, true);
    assert.ok(output.missingRequiredGroups.includes("auth_secret"));
    assert.ok(output.missingRequiredGroups.includes("database"));
    assert.doesNotMatch(result.stdout, /replace-with-a-long-random-secret/i);
  });

  it("passes production env validation with a complete vault-shaped environment", () => {
    const result = runScript("scripts/detect-env-presence.mjs", ["--production", "--json"], {
      LEAD_OS_AUTH_SECRET: "test-auth-secret-with-enough-length",
      LEAD_OS_OPERATOR_EMAILS: "owner@lead-os.example",
      LEAD_OS_DATABASE_URL: "postgres://user:pass@example.invalid:5432/leados",
      REDIS_URL: "redis://example.invalid:6379",
      STRIPE_SECRET_KEY: "sk_test_delivery_gate",
      STRIPE_WEBHOOK_SECRET: "whsec_delivery_gate",
      NEXT_PUBLIC_SITE_URL: "https://lead-os.example",
      CRON_SECRET: "test-cron-secret",
      LEAD_OS_BILLING_ENFORCE: "true",
    });

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.productionReady, true);
    assert.deepEqual(output.missingRequiredGroups, []);
    assert.doesNotMatch(result.stdout, /postgres:\/\/user:pass/i);
    assert.doesNotMatch(result.stdout, /sk_test_delivery_gate/i);
  });

  it("can plan post-deploy smoke checks without touching the network", () => {
    const result = runScript("scripts/postdeploy-smoke.mjs", [
      "--plan",
      "--json",
      "--url",
      "lead-os.example",
    ]);

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.dryRun, true);
    assert.equal(output.baseUrl, "https://lead-os.example");
    assert.ok(output.checks.some((check: { path: string }) => check.path === "/api/health"));
    assert.ok(output.checks.some((check: { path: string }) => check.path === "/packages"));
  });
});
