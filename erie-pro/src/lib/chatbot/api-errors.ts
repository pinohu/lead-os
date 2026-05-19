// erie-pro/src/lib/chatbot/api-errors.ts

import { Prisma } from "@/generated/prisma"

export interface ChatApiErrorResponse {
  status: number
  error: string
  code?: string
}

function prismaCode(err: unknown): string | undefined {
  if (err instanceof Prisma.PrismaClientKnownRequestError) return err.code
  if (err && typeof err === "object" && "code" in err && typeof err.code === "string") {
    return err.code
  }
  return undefined
}

function messageIncludes(err: unknown, fragment: string): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.toLowerCase().includes(fragment.toLowerCase())
}

/** Map infrastructure failures to client-safe messages for chat routes. */
export function classifyChatApiError(err: unknown): ChatApiErrorResponse {
  const code = prismaCode(err)

  if (code === "P2021") {
    return {
      status: 503,
      code: "chat_schema_missing",
      error:
        "Chat is temporarily unavailable (database migration pending). Please try again shortly or contact support.",
    }
  }

  if (
    code === "P1001" ||
    code === "P1002" ||
    code === "P1017" ||
    messageIncludes(err, "Can't reach database") ||
    messageIncludes(err, "Connection terminated")
  ) {
    return {
      status: 503,
      code: "database_unavailable",
      error: "Chat is temporarily unavailable. Please try again in a moment.",
    }
  }

  if (messageIncludes(err, "DATABASE_URL is not set")) {
    return {
      status: 503,
      code: "database_config",
      error: "Chat is not configured on this environment (missing database connection).",
    }
  }

  return {
    status: 500,
    code: "internal_error",
    error: "Internal server error",
  }
}
