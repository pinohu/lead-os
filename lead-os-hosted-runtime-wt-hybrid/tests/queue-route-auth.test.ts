// tests/queue-route-auth.test.ts
import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

let savedCron: string | undefined;
let savedAuth: string | undefined;

beforeEach(() => {
  savedCron = process.env.CRON_SECRET;
  savedAuth = process.env.LEAD_OS_AUTH_SECRET;
  delete process.env.CRON_SECRET;
  delete process.env.LEAD_OS_AUTH_SECRET;
});

afterEach(() => {
  if (savedCron !== undefined) process.env.CRON_SECRET = savedCron;
  else delete process.env.CRON_SECRET;
  if (savedAuth !== undefined) process.env.LEAD_OS_AUTH_SECRET = savedAuth;
  else delete process.env.LEAD_OS_AUTH_SECRET;
});

describe("GET /api/queue", () => {
  it("returns 401 without cron secret header and without operator session", async () => {
    const { GET } = await import("../src/app/api/queue/route.ts");
    const res = await GET(new Request("http://localhost/api/queue"));
    assert.equal(res.status, 401);
  });
});
