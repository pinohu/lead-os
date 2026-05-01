// src/lib/api/validated-json.ts
// Standard parse → validate for API mutation bodies.

import { NextResponse } from "next/server.js";
import type { ZodType } from "zod";

export async function readJsonBody(request: Request): Promise<
  { ok: true; data: unknown } | { ok: false; response: NextResponse }
> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          data: null,
          error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Content-Type must be application/json" },
        },
        { status: 415 },
      ),
    };
  }

  try {
    const data: unknown = await request.json();
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { data: null, error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
        { status: 400 },
      ),
    };
  }
}

export function validateWithSchema<T>(
  data: unknown,
  schema: ZodType<T>,
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: parsed.error.flatten(),
          },
        },
        { status: 422 },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
