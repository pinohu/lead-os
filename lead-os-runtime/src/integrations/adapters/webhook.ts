import { getApprovedEnvMap } from "@/lib/env-map"

export async function callWebhook(input: {
  action: string
  payload: Record<string, unknown>
}): Promise<{
  ok: boolean
  status: number
  data: Record<string, unknown>
}> {
  if (input.action !== "post")
    return {
      ok: false,
      status: 400,
      data: { error: "unsupported_webhook_action" },
    }
  const payloadUrl = input.payload.url
  const url = typeof payloadUrl === "string" ? payloadUrl : ""
  if (!url)
    return {
      ok: false,
      status: 422,
      data: { error: "missing_webhook_url" },
    }
  const approvedEnv = getApprovedEnvMap()
  const fallbackApiKey = approvedEnv.email.EMAIL_WEBHOOK_API_KEY ?? ""
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(fallbackApiKey ? { "x-api-key": fallbackApiKey } : {}),
      },
      body: JSON.stringify(input.payload.body ?? {}),
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
