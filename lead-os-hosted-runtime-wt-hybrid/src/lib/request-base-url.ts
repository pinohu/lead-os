function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

function normalizeBaseUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!/^https?:\/\//i.test(value)) return undefined;
  return value.replace(/\/+$/, "");
}

function normalizeHost(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return /^[a-z0-9.-]+(?::\d+)?$/i.test(value) ? value : undefined;
}

export function getRequestBaseUrl(request: Request): string | undefined {
  const forwardedHost = normalizeHost(firstHeaderValue(request.headers.get("x-forwarded-host")));
  const host = forwardedHost ?? normalizeHost(firstHeaderValue(request.headers.get("host")));

  if (host) {
    const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
    const proto = forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return normalizeBaseUrl(`${proto}://${host}`);
  }

  return normalizeBaseUrl(firstHeaderValue(request.headers.get("origin")));
}
