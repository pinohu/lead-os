import { getApprovedEnvMap } from "@/lib/env-map"

export async function callSuiteDash(input: {
  action: string
  payload: Record<string, unknown>
}): Promise<{
  ok: boolean
  status: number
  data: Record<string, unknown>
}> {
  const env = getApprovedEnvMap()
  const baseUrl = env.suitedash.SUITEDASH_BASE_URL
  const apiKey = env.suitedash.SUITEDASH_API_KEY
  if (!baseUrl || !apiKey)
    return {
      ok: false,
      status: 503,
      data: { error: "suitedash_not_configured" },
    }
  try {
    const response = await fetch(`${baseUrl}/api/${input.action}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(input.payload),
    })
    const text = await response.text()
    return {
      ok: response.ok,
      status: response.status,
      data: {
        body: text,
      },
    }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      data: {
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}
