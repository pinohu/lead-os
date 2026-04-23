import { NextResponse } from "next/server";

interface ApiErrorDetail {
  field?: string;
  issue: string;
}

interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

interface ApiResponseShape<T> {
  data: T | null;
  error: ApiErrorBody | null;
  meta: Record<string, unknown> | null;
}

/**
 * Builds a successful JSON response with the standard { data, error, meta } envelope.
 *
 * @param data - The response payload.
 * @param meta - Optional metadata (pagination cursors, counts, etc.).
 * @param status - HTTP status code. Defaults to 200.
 * @param headers - Optional additional response headers.
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown> | null,
  status = 200,
  headers?: HeadersInit,
) {
  return NextResponse.json<ApiResponseShape<T>>(
    { data, error: null, meta: meta ?? null },
    { status, headers },
  );
}

/**
 * Builds an error JSON response with the standard { data, error, meta } envelope.
 *
 * @param code - Machine-readable error code (e.g. "VALIDATION_ERROR").
 * @param message - Human-readable description of the error.
 * @param status - HTTP status code. Defaults to 400.
 * @param headers - Optional additional response headers.
 * @param details - Optional per-field validation details.
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  headers?: HeadersInit,
  details?: ApiErrorDetail[],
) {
  return NextResponse.json<ApiResponseShape<null>>(
    {
      data: null,
      error: { code, message, ...(details ? { details } : {}) },
      meta: null,
    },
    { status, headers },
  );
}

/**
 * Typed error class for API boundary failures. Carries an HTTP status code,
 * a machine-readable code, and optional field-level details so callers can
 * convert it directly to an `errorResponse` without re-mapping.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Factory helpers for the most common API error cases. Each returns an
 * `ApiError` instance ready to be thrown or converted to an `errorResponse`.
 */
export const ERRORS = {
  /** 400 – Input failed schema or business-rule validation. */
  validation: (message: string, details?: ApiErrorDetail[]) =>
    new ApiError("VALIDATION_ERROR", message, 400, details),

  /** 404 – Requested resource does not exist. */
  notFound: (message = "Resource not found") =>
    new ApiError("NOT_FOUND", message, 404),

  /** 401 – Request is missing valid authentication credentials. */
  unauthorized: (message = "Authentication required") =>
    new ApiError("UNAUTHORIZED", message, 401),

  /** 403 – Caller is authenticated but lacks the required permission. */
  forbidden: (message = "Insufficient permissions") =>
    new ApiError("FORBIDDEN", message, 403),

  /** 429 – Caller has exceeded the allowed request rate. */
  rateLimited: (message = "Too many requests") =>
    new ApiError("RATE_LIMITED", message, 429),

  /** 500 – Unhandled server-side failure. Never expose internal details. */
  internal: (message = "Internal server error") =>
    new ApiError("INTERNAL_ERROR", message, 500),
};
