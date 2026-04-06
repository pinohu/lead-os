const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.internal",
]);

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fd00:/i,
  /^fe80:/i,
];

const IP_PATTERN = /^[\d.:a-fA-F]+$/;

function isPrivateIp(hostname: string): boolean {
  return PRIVATE_IP_RANGES.some((r) => r.test(hostname));
}

export function validateExternalUrl(rawUrl: string): { valid: true; url: URL } | { valid: false; reason: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { valid: false, reason: "Invalid URL" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { valid: false, reason: "Only HTTP and HTTPS schemes are allowed" };
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, reason: "Blocked hostname" };
  }

  if (IP_PATTERN.test(hostname) && isPrivateIp(hostname)) {
    return { valid: false, reason: "Private IP addresses are not allowed" };
  }

  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { valid: false, reason: "Internal hostnames are not allowed" };
  }

  if (url.port && !["80", "443", "8080", "8443"].includes(url.port)) {
    return { valid: false, reason: "Non-standard ports are not allowed" };
  }

  if (url.username || url.password) {
    return { valid: false, reason: "Credentials in URLs are not allowed" };
  }

  return { valid: true, url };
}
