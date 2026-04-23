import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createHmac } from "crypto"
import { withEnv } from "./test-helpers.ts"
import { createSessionToken, requireOperatorApiSession } from "../src/lib/operator-auth.ts"

function sign(input: {
  userId: string
  tenantId: string
  requestId: string
  secret: string
}): string {
  return createHmac("sha256", input.secret)
    .update(`${input.userId}:${input.tenantId}:${input.requestId}`)
    .digest("hex")
}

describe("operator auth middleware signature", () => {
  it("rejects spoofed authenticated headers without valid signature", async () => {
    const secret = "operator-signature-secret"
    process.env.LEAD_OS_AUTH_SECRET = secret
    const request = new Request("http://localhost/api/operator/control-plane", {
      headers: {
        "x-authenticated-user-id": "operator@example.com",
        "x-authenticated-method": "operator-cookie",
        "x-authenticated-tenant-id": "default-tenant",
        "x-request-id": "bad-signature-request",
        "x-middleware-signature": "not-valid",
      },
    })
    const result = await requireOperatorApiSession(request)
    assert.equal(result.session, null)
    assert.equal(result.response?.status, 401)
  })

  it("accepts authenticated headers with valid middleware signature", async () => {
    const secret = "operator-signature-secret"
    process.env.LEAD_OS_AUTH_SECRET = secret
    const requestId = "good-signature-request"
    const signature = sign({
      userId: "operator@example.com",
      tenantId: "default-tenant",
      requestId,
      secret,
    })
    const request = new Request("http://localhost/api/operator/control-plane", {
      headers: {
        "x-authenticated-user-id": "operator@example.com",
        "x-authenticated-method": "operator-cookie",
        "x-authenticated-tenant-id": "default-tenant",
        "x-authenticated-role": "owner",
        "x-request-id": requestId,
        "x-middleware-signature": signature,
      },
    })
    const result = await requireOperatorApiSession(request)
    assert.equal(result.session?.email, "operator@example.com")
    assert.equal(result.response, null)
  })

  it("falls back to valid cookie session when headers are unsigned", async () => {
    const secret = "operator-signature-secret"
    const restore = withEnv({
      LEAD_OS_AUTH_SECRET: secret,
      LEAD_OS_OPERATOR_EMAILS: "operator@example.com",
    })
    try {
      const token = await createSessionToken("operator@example.com")
      const request = new Request("http://localhost/api/operator/control-plane", {
        headers: {
          "x-authenticated-user-id": "operator@example.com",
          "x-authenticated-method": "operator-cookie",
          "x-authenticated-tenant-id": "default-tenant",
          cookie: `leados_operator_session=${token}`,
        },
      })
      const result = await requireOperatorApiSession(request)
      assert.equal(result.session?.email, "operator@example.com")
      assert.equal(result.response, null)
    } finally {
      restore()
    }
  })
})
