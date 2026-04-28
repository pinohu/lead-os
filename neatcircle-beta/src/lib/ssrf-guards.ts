export class UnsafeTargetError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UnsafeTargetError";
    this.status = status;
  }
}

type HostnameResolver = (hostname: string) => Promise<string[]>;

type PublicHttpsTargetOptions = {
  resolveHostname?: HostnameResolver;
};

function normalizeHostname(hostname: string) {
  const value = hostname.trim().toLowerCase().replace(/\.$/, "");
  return value.startsWith("[") && value.endsWith("]")
    ? value.slice(1, -1)
    : value;
}

function parseIntegerAddress(value: string) {
  const normalized = value.toLowerCase();
  const parsed = normalized.startsWith("0x")
    ? Number.parseInt(normalized.slice(2), 16)
    : Number.parseInt(normalized, 10);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 0xffffffff) return null;

  return [
    (parsed >>> 24) & 255,
    (parsed >>> 16) & 255,
    (parsed >>> 8) & 255,
    parsed & 255,
  ];
}

function parseIpv4Address(value: string) {
  const normalized = normalizeHostname(value);

  if (/^(?:0x[0-9a-f]+|\d+)$/i.test(normalized)) {
    return parseIntegerAddress(normalized);
  }

  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)) return null;

  const parts = normalized.split(".").map((part) => Number.parseInt(part, 10));
  return parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
    ? parts
    : null;
}

function isIpv6Literal(value: string) {
  return normalizeHostname(value).includes(":");
}

function isPrivateOrReservedIpv4(value: string) {
  const parts = parseIpv4Address(value);
  if (!parts) return false;

  const [first, second, third, fourth] = parts;

  return first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 198 && (second === 18 || second === 19))
    || first >= 224
    || (first === 255 && second === 255 && third === 255 && fourth === 255);
}

function isPrivateOrReservedIpv6(value: string) {
  const normalized = normalizeHostname(value);
  if (!normalized.includes(":")) return false;

  if (
    normalized === "::"
    || normalized === "::1"
    || normalized === "0:0:0:0:0:0:0:0"
    || normalized === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    return isPrivateOrReservedIpv4(normalized.slice("::ffff:".length));
  }

  const firstHextet = normalized.split(":").find(Boolean);
  if (!firstHextet) return true;

  const firstValue = Number.parseInt(firstHextet, 16);
  if (!Number.isInteger(firstValue)) return true;

  return (firstValue & 0xfe00) === 0xfc00
    || (firstValue & 0xffc0) === 0xfe80
    || (firstValue & 0xff00) === 0xff00;
}

function isBlockedHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);

  return normalized === "localhost"
    || normalized.endsWith(".localhost")
    || normalized === "metadata"
    || normalized === "metadata.google.internal"
    || normalized.endsWith(".metadata.google.internal")
    || normalized.endsWith(".local");
}

function isIpLiteral(hostname: string) {
  return parseIpv4Address(hostname) !== null || isIpv6Literal(hostname);
}

export function isBlockedNetworkAddress(address: string) {
  return isPrivateOrReservedIpv4(address) || isPrivateOrReservedIpv6(address);
}

export async function resolveHostnameWithDns(hostname: string) {
  try {
    const dns = await import("node:dns/promises");
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    return records.map((record) => record.address);
  } catch {
    return [];
  }
}

export async function assertPublicHttpsTarget(rawUrl: string, options: PublicHttpsTargetOptions = {}) {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeTargetError("Provide a valid website URL.", 400);
  }

  if (url.protocol !== "https:") {
    throw new UnsafeTargetError("Only HTTPS website URLs can be analyzed.", 400);
  }

  if (url.username || url.password) {
    throw new UnsafeTargetError("Website URLs with embedded credentials are not allowed.", 400);
  }

  const hostname = normalizeHostname(url.hostname);
  if (!hostname) {
    throw new UnsafeTargetError("Provide a valid website URL.", 400);
  }

  if (isBlockedHostname(hostname)) {
    throw new UnsafeTargetError("That hostname is not allowed for website analysis.", 400);
  }

  if (isIpLiteral(hostname)) {
    throw new UnsafeTargetError("IP address targets are not allowed for website analysis.", 400);
  }

  const resolvedAddresses = options.resolveHostname
    ? await options.resolveHostname(hostname)
    : [];
  const blockedAddress = resolvedAddresses.find((address) => isBlockedNetworkAddress(address));

  if (blockedAddress) {
    throw new UnsafeTargetError("That hostname resolves to a restricted network address.", 400);
  }

  return url;
}
