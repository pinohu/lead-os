// erie-pro/src/lib/__tests__/chatbot-api-errors.test.ts

import { Prisma } from "@/generated/prisma"
import { classifyChatApiError } from "@/lib/chatbot/api-errors"

describe("classifyChatApiError", () => {
  it("maps missing table (P2021) to migration message", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Table does not exist", {
      code: "P2021",
      clientVersion: "test",
    })
    const result = classifyChatApiError(err)
    expect(result.status).toBe(503)
    expect(result.code).toBe("chat_schema_missing")
    expect(result.error).toMatch(/migration/i)
  })

  it("maps database connectivity errors to 503", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Can't reach database server", {
      code: "P1001",
      clientVersion: "test",
    })
    const result = classifyChatApiError(err)
    expect(result.status).toBe(503)
    expect(result.code).toBe("database_unavailable")
  })

  it("maps missing DATABASE_URL to config message", () => {
    const result = classifyChatApiError(new Error("DATABASE_URL is not set"))
    expect(result.status).toBe(503)
    expect(result.code).toBe("database_config")
  })

  it("defaults unknown errors to 500", () => {
    const result = classifyChatApiError(new Error("boom"))
    expect(result.status).toBe(500)
    expect(result.code).toBe("internal_error")
  })
})
