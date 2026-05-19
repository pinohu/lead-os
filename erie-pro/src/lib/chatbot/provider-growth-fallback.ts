// erie-pro/src/lib/chatbot/provider-growth-fallback.ts

import { executeChatTool } from "@/lib/chatbot/tool-registry"
import {
  detectProviderPlanSlug,
  isCasualGreeting,
  isProviderPlanCheckoutIntent,
  resolvePlanSlugFromGoals,
} from "@/lib/chatbot/provider-plan-resolver"
import type { ChatToolContext, ToolResult } from "@/lib/chatbot/tools/types"

interface RecommendPlanData {
  planSlug: string
  label: string
  disclaimer?: string
}

interface CheckoutData {
  planSlug: string
  checkoutUrl: string | null
  disclaimer?: string
}

export function formatProviderGrowthPlanReply(
  recommend: ToolResult<RecommendPlanData>,
  checkout: ToolResult<CheckoutData>,
): string {
  if (!recommend.ok && !checkout.ok) {
    return "I couldn't load plan details right now. Try again in a moment or visit /for-business."
  }

  const planSlug =
    (recommend.ok ? recommend.data?.planSlug : undefined) ??
    (checkout.ok ? checkout.data?.planSlug : undefined) ??
    "starter"
  const label =
    (recommend.ok ? recommend.data?.label : undefined) ?? planSlug

  const lines: string[] = []

  if (recommend.ok && recommend.data) {
    lines.push(
      `**${recommend.data.label}** (\`${recommend.data.planSlug}\`) matches what you asked about.`,
    )
  } else {
    lines.push(`Here’s the **${label}** plan (\`${planSlug}\`).`)
  }

  if (checkout.ok && checkout.data?.checkoutUrl) {
    lines.push(`Checkout: ${checkout.data.checkoutUrl}`)
  } else if (checkout.ok) {
    lines.push(
      "A live checkout link isn't configured for this plan yet — see /for-business or tell me another plan.",
    )
  }

  const disclaimer =
    checkout.ok && checkout.data?.disclaimer
      ? checkout.data.disclaimer
      : recommend.ok
        ? recommend.data?.disclaimer
        : undefined
  if (disclaimer) lines.push(disclaimer)

  return lines.join("\n\n")
}

export async function runProviderGrowthFallback(
  userText: string,
  toolCtx: ChatToolContext,
): Promise<string> {
  const explicitPlan = detectProviderPlanSlug(userText)
  const wantsPlanHelp = Boolean(explicitPlan) || isProviderPlanCheckoutIntent(userText)

  if (wantsPlanHelp) {
    const planSlug = explicitPlan ?? resolvePlanSlugFromGoals(userText)
    const recommend = (await executeChatTool(
      "recommendProviderPlan",
      { goals: userText },
      toolCtx,
    )) as ToolResult<RecommendPlanData>
    const checkout = (await executeChatTool(
      "getThriveCartCheckoutUrl",
      { planSlug },
      toolCtx,
    )) as ToolResult<CheckoutData>
    return formatProviderGrowthPlanReply(recommend, checkout)
  }

  if (isCasualGreeting(userText)) {
    return [
      "Hi! I'm the Growth assistant for Erie.pro provider plans.",
      "Mention **Starter**, **Professional**, **Premium**, or **Elite** for plan details and a checkout link, or describe your business goals.",
    ].join(" ")
  }

  return [
    "I can explain Erie.pro provider plans and share checkout links when you're ready.",
    "Plans: **Starter**, **Professional**, **Premium**, **Elite** — name one (e.g. \"Starter\") or tell me your goals.",
  ].join(" ")
}
