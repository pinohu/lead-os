import { afterEach, describe, expect, it, vi } from "vitest"
import { createSuiteDashContact, readSuiteDashRecordId, SuiteDashError } from "../suitedash"

const originalPublicId = process.env.SUITEDASH_YOURDEPUTY_PUBLIC_ID
const originalSecretKey = process.env.SUITEDASH_YOURDEPUTY_SECRET_KEY

afterEach(() => {
  process.env.SUITEDASH_YOURDEPUTY_PUBLIC_ID = originalPublicId
  process.env.SUITEDASH_YOURDEPUTY_SECRET_KEY = originalSecretKey
  vi.unstubAllGlobals()
})

describe("SuiteDash client", () => {
  it("reads uid or id from SuiteDash responses", () => {
    expect(readSuiteDashRecordId({ success: true, data: { uid: "uid-1", id: 2 } })).toBe("uid-1")
    expect(readSuiteDashRecordId({ success: true, data: { id: 2 } })).toBe("2")
    expect(readSuiteDashRecordId({ success: true })).toBeNull()
  })

  it("retries retryable SuiteDash failures and sends idempotency key", async () => {
    process.env.SUITEDASH_YOURDEPUTY_PUBLIC_ID = "public"
    process.env.SUITEDASH_YOURDEPUTY_SECRET_KEY = "secret"
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false, message: "busy" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { uid: "contact-1" } }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const response = await createSuiteDashContact({
      first_name: "Pat",
      last_name: "Buyer",
      email: "pat@example.com",
    }, { idempotencyKey: "erie-pro:contact:1", attempts: 2 })

    expect(readSuiteDashRecordId(response)).toBe("contact-1")
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe("erie-pro:contact:1")
  })

  it("throws when credentials are missing", async () => {
    process.env.SUITEDASH_YOURDEPUTY_PUBLIC_ID = ""
    process.env.SUITEDASH_YOURDEPUTY_SECRET_KEY = ""

    await expect(createSuiteDashContact({
      first_name: "Pat",
      last_name: "Buyer",
      email: "pat@example.com",
    }, { attempts: 1 })).rejects.toBeInstanceOf(SuiteDashError)
  })
})
