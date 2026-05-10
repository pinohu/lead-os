const SUITEDASH_API_BASE_URL = "https://app.suitedash.com/secure-api"

export class SuiteDashError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string,
  ) {
    super(message)
    this.name = "SuiteDashError"
  }
}

export type SuiteDashContactPayload = {
  first_name: string
  last_name: string
  email: string
  role?: string
  company_name?: string
  phone?: string
  tags?: string[]
  notes?: string[]
  send_welcome_email?: boolean
}

export type SuiteDashResponse = {
  success: boolean
  message?: string
  data?: {
    uid?: string
    id?: string | number
    [key: string]: unknown
  }
}

function stripQuotes(value: string | undefined) {
  if (!value) return ""
  const trimmed = value.trim()
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function getSuiteDashCredentials() {
  const publicId = stripQuotes(
    process.env.SUITEDASH_YOURDEPUTY_PUBLIC_ID ||
      process.env.YOURDEPUTY_SUITEDASH_PUBLIC_ID ||
      process.env.SUITEDASH_PUBLIC_ID,
  )
  const secretKey = stripQuotes(
    process.env.SUITEDASH_YOURDEPUTY_SECRET_KEY ||
      process.env.YOURDEPUTY_SUITEDASH_SECRET_KEY ||
      process.env.SUITEDASH_SECRET_KEY,
  )

  if (!publicId || !secretKey) return null
  return { publicId, secretKey }
}

export function isSuiteDashConfigured() {
  return Boolean(getSuiteDashCredentials())
}

function getHeaders() {
  const credentials = getSuiteDashCredentials()
  if (!credentials) {
    throw new SuiteDashError(
      "Missing SuiteDash Secure API credentials. Set SUITEDASH_YOURDEPUTY_PUBLIC_ID and SUITEDASH_YOURDEPUTY_SECRET_KEY.",
    )
  }

  return {
    "X-Public-ID": credentials.publicId,
    "X-Secret-Key": credentials.secretKey,
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "EriePro-SuiteDashSync/1.0",
  }
}

function isAlreadyExists(response: SuiteDashResponse) {
  return (
    !response.success &&
    typeof response.message === "string" &&
    response.message.toLowerCase().includes("already exists")
  )
}

export function readSuiteDashRecordId(response: SuiteDashResponse) {
  const data = response.data
  const id = data?.uid ?? data?.id
  return id == null ? null : String(id)
}

export async function createSuiteDashContact(payload: SuiteDashContactPayload): Promise<SuiteDashResponse> {
  const response = await fetch(`${SUITEDASH_API_BASE_URL}/contact`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  let parsed: SuiteDashResponse
  try {
    parsed = JSON.parse(text) as SuiteDashResponse
  } catch {
    throw new SuiteDashError("Invalid JSON response from SuiteDash", response.status, text)
  }

  if (response.ok && parsed.success !== false) return parsed
  if (isAlreadyExists(parsed)) {
    return {
      success: true,
      message: "Contact already exists",
      data: parsed.data,
    }
  }

  throw new SuiteDashError(parsed.message ?? "SuiteDash contact sync failed", response.status, text)
}
