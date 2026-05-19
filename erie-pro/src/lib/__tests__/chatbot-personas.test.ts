// erie-pro/src/lib/__tests__/chatbot-personas.test.ts

import { describe, expect, it } from "vitest"
import { resolveChatPersona } from "@/lib/chatbot/personas"

describe("resolveChatPersona", () => {
  it("uses consumer_status on request-status pages", () => {
    expect(
      resolveChatPersona({
        pathname: "/request-status/SR-123",
        audience: "consumer",
      }),
    ).toBe("consumer_status")
  })

  it("uses provider_growth on for-business", () => {
    expect(
      resolveChatPersona({
        pathname: "/for-business",
        audience: "provider",
      }),
    ).toBe("provider_growth")
  })

  it("uses provider_operations on dashboard", () => {
    expect(
      resolveChatPersona({
        pathname: "/dashboard",
        audience: "provider",
      }),
    ).toBe("provider_operations")
  })

  it("uses admin_operations under /admin", () => {
    expect(
      resolveChatPersona({
        pathname: "/admin/notifications",
        audience: "admin",
      }),
    ).toBe("admin_operations")
  })
})
