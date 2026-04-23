import { getApprovedEnvMap } from "@/lib/env-map"

export async function callEmail(input: {
  action: string
  payload: Record<string, unknown>
}): Promise<{
  ok: boolean
  status: number
  data: Record<string, unknown>
}> {
  if (input.action !== "send")
    return {
      ok: false,
      status: 400,
      data: { error: "unsupported_email_action" },
    }
  const env = getApprovedEnvMap()
  const endpoint = env.email.EMAIL_API_URL
  const apiKey = env.email.EMAIL_API_KEY
  if (!endpoint || !apiKey)
    return {
      ok: false,
      status: 503,
      data: { error: "email_not_configured" },
    }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(input.payload),
    })
    return {
      ok: response.ok,
      status: response.status,
      data: { body: await response.text() },
    }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      data: { error: error instanceof Error ? error.message : String(error) },
    }
  }
}
