/**
 * Integration test for ThriveCart webhook idempotency (PR #38, May 15, 2026).
 *
 * The webhook handler has two-layer protection against duplicate
 * delivery, both added in PR #38:
 *
 *   Layer 1 — payloadHash short-circuit. SHA-256 of the raw body is
 *   stored on ThriveCartEvent with a unique constraint. A retry of
 *   the same payload finds the existing event and returns immediately
 *   with `duplicate: true`, never invoking createOfferPurchase or
 *   fulfillment.
 *
 *   Layer 2 — OfferPurchase(thriveCartOrderId, offerId) compound
 *   unique. If two webhook deliveries land in the narrow race window
 *   between the payloadHash SELECT and the ThriveCartEvent INSERT
 *   (i.e. both pass the dedup check), the second INSERT into
 *   OfferPurchase trips P2002 and is treated as success. The first
 *   delivery already created the row and its fulfillment chain.
 *
 * Without these tests, the protections are unverified at the route
 * level. The original PR #38 commit message explicitly flagged this
 * gap as follow-up. This file closes that gap.
 */

import { describe, expect, it, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── Module mocks ─────────────────────────────────────────────────
// The route imports a lot of collaborators; we mock each so we
// can drive behaviour from the test and observe what was called.
// vi.hoisted lets the mock state survive the vi.mock factory hoisting.

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  findOfferPurchase: vi.fn(),
  createSubscriptionEntitlement: vi.fn(),
  syncCatalog: vi.fn(),
  createOfferPurchase: vi.fn(),
  fulfillOfferPurchase: vi.fn(),
  recordRevenueActionPlan: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    thriveCartEvent: {
      findUnique: mocks.findUnique,
      create: mocks.createEvent,
      update: mocks.updateEvent,
    },
    offerPurchase: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: mocks.findOfferPurchase,
    },
    offerSubscriptionEntitlement: {
      create: mocks.createSubscriptionEntitlement,
    },
  },
}))

vi.mock("@/lib/offer-catalog-sync", () => ({
  syncAutomatedOfferCatalog: mocks.syncCatalog,
}))

vi.mock("@/lib/offer-fulfillment", () => ({
  createOfferPurchase: mocks.createOfferPurchase,
  fulfillOfferPurchase: mocks.fulfillOfferPurchase,
}))

vi.mock("@/lib/revenue-actions", () => ({
  recordRevenueActionPlan: mocks.recordRevenueActionPlan,
}))

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>()
  return {
    ...actual,
    // after() is the Next.js request-scoped async callback. In tests
    // we fire-and-forget without scheduling.
    after: (callback: () => void | Promise<unknown>) => {
      void callback()
    },
  }
})

// Note: importing the route AFTER all mocks are declared.
// eslint-disable-next-line import/first
import { POST } from "@/app/api/webhooks/thrivecart/route"

// ── Test helpers ─────────────────────────────────────────────────

const VALID_TOKEN = "test-token-not-a-real-secret"

function buildPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    event: "order.success",
    order_id: "tc-order-42",
    product_id: "tc-product-1",
    amount: 49700,
    currency: "USD",
    customer: { email: "buyer@example.com", first_name: "Test", last_name: "Buyer" },
    passthrough: {
      offerSlug: "ux-audit-essentials",
      serviceSlug: "plumbing",
      sourcePage: "/plumbing",
      sourcePageType: "service_page",
    },
    ...overrides,
  }
}

function buildRequest(body: unknown) {
  // Token-style auth path (the route accepts ?token=X as an
  // equivalent to HMAC signature, useful for tests).
  return new NextRequest(
    `https://erie.pro/api/webhooks/thrivecart?token=${VALID_TOKEN}`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    },
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.THRIVECART_WEBHOOK_TOKEN = VALID_TOKEN
  // Default happy-path responses; individual tests override as needed.
  mocks.findUnique.mockResolvedValue(null)
  mocks.createEvent.mockResolvedValue({ id: "evt-1" })
  mocks.updateEvent.mockResolvedValue({ id: "evt-1" })
  mocks.syncCatalog.mockResolvedValue(undefined)
  mocks.createOfferPurchase.mockResolvedValue({
    purchase: {
      id: "purchase-1",
      customerId: "cust-1",
      serviceSlug: "plumbing",
      serviceLabel: "Plumbing",
      serviceFamily: "Home Services",
    },
  })
  mocks.fulfillOfferPurchase.mockResolvedValue(undefined)
  mocks.recordRevenueActionPlan.mockResolvedValue(undefined)
})

describe("ThriveCart webhook — Layer 1: payloadHash short-circuit", () => {
  it("rejects a duplicate payload without invoking createOfferPurchase", async () => {
    // First delivery: nothing in DB, will process normally.
    // Second delivery: same payload, findUnique returns processed event.
    mocks.findUnique.mockResolvedValueOnce({
      id: "evt-existing",
      processingStatus: "processed",
      processedAt: new Date("2026-05-15T20:00:00Z"),
    })

    const response = await POST(buildRequest(buildPayload()))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.duplicate).toBe(true)
    expect(json.originalEventId).toBe("evt-existing")
    expect(json.message).toMatch(/already processed/i)

    // Critical: none of the side-effect work runs on a duplicate.
    expect(mocks.createEvent).not.toHaveBeenCalled()
    expect(mocks.createOfferPurchase).not.toHaveBeenCalled()
    expect(mocks.fulfillOfferPurchase).not.toHaveBeenCalled()
    expect(mocks.recordRevenueActionPlan).not.toHaveBeenCalled()
  })

  it("processes a payload the first time it is seen", async () => {
    mocks.findUnique.mockResolvedValueOnce(null)

    const response = await POST(buildRequest(buildPayload()))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.duplicate).toBeUndefined()
    expect(mocks.createEvent).toHaveBeenCalledOnce()
    expect(mocks.createOfferPurchase).toHaveBeenCalledOnce()
    // Fulfillment is scheduled via after(), which our mock runs inline.
    expect(mocks.fulfillOfferPurchase).toHaveBeenCalled()
  })

  it("uses a deterministic SHA-256 of the raw body for dedup", async () => {
    // Two requests with identical bodies should produce identical
    // payloadHash values. We verify by sending the same payload
    // twice and asserting the second one is short-circuited.
    const payload = buildPayload({ order_id: "tc-order-stable" })

    // First call: no existing event.
    mocks.findUnique.mockResolvedValueOnce(null)
    await POST(buildRequest(payload))

    // Capture the payloadHash that was stored on the first call.
    const firstCallArgs = mocks.createEvent.mock.calls[0][0]
    const firstPayloadHash = firstCallArgs.data.payloadHash

    // Second call: simulate the DB now contains the processed event.
    mocks.findUnique.mockResolvedValueOnce({
      id: "evt-stable",
      processingStatus: "processed",
      processedAt: new Date(),
    })
    const response = await POST(buildRequest(payload))
    const json = await response.json()

    // The findUnique on the second call must have been queried
    // with the SAME hash that was stored on the first call.
    const secondFindUniqueArgs = mocks.findUnique.mock.calls[1][0]
    expect(secondFindUniqueArgs.where.payloadHash).toBe(firstPayloadHash)
    expect(json.duplicate).toBe(true)
    expect(firstPayloadHash).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe("ThriveCart webhook — Layer 2: P2002 compound unique catch", () => {
  it("treats a P2002 on OfferPurchase insert as success", async () => {
    // Simulate the race-window case: payloadHash dedup passed (because
    // a concurrent delivery had not yet inserted the ThriveCartEvent
    // row), but the OfferPurchase compound unique on
    // (thriveCartOrderId, offerId) rejects the second insert.
    mocks.findUnique.mockResolvedValueOnce(null)
    const p2002Error = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
      meta: { target: ["thriveCartOrderId", "offerId"] },
    })
    mocks.createOfferPurchase.mockRejectedValueOnce(p2002Error)

    // The route's catch block looks up the existing OfferPurchase
    // so the rest of the loop still has something to attach actions
    // to. We return the row that the concurrent delivery created.
    mocks.findOfferPurchase.mockResolvedValueOnce({
      id: "purchase-existing",
      customerId: "cust-existing",
      serviceSlug: "plumbing",
      serviceLabel: "Plumbing",
      serviceFamily: "Home Services",
    })

    const response = await POST(buildRequest(buildPayload({ order_id: "race-order" })))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    // The route returned the EXISTING purchase id, not a new one.
    expect(json.purchaseIds).toContain("purchase-existing")
    // It looked up the existing row to recover purchase metadata.
    expect(mocks.findOfferPurchase).toHaveBeenCalledOnce()
    // And it still recorded the revenue action plan against it.
    expect(mocks.recordRevenueActionPlan).toHaveBeenCalled()
  })

  it("re-throws non-P2002 errors instead of swallowing them", async () => {
    mocks.findUnique.mockResolvedValueOnce(null)
    mocks.createOfferPurchase.mockRejectedValueOnce(new Error("connection refused"))

    const response = await POST(buildRequest(buildPayload({ order_id: "real-error" })))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error).toMatch(/processing failed/i)
    // findOfferPurchase is the P2002-recovery path; it must NOT run
    // for a generic error.
    expect(mocks.findOfferPurchase).not.toHaveBeenCalled()
  })

  it("re-throws P2002 if the existing row genuinely cannot be located", async () => {
    // Edge case: createOfferPurchase throws P2002 but findFirst
    // returns null (impossible in theory — P2002 means a row exists
    // — but defensive code path in the route). We expect the
    // handler to bail with 500 rather than continue with an
    // undefined `purchase`.
    mocks.findUnique.mockResolvedValueOnce(null)
    const p2002Error = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    })
    mocks.createOfferPurchase.mockRejectedValueOnce(p2002Error)
    mocks.findOfferPurchase.mockResolvedValueOnce(null)

    const response = await POST(buildRequest(buildPayload({ order_id: "phantom-race" })))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
  })
})
