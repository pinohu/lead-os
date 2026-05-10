export function normalizePostgresSslMode(connectionString: string): string {
  let url: URL;

  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }

  if (!url.protocol.startsWith("postgres")) {
    return connectionString;
  }

  const sslMode = url.searchParams.get("sslmode");
  const usesLibpqCompatibility = url.searchParams.get("uselibpqcompat") === "true";

  if (
    !usesLibpqCompatibility &&
    (sslMode === "require" || sslMode === "prefer" || sslMode === "verify-ca")
  ) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
