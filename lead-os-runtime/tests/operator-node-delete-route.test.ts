import assert from "node:assert/strict"
import { after, before, beforeEach, describe, it } from "node:test"
import { initializeDatabase, queryPostgres } from "../src/lib/db.ts"
import { setupIntegrationEnvironment } from "./helpers/integration-db.ts"

describe("operator node delete route", () => {
  let restoreDbEnv: (() => void) | null = null

  function withOperatorIdentityHeaders(): HeadersInit {
    return {
      "x-authenticated-user-id": "operator@example.com",
      "x-authenticated-method": "operator-cookie",
      "x-authenticated-tenant-id": "default-tenant",
    }
  }

  before(async () => {
    restoreDbEnv = await setupIntegrationEnvironment({
      LEAD_OS_SINGLE_TENANT_ENFORCE: "false",
    })
    await initializeDatabase()
  })

  beforeEach(async () => {
    await queryPostgres("DELETE FROM operator_audit_log")
    await queryPostgres("DELETE FROM nodes WHERE tenant_id = $1", ["default-tenant"])
    await queryPostgres(
      `INSERT INTO nodes (tenant_id, node_key, sku_key, status)
       VALUES ($1, $2, $3, 'active')`,
      ["default-tenant", "node-delete-target", "sku-delete-target"],
    )
  })

  it("deletes node and writes operator audit", async () => {
    const { DELETE } = await import("../src/app/api/operator/nodes/[id]/route.ts")
    const node = await queryPostgres<{ id: string }>(
      "SELECT id::text FROM nodes WHERE tenant_id = $1 AND node_key = $2 LIMIT 1",
      ["default-tenant", "node-delete-target"],
    )
    const nodeId = node.rows[0]?.id
    assert.ok(nodeId)

    const response = await DELETE(
      new Request("http://localhost/api/operator/nodes/123", {
        method: "DELETE",
        headers: withOperatorIdentityHeaders(),
      }),
      { params: Promise.resolve({ id: nodeId ?? "0" }) },
    )
    assert.equal(response.status, 200)
    const payload = (await response.json()) as {
      success: boolean
      data?: { id: string; deleted: boolean }
    }
    assert.equal(payload.success, true)
    assert.equal(payload.data?.deleted, true)

    const afterNode = await queryPostgres<{ c: string }>(
      "SELECT COUNT(*)::text AS c FROM nodes WHERE tenant_id = $1 AND id = $2::bigint",
      ["default-tenant", nodeId],
    )
    assert.equal(Number(afterNode.rows[0]?.c ?? "0"), 0)

    const audits = await queryPostgres<{ action: string }>(
      `SELECT action
         FROM operator_audit_log
        WHERE tenant_id = $1
        ORDER BY created_at DESC`,
      ["default-tenant"],
    )
    assert.ok(audits.rows.some((row) => row.action === "node_delete"))
  })

  it("returns 401 for unauthenticated delete", async () => {
    const { DELETE } = await import("../src/app/api/operator/nodes/[id]/route.ts")
    const response = await DELETE(
      new Request("http://localhost/api/operator/nodes/123", { method: "DELETE" }),
      { params: Promise.resolve({ id: "123" }) },
    )
    assert.equal(response.status, 401)
  })

  after(() => {
    if (restoreDbEnv) restoreDbEnv()
  })
})
