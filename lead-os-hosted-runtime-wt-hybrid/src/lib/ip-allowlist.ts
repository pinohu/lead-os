export function parseIpv4(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const n = Number(part);
    if (Number.isNaN(n) || n < 0 || n > 255) return null;
    result = (result << 8) | n;
  }
  return result >>> 0;
}

export function ipMatchesCidr(ip: string, cidr: string): boolean {
  const [cidrIp, prefixStr] = cidr.split("/");
  if (!cidrIp) return false;
  const prefix = prefixStr ? Number(prefixStr) : 32;
  if (Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;
  const ipNum = parseIpv4(ip);
  const cidrNum = parseIpv4(cidrIp);
  if (ipNum === null || cidrNum === null) return false;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (cidrNum & mask);
}

export function isIpAllowed(ip: string, allowedIps: string[]): boolean {
  if (allowedIps.length === 0) return true;
  for (const allowed of allowedIps) {
    if (allowed === ip) return true;
    if (allowed.includes("/") && ipMatchesCidr(ip, allowed)) return true;
  }
  return false;
}
