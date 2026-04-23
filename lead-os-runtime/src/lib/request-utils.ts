/**
 * Returns the first defined, non-empty value for the given environment
 * variable keys. Useful when a setting can live under several legacy or
 * alias names.
 */
export function getEnvValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const val = process.env[key];
    if (val) return val;
  }
  return undefined;
}

/**
 * Returns `true` when at least one of the given environment variable keys
 * resolves to a non-empty string.
 */
export function hasAnyEnv(...keys: string[]): boolean {
  return keys.some((key) => !!process.env[key]);
}

/**
 * Returns the originating client IP address from well-known proxy headers,
 * falling back to "unknown" when no header is present.
 *
 * Checks `x-forwarded-for` first (standard reverse-proxy header), then
 * `x-real-ip` (nginx convention). When `x-forwarded-for` contains a
 * comma-separated chain the left-most value is the original client.
 *
 * @param request - The incoming HTTP request.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const real = request.headers.get("x-real-ip");
  if (real) return real;

  return "unknown";
}

/**
 * Returns the request ID from the `x-request-id` header, or generates a
 * fresh UUID when the header is absent. Use this value as a correlation ID
 * in logs and response headers so individual requests can be traced across
 * services.
 *
 * @param request - The incoming HTTP request.
 */
export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
