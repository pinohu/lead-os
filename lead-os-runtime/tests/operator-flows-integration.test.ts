import assert from "node:assert/strict"
import { after, before, beforeEach, describe, it } from "node:test"
import { initializeDatabase, queryPostgres } from "../src/lib/db.ts"
import { OPERATOR_SESSION_COOKIE, createSessionToken } from "../src/lib/operator-auth.ts"
import { resetIntakeIdempotencyCache } from "../src/lib/intake-idempotency-cache.ts"
import { setupIntegrationEnvironment } from "./helpers/integration-db.ts"

describe("operator flows integration", () => {
  let sessionCookieHeader = ""
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
    const token = await createSessionToken("operator@example.com")
    sessionCookieHeader = `${OPERATOR_SESSION_COOKIE}=${token}`
  })

  beforeEach(async () => {
    resetIntakeIdempotencyCache()
    await queryPostgres("DELETE FROM operator_audit_log")
    await queryPostgres("DELETE FROM gtm_use_case_statuses WHERE tenant_id = $1", [
      "default-tenant",
    ])
    await queryPostgres("DELETE FROM nodes WHERE tenant_id = $1", ["default-tenant"])
    await queryPostgres(
      `INSERT INTO nodes (tenant_id, node_key, sku_key, status)
       VALUES ($1, $2, $3, 'active')`,
      ["default-tenant", "node-alpha", "sku-alpha"],
    )
  })

  it("rejects unauthenticated operator request", async () => {
    const { GET } = await import("../src/app/api/operator/control-plane/route.ts")
    const response = await GET(new Request("http://localhost/api/operator/control-plane"))
    assert.equal(response.status, 401)
  })

  it("creates/updates/disables node and records audit", async () => {
    const { POST: postNode } = await import("../src/app/api/operator/nodes/route.ts")
    const { PATCH: patchNode } = await import(
      "../src/app/api/operator/nodes/[id]/route.ts"
    )

    const createResponse = await postNode(
      new Request("http://localhost/api/operator/nodes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...withOperatorIdentityHeaders(),
        },
        body: JSON.stringify({ nodeKey: "node-alpha", status: "paused" }),
      }),
    )
    assert.equal(createResponse.status, 200)

    const list = await queryPostgres<{ id: string; status: string }>(
      "SELECT id::text, status FROM nodes WHERE tenant_id = $1 AND node_key = $2 LIMIT 1",
      ["default-tenant", "node-alpha"],
    )
    assert.equal(list.rows[0]?.status, "paused")
    const nodeId = list.rows[0]?.id
    assert.ok(nodeId)

    const disableResponse = await patchNode(
      new Request("http://localhost/api/operator/nodes/123", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...withOperatorIdentityHeaders(),
        },
        body: JSON.stringify({ status: "disabled" }),
      }),
      { params: Promise.resolve({ id: nodeId ?? "0" }) },
    )
    assert.equal(disableResponse.status, 200)

    const node = await queryPostgres<{ status: string }>(
      "SELECT status FROM nodes WHERE tenant_id = $1 AND id = $2::bigint LIMIT 1",
      ["default-tenant", nodeId],
    )
    assert.equal(node.rows[0]?.status, "disabled")

    const audits = await queryPostgres<{ action: string }>(
      `SELECT action
         FROM operator_audit_log
        WHERE tenant_id = $1
        ORDER BY created_at DESC`,
      ["default-tenant"],
    )
    assert.ok(audits.rows.some((row) => row.action === "node_status_update"))
  })

  it("updates GTM status and control-plane fetch succeeds", async () => {
    const { PATCH: patchGtm } = await import("../src/app/api/operator/gtm/route.ts")
    const { GET: getControlPlane } = await import(
      "../src/app/api/operator/control-plane/route.ts"
    )

    const gtmResponse = await patchGtm(
      new Request("http://localhost/api/operator/gtm", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...withOperatorIdentityHeaders(),
        },
        body: JSON.stringify({
          slug: "erie-exclusive-niche",
          status: "in_progress",
          notes: "operator validation",
        }),
      }),
    )
    assert.equal(gtmResponse.status, 200)

    const statusRow = await queryPostgres<{ status: string; notes: string }>(
      `SELECT status, notes
         FROM gtm_use_case_statuses
        WHERE tenant_id = $1 AND slug = $2
        LIMIT 1`,
      ["default-tenant", "erie-exclusive-niche"],
    )
    assert.equal(statusRow.rows[0]?.status, "in_progress")
    assert.equal(statusRow.rows[0]?.notes, "operator validation")

    const controlPlaneResponse = await getControlPlane(
      new Request("http://localhost/api/operator/control-plane", {
        headers: withOperatorIdentityHeaders(),
      }),
    )
    assert.equal(controlPlaneResponse.status, 200)
    const payload = (await controlPlaneResponse.json()) as {
      ok: boolean
      data: { tenantId: string }
    }
    assert.equal(payload.ok, true)
    assert.equal(payload.data.tenantId, "default-tenant")
  })

  after(() => {
    if (restoreDbEnv) restoreDbEnv()
  })
})
