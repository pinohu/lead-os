import { getApprovedEnvMap } from "@/lib/env-map"

export async function callStripe(_input: {
  action: string
  payload: Record<string, unknown>
}): Promise<{
  ok: boolean
  status: number
  data: Record<string, unknown>
}> {
  const env = getApprovedEnvMap()
  const hasKey = Boolean(env.stripe.STRIPE_SECRET_KEY)
  return {
    ok: false,
    status: 403,
    data: {
      error: "stripe_agent_actions_disabled",
      configured: hasKey,
    },
  }
}
