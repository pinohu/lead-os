// erie-pro/src/lib/__tests__/privacy-self-service.test.ts
import { describe, expect, it, beforeEach, afterEach } from "vitest"
import {
  generatePrivacyToken,
  validatePrivacyToken,
  normalizePrivacyEmail,
} from "../privacy-self-service"

describe("privacy-self-service", () => {
  const prev = process.env.AUTH_SECRET

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-for-privacy"
  })

  afterEach(() => {
    process.env.AUTH_SECRET = prev
  })

  it("normalizes email", () => {
    expect(normalizePrivacyEmail("  User@Example.COM ")).toBe("user@example.com")
  })

  it("generates and validates token", () => {
    const email = "user@example.com"
    const token = generatePrivacyToken(email)
    expect(validatePrivacyToken(email, token)).toBe(true)
    expect(validatePrivacyToken(email, "wrong-token-xxxxxxxxxxxxxxxx")).toBe(false)
  })
})
