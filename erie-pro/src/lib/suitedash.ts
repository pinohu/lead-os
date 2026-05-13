const SUITEDASH_API_BASE_URL = "https://app.suitedash.com/secure-api"
const SUITEDASH_MAX_ATTEMPTS = 3

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

export type SuiteDashRequestOptions = {
  idempotencyKey?: string
  attempts?: number
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

function getHeaders(options: SuiteDashRequestOptions = {}) {
  const credentials = getSuiteDashCredentials()
  if (!credentials) {
    throw new SuiteDashError(
      "Missing SuiteDash Secure API credentials. Set SUITEDASH_YOURDEPUTY_PUBLIC_ID and SUITEDASH_YOURDEPUTY_SECRET_KEY.",
    )
  }

  return {
    "X-Public-ID": credentials.publicId,
    "X-Secret-Key": credentials.secretKey,
    ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
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

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function suiteDashRequest<TPayload>(
  path: string,
  payload: TPayload,
  options: SuiteDashRequestOptions = {},
): Promise<SuiteDashResponse> {
  const attempts = Math.max(1, options.attempts ?? SUITEDASH_MAX_ATTEMPTS)
  let lastError: SuiteDashError | null = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(`${SUITEDASH_API_BASE_URL}${path}`, {
      method: "POST",
      headers: getHeaders(options),
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

    lastError = new SuiteDashError(parsed.message ?? "SuiteDash request failed", response.status, text)
    if (!isRetryableStatus(response.status) || attempt === attempts) break
    await sleep(250 * attempt)
  }

  throw lastError ?? new SuiteDashError("SuiteDash request failed")
}

export async function createSuiteDashContact(
  payload: SuiteDashContactPayload,
  options: SuiteDashRequestOptions = {},
): Promise<SuiteDashResponse> {
  return suiteDashRequest("/contact", payload, options)
}
