import { NextResponse } from "next/server"

export class AuthError extends Error {
  readonly status: number

  constructor(message: string, status = 401) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

function getExpectedSecret(): string {
  const secret = process.env.LEAD_OS_AUTH_SECRET?.trim()
  if (secret) return secret
  throw new Error("LEAD_OS_AUTH_SECRET is required.")
}

export function requireAuth(req: Request): void {
  const providedSecret = req.headers.get("x-auth-secret")?.trim()
  if (!providedSecret) throw new AuthError("Missing x-auth-secret header.")

  const expectedSecret = getExpectedSecret()
  if (providedSecret !== expectedSecret) throw new AuthError("Invalid auth secret.")
}

export function toAuthErrorResponse(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
