// tests/error-handling-routes.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { setupIntegrationEnvironment } from "./helpers/integration-db.ts"
import { createHmac } from "crypto"

function signMiddlewareIdentity(input: {
  userId: string
  tenantId: string
  requestId: string
}): string {
  const payload = `${input.userId}:${input.tenantId}:${input.requestId}`
  return createHmac(
    "sha256",
    process.env.LEAD_OS_AUTH_SECRET ?? "test-auth-secret",
  )
    .update(payload)
    .digest("hex")
}

describe("error handling on critical routes", () => {
  it("operator actions returns structured invalid_json error", async () => {
    const restore = await setupIntegrationEnvironment()
    try {
    const { POST } = await import("../src/app/api/operator/actions/route.ts")
    const requestId = "error-test-actions"
    const res = await POST(
      new Request("http://localhost/api/operator/actions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-authenticated-user-id": "operator@example.com",
          "x-authenticated-method": "operator-cookie",
          "x-authenticated-tenant-id": "default-tenant",
          "x-authenticated-role": "owner",
          "x-request-id": requestId,
          "x-middleware-signature": signMiddlewareIdentity({
            userId: "operator@example.com",
            tenantId: "default-tenant",
            requestId,
          }),
        },
        body: "{",
      }),
    )
    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.ok, false)
    assert.equal(json.error, "invalid_json")
    } finally {
      restore()
    }
  })

  it("operator GTM returns structured invalid_json error", async () => {
    const restore = await setupIntegrationEnvironment()
    try {
      const { PATCH } = await import("../src/app/api/operator/gtm/route.ts")
      const requestId = "error-test-gtm"
      const res = await PATCH(
        new Request("http://localhost/api/operator/gtm", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            "x-authenticated-user-id": "operator@example.com",
            "x-authenticated-method": "operator-cookie",
            "x-authenticated-tenant-id": "default-tenant",
            "x-authenticated-role": "owner",
            "x-request-id": requestId,
            "x-middleware-signature": signMiddlewareIdentity({
              userId: "operator@example.com",
              tenantId: "default-tenant",
              requestId,
            }),
          },
          body: "{",
        }),
      )
      assert.equal(res.status, 400)
      const json = await res.json()
      assert.equal(json.ok, false)
      assert.equal(json.error, "invalid_json")
    } finally {
      restore()
    }
  })

  it("operator GTM returns 401 for invalid auth", async () => {
    const restore = await setupIntegrationEnvironment()
    try {
      const { GET } = await import("../src/app/api/operator/gtm/route.ts")
      const res = await GET(new Request("http://localhost/api/operator/gtm"))
      assert.equal(res.status, 401)
      const json = await res.json()
      assert.ok(
        json.error === "unauthorized" || json.error === "Unauthorized",
      )
    } finally {
      restore()
    }
  })

  it("stripe webhook route rejects missing signature with structured error", async () => {
    const { POST } = await import("../src/app/api/billing/stripe/webhook/route.ts")
    const res = await POST(
      new Request("http://localhost/api/billing/stripe/webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    )
    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.error?.code, "MISSING_SIGNATURE")
  })

  it("cron optimize route rejects invalid JSON with structured error", async () => {
    process.env.CRON_SECRET = "cron-error-test"
    const { POST } = await import("../src/app/api/cron/optimize/route.ts")
    const res = await POST(
      new Request("http://localhost/api/cron/optimize", {
        method: "POST",
        headers: {
          "x-cron-secret": "cron-error-test",
          "content-type": "application/json",
        },
        body: "{",
      }),
    )
    assert.equal(res.status, 400)
    const json = await res.json()
    assert.equal(json.error.code, "INVALID_JSON")
  })
})
