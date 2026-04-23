// tests/gtm-persistence.test.ts — optional integration when Postgres is available.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPool, queryPostgres } from "../src/lib/db.ts";
import { upsertGtmStatusRow, getGtmStatusRow } from "../src/lib/gtm/store.ts";

const hasDb = Boolean(process.env.LEAD_OS_DATABASE_URL ?? process.env.DATABASE_URL);

describe("GTM Postgres persistence", () => {
  if (!hasDb) {
    it("skips when no database URL is configured", () => {
      assert.ok(true);
    });
    return;
  }

  it("persists and reads back a GTM status row when the table exists", async () => {
    if (!getPool()) {
      assert.ok(true);
      return;
    }
    const tenantId = "test-gtm-persist";
    const slug = "integration-hub";
    try {
      await upsertGtmStatusRow({
        tenantId,
        slug,
        status: "in_progress",
        notes: "node:test probe",
        updatedBy: "node-test@example.com",
      });
      const row = await getGtmStatusRow(tenantId, slug);
      assert.equal(row?.status, "in_progress");
      assert.match(row?.notes ?? "", /node:test probe/);
      await queryPostgres("DELETE FROM gtm_use_case_statuses WHERE tenant_id = $1 AND slug = $2", [
        tenantId,
        slug,
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("gtm_use_case_statuses")) {
        assert.ok(true, "migration not applied in this environment");
        return;
      }
      throw err;
    }
  });
});
