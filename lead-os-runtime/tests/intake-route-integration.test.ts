import assert from "node:assert/strict"
import test from "node:test"
import { initializeDatabase, queryPostgres } from "../src/lib/db.ts"
import { resetRuntimeStore } from "../src/lib/runtime-store.ts"
import { resetIntakeIdempotencyCache } from "../src/lib/intake-idempotency-cache.ts"
import { setupIntegrationEnvironment } from "./helpers/integration-db.ts"

async function cleanupLeadRows(email: string): Promise<void> {
  await queryPostgres("DELETE FROM leads WHERE email = $1", [email])
}

test("POST /api/intake returns routing result and persists side effects", async () => {
  const restoreIntegrationEnv = await setupIntegrationEnvironment()
  try {
    await initializeDatabase()
    try {
      await resetRuntimeStore()
    } catch {
      // setupIntegrationEnvironment already clears DB-backed runtime tables.
    }
    resetIntakeIdempotencyCache()

    const email = `intake-e2e-${Date.now()}@example.com`
    await cleanupLeadRows(email)

    const { POST } = await import("../src/app/api/intake/route.ts")
    const res = await POST(
      new Request("http://localhost/api/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: "Integration",
          message: "Needs help now",
        }),
      }),
    )

    assert.equal(res.status, 200)
    const json = await res.json() as {
      success: boolean
      id: number
      leadKey: string
      routing: { channel: string; funnelType: string }
      assignment: { eventName: string } | null
      deliveryLog: { provider: string } | null
    }
    assert.equal(json.success, true)
    assert.equal(typeof json.id, "number")
    assert.equal(json.routing.channel.length > 0, true)
    assert.equal(json.routing.funnelType.length > 0, true)
    assert.equal(json.assignment?.eventName, "lead.assignment.created")
    assert.equal(json.deliveryLog?.provider, "internal-runtime")

    const leadRows = await queryPostgres<{ c: string }>(
      "SELECT COUNT(*)::text AS c FROM leads WHERE email = $1",
      [email],
    )
    assert.equal(Number(leadRows.rows[0]?.c ?? "0"), 1)

    await cleanupLeadRows(email)
  } finally {
    restoreIntegrationEnv()
  }
})
