// erie-pro/src/lib/__tests__/chatbot-provider-growth.test.ts

import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  detectProviderPlanSlug,
  resolvePlanSlugFromGoals,
  isProviderPlanCheckoutIntent,
  isCasualGreeting,
} from "@/lib/chatbot/provider-plan-resolver"
import {
  formatProviderGrowthPlanReply,
  runProviderGrowthFallback,
} from "@/lib/chatbot/provider-growth-fallback"
import type { ChatToolContext } from "@/lib/chatbot/tools/types"

vi.mock("@/lib/chatbot/tool-registry", () => ({
  executeChatTool: vi.fn(),
}))

import { executeChatTool } from "@/lib/chatbot/tool-registry"

const toolCtx: ChatToolContext = {
  persona: "provider_growth",
  sessionId: "sess_test",
}

describe("provider plan resolver", () => {
  it("detects explicit plan names", () => {
    expect(detectProviderPlanSlug("Starter")).toBe("starter")
    expect(detectProviderPlanSlug("go professional")).toBe("professional")
    expect(detectProviderPlanSlug("PREMIUM please")).toBe("premium")
    expect(detectProviderPlanSlug("elite tier")).toBe("elite")
  })

  it("maps growth goals to professional", () => {
    expect(resolvePlanSlugFromGoals("I need more leads")).toBe("professional")
    expect(resolvePlanSlugFromGoals("growth plan")).toBe("professional")
  })

  it("recognizes checkout intent", () => {
    expect(isProviderPlanCheckoutIntent("checkout link for starter")).toBe(true)
    expect(isProviderPlanCheckoutIntent("what plans do you have")).toBe(true)
  })

  it("recognizes casual greetings", () => {
    expect(isCasualGreeting("hi")).toBe(true)
    expect(isCasualGreeting("Hello!")).toBe(true)
    expect(isCasualGreeting("Starter")).toBe(false)
  })
})

describe("formatProviderGrowthPlanReply", () => {
  it("includes plan label and checkout URL", () => {
    const text = formatProviderGrowthPlanReply(
      {
        ok: true,
        data: {
          planSlug: "starter",
          label: "Starter Local Authority",
          disclaimer: "Plan recommendation only.",
        },
      },
      {
        ok: true,
        data: {
          planSlug: "starter",
          checkoutUrl: "https://relgard.thrivecart.com/?plan_slug=starter",
          disclaimer: "Checkout completes in ThriveCart.",
        },
      },
    )
    expect(text).toContain("Starter Local Authority")
    expect(text).toContain("https://relgard.thrivecart.com/?plan_slug=starter")
    expect(text).toContain("ThriveCart")
  })
})

describe("runProviderGrowthFallback", () => {
  beforeEach(() => {
    vi.mocked(executeChatTool).mockReset()
  })

  it("calls plan tools when user says Starter", async () => {
    vi.mocked(executeChatTool)
      .mockResolvedValueOnce({
        ok: true,
        data: {
          planSlug: "starter",
          label: "Starter Local Authority",
          disclaimer: "Plan recommendation only.",
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          planSlug: "starter",
          checkoutUrl: "https://relgard.thrivecart.com/?plan_slug=starter",
          disclaimer: "Checkout completes in ThriveCart.",
        },
      })

    const reply = await runProviderGrowthFallback("Starter", toolCtx)

    expect(executeChatTool).toHaveBeenCalledWith(
      "recommendProviderPlan",
      { goals: "Starter" },
      toolCtx,
    )
    expect(executeChatTool).toHaveBeenCalledWith(
      "getThriveCartCheckoutUrl",
      { planSlug: "starter" },
      toolCtx,
    )
    expect(reply).toContain("Starter Local Authority")
    expect(reply).toContain("thrivecart.com")
  })

  it("returns a greeting-specific reply for hi", async () => {
    const reply = await runProviderGrowthFallback("hi", toolCtx)
    expect(executeChatTool).not.toHaveBeenCalled()
    expect(reply).toContain("Starter")
    expect(reply).toContain("Professional")
  })
})
