import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  createSelfServiceToken,
  verifySelfServiceToken,
} from "../src/lib/self-service-tokens.ts";

const savedAuth = process.env.LEAD_OS_AUTH_SECRET;
const savedCron = process.env.CRON_SECRET;

afterEach(() => {
  if (savedAuth === undefined) delete process.env.LEAD_OS_AUTH_SECRET;
  else process.env.LEAD_OS_AUTH_SECRET = savedAuth;
  if (savedCron === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = savedCron;
});

test("self-service tokens fail closed when LEAD_OS_AUTH_SECRET is missing", () => {
  delete process.env.LEAD_OS_AUTH_SECRET;
  process.env.CRON_SECRET = "cron-secret-must-not-sign-self-service-links";

  assert.equal(createSelfServiceToken("unsubscribe", "Lead@Example.com", "tenant-a", 24), null);
  assert.equal(
    verifySelfServiceToken("unsubscribe", "Lead@Example.com", "tenant-a", "anything", 24),
    false,
  );
});

test("self-service tokens are purpose scoped and timing-safe verifiable", () => {
  process.env.LEAD_OS_AUTH_SECRET = "test-self-service-secret";
  delete process.env.CRON_SECRET;

  const unsubscribe = createSelfServiceToken("unsubscribe", "Lead@Example.com", "tenant-a", 24);
  const preferences = createSelfServiceToken("preferences", "Lead@Example.com", "tenant-a", 32);

  assert.ok(unsubscribe);
  assert.ok(preferences);
  assert.equal(unsubscribe.length, 24);
  assert.equal(preferences.length, 32);
  assert.equal(verifySelfServiceToken("unsubscribe", "lead@example.com", "tenant-a", unsubscribe, 24), true);
  assert.equal(verifySelfServiceToken("preferences", "lead@example.com", "tenant-a", unsubscribe, 24), false);
});
