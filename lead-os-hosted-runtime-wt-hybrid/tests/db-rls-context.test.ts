import test from "node:test";
import assert from "node:assert/strict";

import { deriveTenantIdForRls } from "../src/lib/db.ts";

test("deriveTenantIdForRls detects tenant-scoped reads and writes", () => {
  assert.equal(
    deriveTenantIdForRls("SELECT * FROM leads WHERE tenant_id = $1 AND id = $2", ["tenant-a", "lead-1"]),
    "tenant-a",
  );
  assert.equal(
    deriveTenantIdForRls("INSERT INTO events (tenant_id, payload) VALUES ($1, $2::jsonb)", ["tenant-b", "{}"]),
    "tenant-b",
  );
});

test("deriveTenantIdForRls ignores unscoped or invalid queries", () => {
  assert.equal(deriveTenantIdForRls("SELECT * FROM leads", ["tenant-a"]), undefined);
  assert.equal(deriveTenantIdForRls("SELECT * FROM leads WHERE tenant_id = $2", ["tenant-a", "tenant-b"]), undefined);
  assert.equal(deriveTenantIdForRls("SELECT * FROM leads WHERE tenant_id = $1", [123]), undefined);
});
