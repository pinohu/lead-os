import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"
import { POST } from "../src/app/api/intake/route.ts"
import { resetIntakeIdempotencyCache } from "../src/lib/intake-idempotency-cache.ts"
import { resetRuntimeStore } from "../src/lib/runtime-store.ts"
import { setupIntegrationEnvironment } from "./helpers/integration-db.ts"

describe("POST /api/intake idempotency", () => {
  let restoreEnv: (() => void) | null = null

  beforeEach(async () => {
    restoreEnv = await setupIntegrationEnvironment()
    resetIntakeIdempotencyCache()
    try {
      await resetRuntimeStore()
    } catch {
      // Fallback for environments where TRUNCATE ordering in runtime-store
      // conflicts with FK references. setupIntegrationEnvironment already
      // clears persistent state.
    }
  })

  afterEach(() => {
    if (restoreEnv) restoreEnv()
    restoreEnv = null
  })

  it("replays response for same key and same payload", async () => {
    const payload = {
      email: "idempotent-same@example.com",
      firstName: "Same",
      message: "same payload",
    }

    const requestA = new Request("http://localhost/api/intake", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "same-payload-key",
      },
      body: JSON.stringify(payload),
    })
    const responseA = await POST(requestA)
    assert.equal(responseA.status, 200)
    const jsonA = await responseA.json()
    assert.equal(jsonA.success, true)

    const requestB = new Request("http://localhost/api/intake", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "same-payload-key",
      },
      body: JSON.stringify(payload),
    })
    const responseB = await POST(requestB)
    assert.equal(responseB.status, 200)
    assert.equal(responseB.headers.get("X-Idempotency-Replayed"), "true")
    const jsonB = await responseB.json()
    assert.deepEqual(jsonB, jsonA)
  })

  it("returns 409 for same key and different payload", async () => {
    const requestA = new Request("http://localhost/api/intake", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "different-payload-key",
      },
      body: JSON.stringify({
        email: "idempotent-diff@example.com",
        firstName: "First",
        message: "payload one",
      }),
    })
    const responseA = await POST(requestA)
    assert.equal(responseA.status, 200)

    const requestB = new Request("http://localhost/api/intake", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "different-payload-key",
      },
      body: JSON.stringify({
        email: "idempotent-diff@example.com",
        firstName: "Second",
        message: "payload two",
      }),
    })
    const responseB = await POST(requestB)
    assert.equal(responseB.status, 409)
    const jsonB = await responseB.json()
    assert.equal(jsonB.success, false)
    assert.equal(jsonB.error, "idempotency_key_reuse_with_different_body")
  })
})
