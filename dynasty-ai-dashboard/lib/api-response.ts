import { NextResponse } from "next/server"

interface ApiErrorBody {
  error: string
  timestamp: string
}

export function apiError(message: string, status: number): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: message, timestamp: new Date().toISOString() },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  )
}

export function apiSuccess(data: object, cacheSeconds = 0): NextResponse {
  const headers: Record<string, string> = cacheSeconds > 0
    ? { "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}` }
    : { "Cache-Control": "no-store" }

  return NextResponse.json(
    { ...data, timestamp: new Date().toISOString() },
    { headers }
  )
}
